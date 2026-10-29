import sys
import os
import unittest
from decimal import Decimal

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, User, Statement, Transaction, AllocationCategory, TaxRule, Payment, ReconciliationRecord
from services.tax_service import TaxService
from services.excel_service import ExcelService
from services.pdf_service import PDFService

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
        from services.seed_service import seed_database, seed_sample_statement
        seed_database()
        seed_sample_statement()

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
        stmt = Statement.query.filter_by(statement_number='UBL-CC-2026-09').first()
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
        stmt = Statement.query.filter_by(statement_number='UBL-CC-2026-09').first()
        recon = ReconciliationRecord.query.filter_by(statement_id=stmt.id).first()
        self.assertIsNotNone(recon)
        self.assertEqual(recon.status, 'Matched')
        self.assertAlmostEqual(float(recon.difference), 0.0, places=2)

    def test_excel_export_generation(self):
        stmt = Statement.query.filter_by(statement_number='UBL-CC-2026-09').first()
        categories = AllocationCategory.query.all()
        stream = ExcelService.create_statement_excel(stmt, stmt.transactions, categories)
        self.assertGreater(len(stream.getvalue()), 1000)

    def test_pdf_export_generation(self):
        stmt = Statement.query.filter_by(statement_number='UBL-CC-2026-09').first()
        categories = AllocationCategory.query.all()
        stream = PDFService.generate_statement_pdf(stmt, stmt.transactions, categories)
        self.assertGreater(len(stream.getvalue()), 1000)

    def test_financial_summary_section(self):
        stmt = Statement.query.filter_by(statement_number='UBL-CC-2026-09').first()
        response = self.client.get(f'/api/statements/{stmt.id}/summary')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('summary_rows', data)
        self.assertGreater(len(data['summary_rows']), 0)

    def test_superadmin_user_role_and_password_reset(self):
        admin = User.query.filter_by(username='superadmin').first()
        target = User.query.filter_by(username='itadmin').first()
        self.assertIsNotNone(admin)
        self.assertIsNotNone(target)

        # 1. Test Super Admin Password Reset
        res = self.client.post(
            f'/api/users/{target.id}/reset-password',
            json={'new_password': 'NewSecurePassword@2026'}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn('successfully reset', res.get_json()['message'])
        
        # Verify password updated in DB
        db.session.refresh(target)
        self.assertTrue(target.check_password('NewSecurePassword@2026'))

        # 2. Test Super Admin Role Change
        res_role = self.client.post(
            f'/api/users/{target.id}/role',
            json={'role': 'finance_hof'}
        )
        self.assertEqual(res_role.status_code, 200)
        db.session.refresh(target)
        self.assertEqual(target.role, 'finance_hof')

if __name__ == '__main__':
    unittest.main()
