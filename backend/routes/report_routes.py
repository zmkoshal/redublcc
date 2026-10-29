from datetime import datetime
from decimal import Decimal
from flask import Blueprint, request, jsonify, send_file
from models import db, Statement, Transaction, AllocationCategory, Payment, ReconciliationRecord, AuditLog
from routes.auth_routes import token_required
from services.excel_service import ExcelService
from services.pdf_service import PDFService

report_bp = Blueprint('report_bp', __name__)

REPORT_DEFINITIONS = [
    {'id': 'ubl_statement', 'name': '1. Complete UBL Credit Card Statement', 'description': 'Full formal statement with merchant details, foreign currency, taxes, and allocation subtotals.'},
    {'id': 'transaction_detail', 'name': '2. Transaction Detail Report', 'description': 'Chronological listing of all recorded transactions with tax breakdowns and created-by metadata.'},
    {'id': 'company_allocation', 'name': '3. Company-wise Expense Allocation', 'description': 'Grouped expense allocation breakdown by corporate entities (RED, KKOP, PFDC, etc.).'},
    {'id': 'merchant_expense', 'name': '4. Merchant-wise Expense Report', 'description': 'Spending aggregated by vendor (Midjourney, OpenAI, Google Workspace, Shutterstock, etc.).'},
    {'id': 'advance_tax', 'name': '5. Advance Tax Report', 'description': 'FBR Section 236Y advance income withholding tax report for corporate tax compliance.'},
    {'id': 'sales_tax', 'name': '6. Sales Tax Report', 'description': 'Provincial sales tax withheld on IT, software subscriptions, and corporate services.'},
    {'id': 'statement_reconciliation', 'name': '7. Statement Reconciliation Report', 'description': 'Reconciliation status, bank statement comparison, variances, and sign-off status.'},
    {'id': 'outstanding_payment', 'name': '8. Outstanding Payment Report', 'description': 'Payable balances, partial payment history, and overdue status by statement.'},
    {'id': 'monthly_summary', 'name': '9. Monthly Expense Summary', 'description': 'Monthly credit card expense trends, total payments, and category allocations.'},
    {'id': 'audit_adjustment', 'name': '10. Audit and Adjustment Report', 'description': 'Complete chronological audit trail of all financial modifications and adjustments.'}
]

@report_bp.route('/api/reports/list', methods=['GET'])
@token_required()
def list_reports():
    return jsonify(REPORT_DEFINITIONS)

@report_bp.route('/api/reports/preview/<report_type>', methods=['GET'])
@token_required()
def get_report_preview(report_type):
    stmt_id = request.args.get('statement_id')
    headers, rows = _get_report_data(report_type, stmt_id)
    return jsonify({
        'report_type': report_type,
        'headers': headers,
        'rows': rows,
        'count': len(rows)
    })

@report_bp.route('/api/reports/excel/<report_type>', methods=['GET'])
@token_required()
def download_excel_report(report_type):
    stmt_id = request.args.get('statement_id')
    
    if report_type == 'ubl_statement':
        stmt = Statement.query.get(stmt_id) if stmt_id else Statement.query.order_by(Statement.id.desc()).first()
        categories = AllocationCategory.query.order_by(AllocationCategory.display_order.asc()).all()
        txns = stmt.transactions if stmt else []
        stream = ExcelService.create_statement_excel(stmt, txns, categories)
        stmt_num = stmt.statement_number if stmt else "Template"
        return send_file(
            stream,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f"UBL_Statement_{stmt_num}.xlsx"
        )
    
    # Generic reports
    headers, rows = _get_report_data(report_type, stmt_id)
    rep_title = next((r['name'] for r in REPORT_DEFINITIONS if r['id'] == report_type), "Financial Report")
    stream = ExcelService.create_generic_report(rep_title, headers, rows, f"{report_type}.xlsx")
    return send_file(
        stream,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f"{report_type}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    )

@report_bp.route('/api/reports/pdf/<report_type>', methods=['GET'])
@token_required()
def download_pdf_report(report_type):
    stmt_id = request.args.get('statement_id')
    
    if report_type == 'ubl_statement':
        stmt = Statement.query.get(stmt_id) if stmt_id else Statement.query.order_by(Statement.id.desc()).first()
        categories = AllocationCategory.query.order_by(AllocationCategory.display_order.asc()).all()
        txns = stmt.transactions if stmt else []
        pdf_stream = PDFService.generate_statement_pdf(stmt, txns, categories)
        stmt_num = stmt.statement_number if stmt else "Template"
        return send_file(
            pdf_stream,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"UBL_Statement_{stmt_num}.pdf"
        )
    
    # Generic reports PDF export
    headers, rows = _get_report_data(report_type, stmt_id)
    rep_title = next((r['name'] for r in REPORT_DEFINITIONS if r['id'] == report_type), "Financial Report")
    pdf_stream = PDFService.generate_generic_pdf(rep_title, headers, rows)
    return send_file(
        pdf_stream,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{report_type}_{datetime.now().strftime('%Y%m%d')}.pdf"
    )

def _get_report_data(report_type, stmt_id):
    """Helper to fetch data rows for any of the 10 financial reports."""
    q_txns = Transaction.query
    if stmt_id:
        q_txns = q_txns.filter_by(statement_id=stmt_id)
    txns = q_txns.order_by(Transaction.transaction_date.asc()).all()

    if report_type == 'transaction_detail':
        headers = ["Date", "Merchant", "Description", "Allocation", "USD", "Rate", "PKR", "Adv Tax", "Sales Tax", "Other Taxes", "Total PKR", "Status"]
        rows = []
        for t in txns:
            rows.append([
                t.transaction_date.isoformat(),
                t.merchant_name,
                t.description or "",
                t.allocation.name if t.allocation else "Unallocated",
                float(t.usd_amount) if t.usd_amount else 0.0,
                float(t.exchange_rate) if t.exchange_rate else 0.0,
                float(t.pkr_amount or 0.0),
                float(t.advance_tax or 0.0),
                float(t.sales_tax_withheld or 0.0),
                float(t.other_taxes or 0.0),
                float(t.total_amount or 0.0),
                t.approval_status
            ])
        return headers, rows

    elif report_type == 'company_allocation':
        headers = ["Allocation Category", "Entity Type", "Transaction Count", "Net PKR", "Advance Tax", "Sales Tax", "Total Allocated PKR"]
        categories = AllocationCategory.query.order_by(AllocationCategory.display_order.asc()).all()
        rows = []
        for cat in categories:
            cat_txns = [t for t in txns if t.allocation_id == cat.id]
            if cat_txns:
                rows.append([
                    cat.name,
                    cat.entity_type,
                    len(cat_txns),
                    float(sum(t.pkr_amount or Decimal('0.0') for t in cat_txns)),
                    float(sum(t.advance_tax or Decimal('0.0') for t in cat_txns)),
                    float(sum(t.sales_tax_withheld or Decimal('0.0') for t in cat_txns)),
                    float(sum(t.total_amount or Decimal('0.0') for t in cat_txns))
                ])
        return headers, rows

    elif report_type == 'merchant_expense':
        headers = ["Merchant / Vendor", "Transaction Count", "Foreign Currency (USD)", "PKR Amount", "Taxes & Charges", "Total Spending"]
        merchants = {}
        for t in txns:
            m = t.merchant_name
            if m not in merchants:
                merchants[m] = {'count': 0, 'usd': Decimal('0.0'), 'pkr': Decimal('0.0'), 'taxes': Decimal('0.0'), 'total': Decimal('0.0')}
            merchants[m]['count'] += 1
            if t.usd_amount:
                merchants[m]['usd'] += t.usd_amount
            merchants[m]['pkr'] += (t.pkr_amount or Decimal('0.0'))
            merchants[m]['taxes'] += ((t.advance_tax or Decimal('0.0')) + (t.sales_tax_withheld or Decimal('0.0')) + (t.other_taxes or Decimal('0.0')))
            merchants[m]['total'] += (t.total_amount or Decimal('0.0'))
        
        rows = []
        for m, data in sorted(merchants.items(), key=lambda x: x[1]['total'], reverse=True):
            rows.append([
                m,
                data['count'],
                float(data['usd']),
                float(data['pkr']),
                float(data['taxes']),
                float(data['total'])
            ])
        return headers, rows

    elif report_type == 'advance_tax':
        headers = ["Date", "Merchant", "Allocation", "PKR Base", "Advance Tax (Sec 236Y)", "Tax % Effective"]
        rows = []
        for t in txns:
            if t.advance_tax and t.advance_tax > 0:
                eff = round((float(t.advance_tax) / float(t.pkr_amount)) * 100, 2) if t.pkr_amount and t.pkr_amount > 0 else 0.0
                rows.append([
                    t.transaction_date.isoformat(),
                    t.merchant_name,
                    t.allocation.name if t.allocation else "N/A",
                    float(t.pkr_amount or 0.0),
                    float(t.advance_tax),
                    f"{eff}%"
                ])
        return headers, rows

    elif report_type == 'sales_tax':
        headers = ["Date", "Merchant", "Allocation", "PKR Base", "Sales Tax Withheld", "Additional ST", "Total ST"]
        rows = []
        for t in txns:
            if (t.sales_tax_withheld and t.sales_tax_withheld > 0) or (t.additional_sales_tax and t.additional_sales_tax > 0):
                st = float(t.sales_tax_withheld or 0.0)
                ast = float(t.additional_sales_tax or 0.0)
                rows.append([
                    t.transaction_date.isoformat(),
                    t.merchant_name,
                    t.allocation.name if t.allocation else "N/A",
                    float(t.pkr_amount or 0.0),
                    st,
                    ast,
                    st + ast
                ])
        return headers, rows

    elif report_type == 'statement_reconciliation':
        headers = ["Statement #", "Statement Date", "Bank Total", "Recorded Total", "Difference", "Matched Items", "Status", "Sign-off By"]
        recons = ReconciliationRecord.query.all()
        rows = []
        for r in recons:
            rows.append([
                r.statement.statement_number,
                r.statement.statement_date.isoformat(),
                float(r.bank_total or 0.0),
                float(r.system_total or 0.0),
                float(r.difference or 0.0),
                r.matched_count,
                r.status,
                r.reconciled_by.full_name if r.reconciled_by else "Pending"
            ])
        return headers, rows

    elif report_type == 'outstanding_payment':
        headers = ["Statement #", "Due Date", "Total Statement", "Amount Paid", "Outstanding Balance", "Status", "Days Overdue"]
        stmts = Statement.query.order_by(Statement.payment_due_date.asc()).all()
        rows = []
        today = datetime.now().date()
        for s in stmts:
            days = (today - s.payment_due_date).days if (s.payment_due_date and s.outstanding_balance > 0) else 0
            rows.append([
                s.statement_number,
                s.payment_due_date.isoformat() if s.payment_due_date else "-",
                float(s.total_statement_amount or 0.0),
                float(s.amount_paid or 0.0),
                float(s.outstanding_balance or 0.0),
                s.status,
                max(0, days)
            ])
        return headers, rows

    elif report_type == 'monthly_summary':
        headers = ["Month", "Statement Count", "Transaction Count", "Total Incurred (PKR)", "Total Taxes (PKR)", "Total Paid (PKR)"]
        stmts = Statement.query.all()
        rows = []
        months = {}
        for s in stmts:
            m_key = s.statement_date.strftime('%B %Y') if s.statement_date else "Unknown"
            if m_key not in months:
                months[m_key] = {'stmts': 0, 'txns': 0, 'incurred': Decimal('0.0'), 'taxes': Decimal('0.0'), 'paid': Decimal('0.0')}
            months[m_key]['stmts'] += 1
            months[m_key]['txns'] += len(s.transactions)
            months[m_key]['incurred'] += (s.total_statement_amount or Decimal('0.0'))
            months[m_key]['paid'] += (s.amount_paid or Decimal('0.0'))
            for t in s.transactions:
                months[m_key]['taxes'] += ((t.advance_tax or Decimal('0.0')) + (t.sales_tax_withheld or Decimal('0.0')) + (t.other_taxes or Decimal('0.0')))
        
        for m, d in months.items():
            rows.append([m, d['stmts'], d['txns'], float(d['incurred']), float(d['taxes']), float(d['paid'])])
        return headers, rows

    elif report_type == 'audit_adjustment':
        headers = ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Details / Notes", "IP Address"]
        logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(100).all()
        rows = []
        for l in logs:
            rows.append([
                l.timestamp.strftime('%Y-%m-%d %H:%M:%S') if l.timestamp else "-",
                l.user.full_name if l.user else "System",
                l.action,
                l.entity_type,
                str(l.entity_id or "-"),
                l.notes or "",
                l.ip_address or "-"
            ])
        return headers, rows

    # Default fallback:
    return ["Item", "Value"], [["Information", "Report generated"]]
