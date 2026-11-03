import sys
import os
import unittest
from datetime import date, datetime
from decimal import Decimal

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, User, CreditCard, Statement, Transaction, AllocationCategory, TaxRule, Payment, ReconciliationRecord
from services.tax_service import TaxService
from services.excel_service import ExcelService
from services.pdf_service import PDFService
from routes.auth_routes import create_token
from config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class FinancialSystemTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        from services.seed_service import seed_database
        seed_database()

        # 1. Master Data References
        card = CreditCard.query.filter_by(bank_name='UBL', card_number_last4='9821').first()
        admin_user = User.query.filter_by(username='superadmin').first()
        cat_map = {c.code: c for c in AllocationCategory.query.all()}

        # 2. Statement Fixture (Hermetic, fully compliant with non-nullable constraints)
        stmt = Statement(
            card_id=card.id if card else None,
            statement_number='TEST-STMT-2026-01',
            statement_date=date(2026, 10, 20),
            payment_due_date=date(2026, 11, 10),
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

        # 3. Transaction Fixtures (All non-nullable columns and foreign keys satisfied)
        txns = [
            Transaction(
                statement_id=stmt.id,
                transaction_date=date(2026, 10, 1),
                merchant_name='Cloud Infrastructure Ltd',
                description='Cloud Hosting Subscription',
                allocation_id=cat_map['RED'].id,
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
                statement_id=stmt.id,
                transaction_date=date(2026, 10, 5),
                merchant_name='KKOP Vendor Services',
                description='Operational Supplies',
                allocation_id=cat_map['KKOP'].id,
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
                statement_id=stmt.id,
                transaction_date=date(2026, 10, 10),
                merchant_name='PFDC Event Services',
                description='Design Council Client Work',
                allocation_id=cat_map['PFDC'].id,
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

        # 4. Payment Fixture
        pmt = Payment(
            statement_id=stmt.id,
            payment_date=date(2026, 10, 25),
            payment_reference='TEST-PAY-99482',
            payment_method='Online Transfer',
            amount=Decimal('50000.00'),
            notes='Test partial settlement',
            recorded_by_id=admin_user.id if admin_user else None
        )
        db.session.add(pmt)

        # 5. Reconciliation Record Fixture
        recon = ReconciliationRecord(
            statement_id=stmt.id,
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

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_health_check(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'healthy')

    def test_currency_and_tax_calculations(self):
        # 1. USD 100 at Rate 280 -> PKR 28000
        res = TaxService.calculate_transaction_taxes(
            usd_amount=100.0,
            pkr_amount=0.0,
            exchange_rate=280.0,
            manual_overrides={'advance_tax': 1400.0, 'fed_amount': 40.0}
        )
        self.assertEqual(res['pkr_amount'], 28000.0)
        self.assertEqual(res['total_taxes'], 1440.0)
        self.assertEqual(res['total_amount'], 29440.0)

        # 2. Both USD and PKR provided -> auto rate calculation
        res2 = TaxService.calculate_transaction_taxes(
            usd_amount=50.0,
            pkr_amount=15000.0,
            exchange_rate=0.0
        )
        self.assertEqual(res2['exchange_rate'], 300.0)

    def test_statement_grouping_and_subtotals(self):
        stmt = Statement.query.filter_by(statement_number='TEST-STMT-2026-01').first()
        self.assertIsNotNone(stmt)
        
        response = self.client.get(f'/api/statements/{stmt.id}/grouped')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        
        self.assertIn('groups', data)
        self.assertIn('grand_total', data)
        self.assertGreater(len(data['groups']), 0)
        
        # Verify grand total matches statement's recorded total
        expected_total = sum(t.total_amount for t in stmt.transactions)
        self.assertAlmostEqual(data['grand_total']['total_amount'], float(expected_total), places=2)
        self.assertAlmostEqual(data['grand_total']['amount_paid'], float(stmt.amount_paid), places=2)

    def test_reconciliation_zero_variance(self):
        stmt = Statement.query.filter_by(statement_number='TEST-STMT-2026-01').first()
        recon = ReconciliationRecord.query.filter_by(statement_id=stmt.id).first()
        self.assertIsNotNone(recon)
        self.assertEqual(recon.status, 'Matched')
        self.assertAlmostEqual(float(recon.difference), 0.0, places=2)

    def test_excel_export_generation(self):
        stmt = Statement.query.filter_by(statement_number='TEST-STMT-2026-01').first()
        categories = AllocationCategory.query.all()
        stream = ExcelService.create_statement_excel(stmt, stmt.transactions, categories)
        self.assertGreater(len(stream.getvalue()), 1000)

    def test_pdf_export_generation(self):
        stmt = Statement.query.filter_by(statement_number='TEST-STMT-2026-01').first()
        categories = AllocationCategory.query.all()
        stream = PDFService.generate_statement_pdf(stmt, stmt.transactions, categories)
        self.assertGreater(len(stream.getvalue()), 1000)

    def test_financial_summary_section(self):
        stmt = Statement.query.filter_by(statement_number='TEST-STMT-2026-01').first()
        response = self.client.get(f'/api/statements/{stmt.id}/summary')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('summary_rows', data)
        self.assertGreater(len(data['summary_rows']), 0)

    def test_superadmin_user_role_and_password_reset(self):
        admin = User.query.filter_by(username='superadmin').first()
        target = User.query.filter_by(username='umair').first()
        self.assertIsNotNone(admin)
        self.assertIsNotNone(target)

        auth_headers = {'Authorization': f'Bearer {create_token(admin)}'}

        # 1. Test Super Admin Password Reset
        res = self.client.post(
            f'/api/users/{target.id}/reset-password',
            json={'new_password': 'NewSecurePassword@2026'},
            headers=auth_headers
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn('successfully reset', res.get_json()['message'])
        
        # Verify password updated in DB
        db.session.refresh(target)
        self.assertTrue(target.check_password('NewSecurePassword@2026'))

        # 2. Test Super Admin Role Change
        res_role = self.client.post(
            f'/api/users/{target.id}/role',
            json={'role': 'finance_hof'},
            headers=auth_headers
        )
        self.assertEqual(res_role.status_code, 200)
        db.session.refresh(target)
        self.assertEqual(target.role, 'finance_hof')

if __name__ == '__main__':
    unittest.main()
