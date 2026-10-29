import json
from datetime import datetime
from decimal import Decimal
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

def decimal_to_float(val):
    if val is None:
        return 0.0
    return float(val)

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    # Roles: super_admin, finance_hof, it_entry, management_readonly
    role = db.Column(db.String(50), nullable=False, default='it_entry')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class CreditCard(db.Model):
    __tablename__ = 'credit_cards'

    id = db.Column(db.Integer, primary_key=True)
    bank_name = db.Column(db.String(100), nullable=False, default='UBL')
    card_holder_name = db.Column(db.String(120), nullable=False)
    card_number_last4 = db.Column(db.String(4), nullable=False)
    card_type = db.Column(db.String(50), default='Corporate Visa/Mastercard')
    currency = db.Column(db.String(10), default='PKR')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    statements = db.relationship('Statement', backref='credit_card', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'bank_name': self.bank_name,
            'card_holder_name': self.card_holder_name,
            'card_number_last4': self.card_number_last4,
            'card_type': self.card_type,
            'currency': self.currency,
            'is_active': self.is_active
        }

class Statement(db.Model):
    __tablename__ = 'statements'

    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('credit_cards.id'), nullable=True)
    statement_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    statement_date = db.Column(db.Date, nullable=False)
    payment_due_date = db.Column(db.Date, nullable=False)
    period_start_date = db.Column(db.Date, nullable=True)
    period_end_date = db.Column(db.Date, nullable=True)
    
    opening_balance = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    total_statement_amount = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    amount_paid = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    outstanding_balance = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    
    # Status: Draft, Under Review, Approved, Partially Paid, Paid, Overdue
    status = db.Column(db.String(30), default='Draft', nullable=False)
    notes = db.Column(db.Text, nullable=True)
    attachment_path = db.Column(db.String(255), nullable=True)
    
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = db.relationship('Transaction', backref='statement', cascade="all, delete-orphan", lazy=True)
    payments = db.relationship('Payment', backref='statement', cascade="all, delete-orphan", lazy=True)
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    approved_by = db.relationship('User', foreign_keys=[approved_by_id])

    def recalculate_totals(self):
        total_pkr = sum(t.pkr_amount or Decimal('0.00') for t in self.transactions)
        total_tax = sum((t.advance_tax or Decimal('0.00')) + 
                        (t.sales_tax_withheld or Decimal('0.00')) + 
                        (t.other_taxes or Decimal('0.00')) for t in self.transactions)
        total_trans = sum(t.total_amount or Decimal('0.00') for t in self.transactions)
        self.total_statement_amount = total_trans
        
        paid = sum(p.amount or Decimal('0.00') for p in self.payments)
        self.amount_paid = paid
        self.outstanding_balance = self.total_statement_amount - self.amount_paid
        
        # update status based on payment
        if self.status not in ['Draft', 'Under Review']:
            if self.outstanding_balance <= Decimal('0.00') and self.total_statement_amount > Decimal('0.00'):
                self.status = 'Paid'
            elif paid > Decimal('0.00') and self.outstanding_balance > Decimal('0.00'):
                self.status = 'Partially Paid'

    def to_dict(self):
        return {
            'id': self.id,
            'card_id': self.card_id,
            'credit_card': self.credit_card.to_dict() if self.credit_card else None,
            'statement_number': self.statement_number,
            'statement_date': self.statement_date.isoformat() if self.statement_date else None,
            'payment_due_date': self.payment_due_date.isoformat() if self.payment_due_date else None,
            'period_start_date': self.period_start_date.isoformat() if self.period_start_date else None,
            'period_end_date': self.period_end_date.isoformat() if self.period_end_date else None,
            'opening_balance': decimal_to_float(self.opening_balance),
            'total_statement_amount': decimal_to_float(self.total_statement_amount),
            'amount_paid': decimal_to_float(self.amount_paid),
            'outstanding_balance': decimal_to_float(self.outstanding_balance),
            'status': self.status,
            'notes': self.notes,
            'attachment_path': self.attachment_path,
            'created_by': self.created_by.full_name if self.created_by else 'System',
            'approved_by': self.approved_by.full_name if self.approved_by else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'transaction_count': len(self.transactions) if self.transactions else 0
        }

class AllocationCategory(db.Model):
    __tablename__ = 'allocation_categories'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    entity_type = db.Column(db.String(50), default='Company')  # Company, Individual, Client
    description = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'entity_type': self.entity_type,
            'description': self.description,
            'is_active': self.is_active,
            'display_order': self.display_order
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    statement_id = db.Column(db.Integer, db.ForeignKey('statements.id'), nullable=False, index=True)
    transaction_date = db.Column(db.Date, nullable=False)
    merchant_name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Primary Charge Allocation
    allocation_id = db.Column(db.Integer, db.ForeignKey('allocation_categories.id'), nullable=True)
    
    # Currency calculations
    usd_amount = db.Column(db.Numeric(15, 2), nullable=True)
    exchange_rate = db.Column(db.Numeric(15, 4), nullable=True)
    pkr_amount = db.Column(db.Numeric(15, 2), nullable=False, default=Decimal('0.00'))
    
    # Tax fields
    advance_tax = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    sales_tax_withheld = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    additional_sales_tax = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    fed_amount = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    bank_charges = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    other_taxes = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    
    # Total Transaction Amount = pkr_amount + taxes + charges
    total_amount = db.Column(db.Numeric(15, 2), nullable=False, default=Decimal('0.00'))
    
    receipt_path = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Audit and Approval
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approval_status = db.Column(db.String(30), default='Approved')  # Pending, Approved, Rejected
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    allocation = db.relationship('AllocationCategory', foreign_keys=[allocation_id])
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    splits = db.relationship('ExpenseAllocationSplit', backref='transaction', cascade="all, delete-orphan", lazy=True)

    def calculate_totals(self):
        if self.usd_amount and self.exchange_rate and (not self.pkr_amount or self.pkr_amount == Decimal('0.00')):
            self.pkr_amount = round(self.usd_amount * self.exchange_rate, 2)
        elif self.usd_amount and self.pkr_amount and (not self.exchange_rate or self.exchange_rate == Decimal('0.00')):
            if self.usd_amount > 0:
                self.exchange_rate = round(self.pkr_amount / self.usd_amount, 4)
                
        taxes_sum = (
            (self.advance_tax or Decimal('0.00')) +
            (self.sales_tax_withheld or Decimal('0.00')) +
            (self.additional_sales_tax or Decimal('0.00')) +
            (self.fed_amount or Decimal('0.00')) +
            (self.bank_charges or Decimal('0.00')) +
            (self.other_taxes or Decimal('0.00'))
        )
        self.total_amount = (self.pkr_amount or Decimal('0.00')) + taxes_sum

    def to_dict(self):
        return {
            'id': self.id,
            'statement_id': self.statement_id,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'merchant_name': self.merchant_name,
            'description': self.description,
            'allocation_id': self.allocation_id,
            'allocation': self.allocation.to_dict() if self.allocation else None,
            'usd_amount': decimal_to_float(self.usd_amount),
            'exchange_rate': decimal_to_float(self.exchange_rate),
            'pkr_amount': decimal_to_float(self.pkr_amount),
            'advance_tax': decimal_to_float(self.advance_tax),
            'sales_tax_withheld': decimal_to_float(self.sales_tax_withheld),
            'additional_sales_tax': decimal_to_float(self.additional_sales_tax),
            'fed_amount': decimal_to_float(self.fed_amount),
            'bank_charges': decimal_to_float(self.bank_charges),
            'other_taxes': decimal_to_float(self.other_taxes),
            'total_amount': decimal_to_float(self.total_amount),
            'receipt_path': self.receipt_path,
            'notes': self.notes,
            'created_by': self.created_by.full_name if self.created_by else 'System',
            'created_by_id': self.created_by_id,
            'approval_status': self.approval_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'splits': [s.to_dict() for s in self.splits] if self.splits else []
        }

class ExpenseAllocationSplit(db.Model):
    __tablename__ = 'expense_allocation_splits'

    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)
    allocation_id = db.Column(db.Integer, db.ForeignKey('allocation_categories.id'), nullable=False)
    allocated_pkr = db.Column(db.Numeric(15, 2), nullable=False)
    percentage = db.Column(db.Numeric(5, 2), nullable=True)
    notes = db.Column(db.String(255), nullable=True)

    allocation = db.relationship('AllocationCategory')

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'allocation_id': self.allocation_id,
            'allocation': self.allocation.to_dict() if self.allocation else None,
            'allocated_pkr': decimal_to_float(self.allocated_pkr),
            'percentage': decimal_to_float(self.percentage),
            'notes': self.notes
        }

class TaxRule(db.Model):
    __tablename__ = 'tax_rules'

    id = db.Column(db.Integer, primary_key=True)
    rule_name = db.Column(db.String(100), nullable=False)
    # Tax Types: ADVANCE_TAX, SALES_TAX_WITHHELD, ADDITIONAL_ST, FED, BANK_CHARGES
    tax_type = db.Column(db.String(50), nullable=False)
    # Calculation Types: PERCENTAGE, FIXED, FORMULA
    calc_type = db.Column(db.String(30), default='PERCENTAGE')
    default_rate = db.Column(db.Numeric(8, 4), default=Decimal('0.00')) # e.g. 5.0 for 5%, or 0.16 for 16%
    is_active = db.Column(db.Boolean, default=True)
    rounding_method = db.Column(db.String(30), default='ROUND_HALF_UP')
    description = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'rule_name': self.rule_name,
            'tax_type': self.tax_type,
            'calc_type': self.calc_type,
            'default_rate': decimal_to_float(self.default_rate),
            'is_active': self.is_active,
            'rounding_method': self.rounding_method,
            'description': self.description
        }

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    statement_id = db.Column(db.Integer, db.ForeignKey('statements.id'), nullable=False, index=True)
    payment_date = db.Column(db.Date, nullable=False)
    payment_reference = db.Column(db.String(100), nullable=False)
    payment_method = db.Column(db.String(50), default='Online Transfer') # Online Transfer, Cheque, Direct Debit
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    receipt_path = db.Column(db.String(255), nullable=True)
    recorded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recorded_by = db.relationship('User', foreign_keys=[recorded_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'statement_id': self.statement_id,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_reference': self.payment_reference,
            'payment_method': self.payment_method,
            'amount': decimal_to_float(self.amount),
            'notes': self.notes,
            'receipt_path': self.receipt_path,
            'recorded_by': self.recorded_by.full_name if self.recorded_by else 'Finance User',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ReconciliationRecord(db.Model):
    __tablename__ = 'reconciliation_records'

    id = db.Column(db.Integer, primary_key=True)
    statement_id = db.Column(db.Integer, db.ForeignKey('statements.id'), nullable=False, unique=True)
    # Status: Unreconciled, Matched, Discrepancy, Reconciled
    status = db.Column(db.String(40), default='Unreconciled')
    bank_total = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    system_total = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    difference = db.Column(db.Numeric(15, 2), default=Decimal('0.00'))
    matched_count = db.Column(db.Integer, default=0)
    missing_count = db.Column(db.Integer, default=0)
    discrepancy_count = db.Column(db.Integer, default=0)
    details_json = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    reconciled_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reconciled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    statement = db.relationship('Statement', backref=db.backref('reconciliation', uselist=False))
    reconciled_by = db.relationship('User', foreign_keys=[reconciled_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'statement_id': self.statement_id,
            'status': self.status,
            'bank_total': decimal_to_float(self.bank_total),
            'system_total': decimal_to_float(self.system_total),
            'difference': decimal_to_float(self.difference),
            'matched_count': self.matched_count,
            'missing_count': self.missing_count,
            'discrepancy_count': self.discrepancy_count,
            'details': json.loads(self.details_json) if self.details_json else [],
            'notes': self.notes,
            'reconciled_by': self.reconciled_by.full_name if self.reconciled_by else None,
            'reconciled_at': self.reconciled_at.isoformat() if self.reconciled_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(50), nullable=False) # CREATE, UPDATE, DELETE, APPROVE, RECONCILE, PAYMENT, IMPORT
    entity_type = db.Column(db.String(50), nullable=False) # Statement, Transaction, TaxRule, Payment, Allocation
    entity_id = db.Column(db.String(50), nullable=True)
    old_values = db.Column(db.Text, nullable=True)
    new_values = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else 'System',
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'old_values': json.loads(self.old_values) if self.old_values else None,
            'new_values': json.loads(self.new_values) if self.new_values else None,
            'notes': self.notes,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class ApplicationSetting(db.Model):
    __tablename__ = 'application_settings'

    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False)
    setting_value = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'key': self.setting_key,
            'value': self.setting_value,
            'description': self.description
        }
