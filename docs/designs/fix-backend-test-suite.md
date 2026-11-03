# Design Specification: Backend Test Suite Decoupling & Fixes

**Author / Architect**: The Elephant (EGM Workflow)  
**Reviewer**: The Goldfish (EGM Adversarial Subagent)  
**Date**: 2026-11-04  
**Status**: REVISED (Incorporating Goldfish Review Findings)  
**Target File**: `backend/tests/test_system.py`

---

## 1. Problem Statement & Root Cause Analysis

### 1.1 Symptoms
Running `python backend/tests/test_system.py` currently results in **6 failures/errors out of 8 tests**:
```
Ran 8 tests in ~26s
FAILED (failures=2, errors=4)
```

### 1.2 Root Cause
1. **Commit `1c37671` disabled `seed_sample_statement()`**:
   ```python
   def seed_sample_statement():
       return  # Permanently disabled UBL-CC-2026-09
   ```
   All statement tests (`test_statement_grouping_and_subtotals`, `test_reconciliation_zero_variance`, `test_excel_export_generation`, `test_pdf_export_generation`, `test_financial_summary_section`) relied directly on `UBL-CC-2026-09` being present in the in-memory SQLite database. Since it is no longer seeded, `stmt` is `None`, leading to `AttributeError: 'NoneType' object has no attribute 'transactions'` and `AssertionError: unexpectedly None`.

2. **User Seed Rename**:
   In `test_superadmin_user_role_and_password_reset`:
   ```python
   target = User.query.filter_by(username='itadmin').first()
   ```
   `seed_database()` was updated to seed `umair` (`umair.rafique@red.com.pk`) as the IT Data Entry specialist (`role='it_entry'`). There is no user with username `itadmin`, causing `target` to be `None`.

3. **Tight Coupling between Test Suite and Production Seed Data**:
   Unit and integration tests currently depend on the mutable implementation details of `seed_sample_statement()`. Tests should be hermetic, self-contained, and idempotent.

---

## 2. Design Goals & Scope

### 2.1 Goals
* **100% Hermetic Test Isolation**: Tests must create their own dedicated test fixtures (`Statement`, `Transaction`, `Payment`, `ReconciliationRecord`) in `setUp()` without altering `seed_service.py`'s production configuration.
* **Deterministic Fixtures**: The test statement fixture uses a dedicated identifier (`TEST-STMT-2026-01`) with complete, non-nullable schema compliance and predictable amounts, categories, and tax withholdings.
* **Full Authentication Compliance**: Use valid JWT authorization headers for protected admin endpoints in tests.
* **100% Pass Rate**: All 8 tests must pass with zero errors, verifying:
  1. API Health Check
  2. Currency & Statutory Tax Calculations (Section 236Y + FED)
  3. Statement Grouping, Category Subtotals, and Grand Total matching
  4. Reconciliation zero variance and difference tracking
  5. Excel Statement Generation (`openpyxl` byte stream validation)
  6. PDF Statement Generation (`reportlab` byte stream validation)
  7. Financial Summary Section API breakdown
  8. Superadmin user management (Password Reset + Role Assignment)

### 2.2 Non-Goals
* Re-enabling `UBL-CC-2026-09` in production `seed_service.py` or frontend `mockBackend.ts` (this statement was deliberately decommissioned).
* Modifying business logic in `TaxService`, `ExcelService`, or `PDFService`.

---

## 3. Detailed Technical Specification

### 3.1 Test Fixture Setup in `FinancialSystemTestCase.setUp()`

In `setUp()`, clean up obsolete calls (`seed_sample_statement()` is removed). Master data (`User`, `CreditCard`, `AllocationCategory`, `TaxRule`) is initialized once per test context.

```python
# 1. Master Data References
card = CreditCard.query.filter_by(bank_name='UBL', card_number_last4='9821').first()
admin_user = User.query.filter_by(username='superadmin').first()
cat_map = {c.code: c for c in AllocationCategory.query.all()}

# 2. Statement Fixture (All non-nullable columns satisfied)
stmt = Statement(
    card_id=card.id if card else None,
    statement_number='TEST-STMT-2026-01',
    statement_date=date(2026, 10, 20),
    payment_due_date=date(2026, 11, 10),       # Mandatory non-nullable
    period_start_date=date(2026, 9, 21),
    period_end_date=date(2026, 10, 20),
    opening_balance=Decimal('0.00'),
    total_statement_amount=Decimal('100000.00'),
    amount_paid=Decimal('50000.00'),
    outstanding_balance=Decimal('50000.00'),
    status='Partially Paid',
    notes='Deterministic test fixture for backend test suite',
    created_by_id=admin_user.id if admin_user else None
)
db.session.add(stmt)
db.session.flush()

# 3. Transaction Fixtures (All non-nullable columns & foreign keys satisfied)
txns = [
    Transaction(
        statement_id=stmt.id,                    # Mandatory foreign key
        transaction_date=date(2026, 10, 1),      # Mandatory non-nullable
        merchant_name='Cloud Infrastructure Ltd',# Mandatory non-nullable
        description='Cloud Hosting Subscription',
        allocation_id=cat_map['RED'].id,         # Valid allocation foreign key
        usd_amount=Decimal('100.00'),
        exchange_rate=Decimal('280.0000'),
        pkr_amount=Decimal('28000.00'),
        advance_tax=Decimal('1400.00'),
        sales_tax_withheld=Decimal('0.00'),
        other_taxes=Decimal('0.00'),
        total_amount=Decimal('29400.00'),
        approval_status='Approved',
        created_by_id=admin_user.id if admin_user else None
    ),
    Transaction(
        statement_id=stmt.id,                    # Mandatory foreign key
        transaction_date=date(2026, 10, 5),      # Mandatory non-nullable
        merchant_name='KKOP Vendor Services',    # Mandatory non-nullable
        description='Operational Supplies',
        allocation_id=cat_map['KKOP'].id,        # Valid allocation foreign key
        usd_amount=None,
        exchange_rate=None,
        pkr_amount=Decimal('50000.00'),
        advance_tax=Decimal('0.00'),
        sales_tax_withheld=Decimal('2500.00'),
        other_taxes=Decimal('0.00'),
        total_amount=Decimal('52500.00'),
        approval_status='Approved',
        created_by_id=admin_user.id if admin_user else None
    ),
    Transaction(
        statement_id=stmt.id,                    # Mandatory foreign key
        transaction_date=date(2026, 10, 10),     # Mandatory non-nullable
        merchant_name='PFDC Event Services',     # Mandatory non-nullable
        description='Design Council Client Work',
        allocation_id=cat_map['PFDC'].id,        # Valid allocation foreign key
        usd_amount=None,
        exchange_rate=None,
        pkr_amount=Decimal('18100.00'),
        advance_tax=Decimal('0.00'),
        sales_tax_withheld=Decimal('0.00'),
        other_taxes=Decimal('0.00'),
        total_amount=Decimal('18100.00'),
        approval_status='Approved',
        created_by_id=admin_user.id if admin_user else None
    )
]
for t in txns:
    db.session.add(t)

# 4. Payment Fixture (All non-nullable columns satisfied)
pmt = Payment(
    statement_id=stmt.id,                        # Mandatory foreign key
    payment_date=date(2026, 10, 25),             # Mandatory non-nullable
    payment_reference='TEST-PAY-99482',          # Mandatory non-nullable
    payment_method='Online Transfer',
    amount=Decimal('50000.00'),
    notes='Test partial settlement',
    recorded_by_id=admin_user.id if admin_user else None
)
db.session.add(pmt)

# 5. Reconciliation Record Fixture (All non-nullable columns satisfied)
recon = ReconciliationRecord(
    statement_id=stmt.id,                        # Mandatory foreign key
    status='Matched',
    bank_total=Decimal('100000.00'),
    system_total=Decimal('100000.00'),
    difference=Decimal('0.00'),
    matched_count=3,
    missing_count=0,
    discrepancy_count=0,
    notes='Test reconciliation verified',
    reconciled_by_id=admin_user.id if admin_user else None,
    reconciled_at=datetime.utcnow()
)
db.session.add(recon)
db.session.commit()
```

### 3.2 Updating Test Assertions in `test_system.py`

1. **`test_statement_grouping_and_subtotals`**:
   - Query `Statement.query.filter_by(statement_number='TEST-STMT-2026-01').first()`
   - Assert `grand_total['total_amount']` matches `sum(t.total_amount for t in stmt.transactions)` (100,000.00).
   - Assert `grand_total['amount_paid']` matches `float(stmt.amount_paid)` (50,000.00).

2. **`test_reconciliation_zero_variance`**:
   - Query `ReconciliationRecord.query.filter_by(statement_id=stmt.id).first()`.
   - Assert `recon.status == 'Matched'` and `float(recon.difference) == 0.0`.

3. **`test_excel_export_generation` & `test_pdf_export_generation`**:
   - Query `TEST-STMT-2026-01` and pass `stmt.transactions`.
   - Validate generated stream length > 1,000 bytes.

4. **`test_financial_summary_section`**:
   - Request `/api/statements/{stmt.id}/summary`.
   - Assert HTTP 200, check `summary_rows` contains rows for each category.

5. **`test_superadmin_user_role_and_password_reset`**:
   - Query `admin = User.query.filter_by(username='superadmin').first()`.
   - Query target user: `target = User.query.filter_by(username='umair').first()` (`role='it_entry'`).
   - Pass JWT auth header `headers={'Authorization': f'Bearer {token}'}` generated from `admin.id` (or fallback).
   - Verify password reset endpoint succeeds and `target.check_password('NewSecurePassword@2026')` returns `True`.
   - Verify role update endpoint updates role to `finance_hof`.

---

## 4. Verification & Acceptance Criteria

1. Running `python backend/tests/test_system.py` outputs:
   ```
   Ran 8 tests in < 35s
   OK
   ```
2. Zero failures, zero errors (`failures=0, errors=0`).
3. Zero side-effects on SQLite production database file (`backend/taniisha_cc.db`).
