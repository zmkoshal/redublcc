import os
import sys
import unittest
from datetime import date
from decimal import Decimal
import openpyxl

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, Statement, Transaction, AllocationCategory
from services.excel_service import ExcelService
from services.pdf_service import PDFService

class TestLogoInExports(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def test_logo_path_resolution(self):
        excel_logo = ExcelService.get_logo_path()
        pdf_logo = PDFService.get_logo_path()
        self.assertIsNotNone(excel_logo)
        self.assertIsNotNone(pdf_logo)
        self.assertTrue(os.path.exists(excel_logo))
        self.assertTrue(os.path.exists(pdf_logo))

    def test_excel_export_has_logo(self):
        cat = AllocationCategory.query.first() or AllocationCategory(code='RED', name='CHARGE TO RED', entity_type='Company', description='Test')
        stmt = Statement(
            statement_number='TEST-LOGO-01',
            statement_date=date(2026, 9, 20),
            payment_due_date=date(2026, 10, 11),
            status='Draft',
            total_statement_amount=Decimal('5000.00'),
            amount_paid=Decimal('0.00'),
            outstanding_balance=Decimal('5000.00')
        )
        tx = Transaction(
            merchant_name='TEST MERCHANT',
            pkr_amount=Decimal('5000.00'),
            total_amount=Decimal('5000.00'),
            approval_status='Approved',
            allocation_id=cat.id if hasattr(cat, 'id') else None
        )
        
        # Statement Excel
        excel_stream = ExcelService.create_statement_excel(stmt, [tx], [cat])
        self.assertGreater(len(excel_stream.getvalue()), 1000)
        
        # Inspect that worksheet has image drawings
        wb = openpyxl.load_workbook(excel_stream)
        ws = wb.active
        self.assertGreater(len(ws._images), 0, "Excel sheet should contain at least one embedded logo image")

        # Generic Excel
        gen_stream = ExcelService.create_generic_report("Test Title", ["Col A", "Col B"], [["Val 1", "Val 2"]], "test.xlsx")
        self.assertGreater(len(gen_stream.getvalue()), 1000)
        wb_gen = openpyxl.load_workbook(gen_stream)
        self.assertGreater(len(wb_gen.active._images), 0, "Generic report should contain embedded logo image")

    def test_pdf_export_has_logo(self):
        cat = AllocationCategory.query.first() or AllocationCategory(code='RED', name='CHARGE TO RED', entity_type='Company', description='Test')
        stmt = Statement(
            statement_number='TEST-LOGO-01',
            statement_date=date(2026, 9, 20),
            payment_due_date=date(2026, 10, 11),
            status='Draft',
            total_statement_amount=Decimal('5000.00'),
            amount_paid=Decimal('0.00'),
            outstanding_balance=Decimal('5000.00')
        )
        tx = Transaction(
            merchant_name='TEST MERCHANT',
            pkr_amount=Decimal('5000.00'),
            total_amount=Decimal('5000.00'),
            approval_status='Approved',
            allocation_id=cat.id if hasattr(cat, 'id') else None
        )
        pdf_stream = PDFService.generate_statement_pdf(stmt, [tx], [cat])
        pdf_bytes = pdf_stream.getvalue()
        self.assertGreater(len(pdf_bytes), 5000, "PDF stream should be generated with embedded image")

if __name__ == '__main__':
    unittest.main()
