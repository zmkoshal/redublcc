import os
import re
import openpyxl
from datetime import datetime, date
from decimal import Decimal
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models import db, Statement, Transaction, AllocationCategory, AuditLog
from routes.auth_routes import token_required
from services.pdf_parser_service import PDFParserService

import_export_bp = Blueprint('import_export_bp', __name__)

@import_export_bp.route('/api/import/preview', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof', 'it_entry'])
def preview_excel_import():
    """
    Parses an uploaded statement file (Excel .xlsx or Bank Statement PDF .pdf),
    detects charge allocation headings, identifies valid transaction rows,
    calculates FBR 236Y advance tax, foreign currency conversion, and subtotal formulas,
    and generates an interactive preview.
    """
    if 'file' not in request.files:
        # Check if user requested to parse the local default workbook
        default_path = os.path.join(current_app.config['BASE_DIR'], '..', 'Credit Card sheet 28-9-26.xlsx')
        if not os.path.exists(default_path):
            return jsonify({'error': 'No file uploaded and default workbook not found'}), 400
        filepath = default_path
        filename = 'Credit Card sheet 28-9-26.xlsx'
    else:
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

    # Route 1: PDF Statement Auto-Parser
    if filename.lower().endswith('.pdf'):
        try:
            password = request.form.get('password') or None
            parsed_data = PDFParserService.parse_statement_pdf(filepath, password=password)
            return jsonify(parsed_data)
        except Exception as e:
            return jsonify({'error': f'Failed to parse PDF statement: {str(e)}'}), 400

    # Route 2: Excel Workbook Parser
    try:
        wb = openpyxl.load_workbook(filepath, data_only=True)
        ws = wb.active

        # Extract statement date from top rows if present
        detected_stmt_date = "2026-09-20"
        detected_due_date = "2026-10-11"
        for r in range(1, 4):
            val = str(ws.cell(row=r, column=2).value or '')
            if 'Statement Date' in val:
                # E.g. "Statement Date 20-Sep2026   Payment Due Date 11-Oct-2026"
                m1 = re.search(r'Statement Date\s*([0-9]{1,2}-[A-Za-z]{3}-?[0-9]{4})', val)
                m2 = re.search(r'Payment Due Date\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{4})', val)
                if m1:
                    detected_stmt_date = m1.group(1)
                if m2:
                    detected_due_date = m2.group(1)

        categories = AllocationCategory.query.all()
        cat_map = {c.code.upper(): c.id for c in categories}
        cat_name_map = {c.name.upper(): c.id for c in categories}

        current_allocation_id = cat_map.get('RED')
        current_allocation_name = "CHARGE TO RED"

        parsed_rows = []
        subtotal_rows_skipped = 0
        total_pkr = Decimal('0.00')
        total_adv = Decimal('0.00')
        total_st = Decimal('0.00')
        total_amount = Decimal('0.00')

        # Read rows
        for r in range(4, ws.max_row + 1):
            cell_b = ws.cell(row=r, column=2).value
            cell_c = ws.cell(row=r, column=3).value
            cell_d = ws.cell(row=r, column=4).value
            cell_e = ws.cell(row=r, column=5).value
            cell_f = ws.cell(row=r, column=6).value
            cell_g = ws.cell(row=r, column=7).value
            cell_h = ws.cell(row=r, column=8).value

            b_str = str(cell_b).strip() if cell_b is not None else ""

            # Check if this row is a charge allocation heading
            b_upper = b_str.upper()
            if b_upper.startswith('CHARGE TO'):
                if 'RED' in b_upper:
                    current_allocation_id = cat_map.get('RED')
                    current_allocation_name = "CHARGE TO RED"
                elif 'KKOP' in b_upper or 'KOOP' in b_upper:
                    current_allocation_id = cat_map.get('KKOP')
                    current_allocation_name = "CHARGE TO KKOP"
                elif 'PFDC' in b_upper:
                    current_allocation_id = cat_map.get('PFDC')
                    current_allocation_name = "CHARGE TO PFDC"
                elif 'HAMMAD' in b_upper:
                    current_allocation_id = cat_map.get('SYED_HAMMAD')
                    current_allocation_name = "CHARGE TO SYED HAMMAD HASAN"
                elif 'COMPANY' in b_upper:
                    current_allocation_id = cat_map.get('OTHER_COMPANIES')
                    current_allocation_name = "CHARGE TO OTHER COMPANIES"
                elif 'INDIVIDUAL' in b_upper:
                    current_allocation_id = cat_map.get('OTHER_INDIVIDUALS')
                    current_allocation_name = "CHARGE TO OTHER INDIVIDUALS"
                continue

            # Check if row is a subtotal / grand total / summary row -> SKIP
            if any(kw in b_upper for kw in ['SUBTOTAL', 'GRAND TOTAL', 'G.TOTAL', 'AMOUNT PAID', 'SUMMARY', 'IT', 'HEAD OF FINANCE', 'DETAIL']):
                subtotal_rows_skipped += 1
                continue

            # Check if row has monetary amounts
            def to_dec(val):
                if val is None or val == '':
                    return Decimal('0.00')
                try:
                    cleaned = str(val).replace(',', '').replace('$', '').strip()
                    return Decimal(cleaned)
                except Exception:
                    return Decimal('0.00')

            pkr_val = to_dec(cell_e)
            usd_val = to_dec(cell_c) if cell_c else None
            rate_val = to_dec(cell_d) if cell_d else None
            adv_tax_val = to_dec(cell_f)
            sales_tax_val = to_dec(cell_g)
            total_val = to_dec(cell_h)

            if pkr_val == Decimal('0.00') and total_val == Decimal('0.00') and not usd_val:
                # Empty spacer row
                continue

            if total_val == Decimal('0.00'):
                total_val = pkr_val + adv_tax_val + sales_tax_val

            # Row is a legitimate transaction!
            # Check row-level override in description (e.g. "CHARGE TO CLIENT" or "CHARGE TO KKOP")
            row_alloc_id = current_allocation_id
            row_alloc_name = current_allocation_name
            if 'PFDC' in b_upper or 'CLIENT' in b_upper:
                row_alloc_id = cat_map.get('PFDC', row_alloc_id)
                row_alloc_name = "CHARGE TO PFDC"
            elif 'KKOP' in b_upper or 'KOOP' in b_upper:
                row_alloc_id = cat_map.get('KKOP', row_alloc_id)
                row_alloc_name = "CHARGE TO KKOP"
            elif 'HAMMAD' in b_upper or 'NETFLIX' in b_upper:
                row_alloc_id = cat_map.get('SYED_HAMMAD', row_alloc_id)
                row_alloc_name = "CHARGE TO SYED HAMMAD HASAN"

            merchant = b_str if b_str else "Online Service"
            # Extract cleaner merchant name if verbose description
            merchant_clean = merchant.split('(')[0].split('*')[0].strip()

            parsed_rows.append({
                'row_number': r,
                'merchant_name': merchant_clean[:50],
                'description': b_str,
                'allocation_id': row_alloc_id,
                'allocation_name': row_alloc_name,
                'usd_amount': float(usd_val) if usd_val else None,
                'exchange_rate': float(rate_val) if rate_val else None,
                'pkr_amount': float(pkr_val),
                'advance_tax': float(adv_tax_val),
                'sales_tax_withheld': float(sales_tax_val),
                'other_taxes': 0.0,
                'total_amount': float(total_val),
                'is_valid': True
            })

            total_pkr += pkr_val
            total_adv += adv_tax_val
            total_st += sales_tax_val
            total_amount += total_val

        return jsonify({
            'detected_statement_date': detected_stmt_date,
            'detected_due_date': detected_due_date,
            'total_rows_found': len(parsed_rows),
            'subtotal_rows_skipped': subtotal_rows_skipped,
            'totals': {
                'pkr_amount': float(total_pkr),
                'advance_tax': float(total_adv),
                'sales_tax_withheld': float(total_st),
                'total_amount': float(total_amount)
            },
            'rows': parsed_rows
        })

    except Exception as e:
        return jsonify({'error': f'Failed to parse Excel file: {str(e)}'}), 500

@import_export_bp.route('/api/import/confirm', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof', 'it_entry'])
def confirm_excel_import():
    """
    Saves confirmed imported rows into a chosen or new statement.
    """
    data = request.get_json() or {}
    statement_id = data.get('statement_id')
    rows = data.get('rows', [])

    if not rows:
        return jsonify({'error': 'No transactions provided to import'}), 400

    stmt = None
    if statement_id:
        stmt = Statement.query.get(statement_id)
    
    if not stmt:
        stmt_num = f"UBL-IMP-{datetime.now().strftime('%Y%m%d%H%M')}"
        stmt = Statement(
            statement_number=stmt_num,
            statement_date=date.today(),
            payment_due_date=date.today(),
            status='Under Review',
            notes='Created via Excel Import Wizard',
            created_by_id=request.current_user.id
        )
        db.session.add(stmt)
        db.session.flush()

    imported_count = 0
    for r in rows:
        txn = Transaction(
            statement_id=stmt.id,
            transaction_date=stmt.statement_date,
            merchant_name=r.get('merchant_name', 'Imported Merchant'),
            description=r.get('description'),
            allocation_id=r.get('allocation_id'),
            usd_amount=Decimal(str(r['usd_amount'])) if r.get('usd_amount') else None,
            exchange_rate=Decimal(str(r['exchange_rate'])) if r.get('exchange_rate') else None,
            pkr_amount=Decimal(str(r.get('pkr_amount', 0.0))),
            advance_tax=Decimal(str(r.get('advance_tax', 0.0))),
            sales_tax_withheld=Decimal(str(r.get('sales_tax_withheld', 0.0))),
            other_taxes=Decimal(str(r.get('other_taxes', 0.0))),
            total_amount=Decimal(str(r.get('total_amount', 0.0))),
            approval_status='Approved',
            created_by_id=request.current_user.id
        )
        db.session.add(txn)
        imported_count += 1

    stmt.recalculate_totals()
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='EXCEL_IMPORT',
        entity_type='Statement',
        entity_id=str(stmt.id),
        notes=f'Imported {imported_count} transactions into statement {stmt.statement_number}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'Successfully imported {imported_count} transactions',
        'statement_id': stmt.id,
        'statement_number': stmt.statement_number
    })
