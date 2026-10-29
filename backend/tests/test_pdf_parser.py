import unittest
import io
from decimal import Decimal
from pypdf import PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db
from services.pdf_parser_service import PDFParserService

class TestPDFParserService(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def test_pdf_parsing_and_auto_formulas(self):
        # Create a mock bank statement PDF in memory using ReportLab
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=letter)
        
        # Header
        c.drawString(50, 750, "UNITED BANK LIMITED - CREDIT CARD STATEMENT")
        c.drawString(50, 730, "Statement Date: 20-Sep-2026   Payment Due Date: 11-Oct-2026")
        c.drawString(50, 715, "Card Number: 4129-XXXX-XXXX-9821")
        
        # Transactions Table
        c.drawString(50, 680, "DATE       POST DATE   TRANSACTION DETAILS                 AMOUNT (PKR)")
        c.drawString(50, 660, "15-Sep-26  16-Sep-26   MIDJOURNEY INC SF US  USD 10.00     2,924.43 DR")
        c.drawString(50, 640, "16-Sep-26  17-Sep-26   ADVANCE TAX ON FOREIGN SPEND        146.22 DR")
        c.drawString(50, 620, "18-Sep-26  19-Sep-26   GOOGLE WORKSPACE GSUITE USD 28.00   8,188.40 DR")
        c.drawString(50, 600, "20-Sep-26  21-Sep-26   UBL SMS ALERT CHARGES               250.00 DR")
        
        c.save()
        buf.seek(0)
        
        # Parse with PDFParserService
        result = PDFParserService.parse_statement_pdf(buf)
        
        self.assertIsNotNone(result)
        self.assertEqual(result['detected_statement_date'], '2026-09-20')
        self.assertEqual(result['detected_due_date'], '2026-10-11')
        self.assertTrue(result['total_rows_found'] >= 2)
        
        rows = result['rows']
        # Midjourney should have linked tax 146.22
        mj_row = next((r for r in rows if 'MIDJOURNEY' in r['merchant_name'].upper()), None)
        self.assertIsNotNone(mj_row)
        self.assertEqual(mj_row['usd_amount'], 10.0)
        self.assertEqual(mj_row['pkr_amount'], 2924.43)
        self.assertEqual(mj_row['advance_tax'], 146.22)
        self.assertAlmostEqual(mj_row['exchange_rate'], 292.443, places=2)
        self.assertAlmostEqual(mj_row['total_amount'], 2924.43 + 146.22, places=2)
        self.assertEqual(mj_row['allocation_name'], 'CHARGE TO RED')
        
        # Google Workspace should have auto-calculated 5% advance tax
        google_row = next((r for r in rows if 'GOOGLE' in r['merchant_name'].upper()), None)
        self.assertIsNotNone(google_row)
        self.assertEqual(google_row['usd_amount'], 28.0)
        self.assertEqual(google_row['pkr_amount'], 8188.4)
        expected_tax = float(Decimal('8188.40') * Decimal('0.05'))
        self.assertAlmostEqual(google_row['advance_tax'], expected_tax, places=2)

if __name__ == '__main__':
    unittest.main()
