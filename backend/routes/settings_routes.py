from decimal import Decimal
from flask import Blueprint, request, jsonify
from models import db, Statement, Transaction, AllocationCategory, ApplicationSetting, Payment
from routes.auth_routes import token_required

settings_bp = Blueprint('settings_bp', __name__)

@settings_bp.route('/api/dashboard/stats', methods=['GET'])
@token_required()
def get_dashboard_stats():
    stmt_id = request.args.get('statement_id')
    
    q_txns = Transaction.query
    q_stmts = Statement.query
    if stmt_id:
        q_txns = q_txns.filter_by(statement_id=stmt_id)
        q_stmts = q_stmts.filter_by(id=stmt_id)

    txns = q_txns.all()
    stmts = q_stmts.all()

    # Recalculate statements
    total_statement_amount = sum(s.total_statement_amount or Decimal('0.0') for s in stmts)
    total_paid = sum(s.amount_paid or Decimal('0.0') for s in stmts)
    remaining_balance = sum(s.outstanding_balance or Decimal('0.0') for s in stmts)

    total_pkr_trans = sum(t.pkr_amount or Decimal('0.0') for t in txns)
    total_adv_tax = sum(t.advance_tax or Decimal('0.0') for t in txns)
    total_sales_tax = sum(t.sales_tax_withheld or Decimal('0.0') for t in txns)
    total_bank_charges = sum((t.bank_charges or Decimal('0.0')) + (t.fed_amount or Decimal('0.0')) for t in txns)

    # Category totals
    cat_red = AllocationCategory.query.filter_by(code='RED').first()
    cat_kkop = AllocationCategory.query.filter_by(code='KKOP').first()
    cat_pfdc = AllocationCategory.query.filter_by(code='PFDC').first()
    cat_hammad = AllocationCategory.query.filter_by(code='SYED_HAMMAD').first()
    cat_ind = AllocationCategory.query.filter_by(code='OTHER_INDIVIDUALS').first()

    red_total = sum(t.total_amount or Decimal('0.0') for t in txns if t.allocation_id == (cat_red.id if cat_red else -1))
    kkop_total = sum(t.total_amount or Decimal('0.0') for t in txns if t.allocation_id == (cat_kkop.id if cat_kkop else -1))
    pfdc_total = sum(t.total_amount or Decimal('0.0') for t in txns if t.allocation_id == (cat_pfdc.id if cat_pfdc else -1))
    hammad_total = sum(t.total_amount or Decimal('0.0') for t in txns if t.allocation_id == (cat_hammad.id if cat_hammad else -1))
    other_ind_total = sum(t.total_amount or Decimal('0.0') for t in txns if t.allocation_id == (cat_ind.id if cat_ind else -1))
    individual_total = hammad_total + other_ind_total

    # Chart 1: Expenses by Company / Individual
    chart_allocation = []
    categories = AllocationCategory.query.order_by(AllocationCategory.display_order.asc()).all()
    for cat in categories:
        amt = sum(t.total_amount or Decimal('0.0') for t in txns if t.allocation_id == cat.id)
        if amt > 0:
            chart_allocation.append({'name': cat.name.replace('CHARGE TO ', ''), 'value': float(amt), 'code': cat.code})

    # Chart 2: Expenses by Top Merchants
    merch_map = {}
    for t in txns:
        m = t.merchant_name
        merch_map[m] = merch_map.get(m, Decimal('0.0')) + (t.total_amount or Decimal('0.0'))
    chart_merchants = [
        {'merchant': m, 'amount': float(val)}
        for m, val in sorted(merch_map.items(), key=lambda x: x[1], reverse=True)[:8]
    ]

    # Chart 3: Tax Breakdown
    chart_taxes = [
        {'name': 'Advance Tax (Sec 236Y)', 'value': float(total_adv_tax)},
        {'name': 'Sales Tax Withheld', 'value': float(total_sales_tax)},
        {'name': 'Bank Fees & Charges', 'value': float(sum(t.bank_charges or Decimal('0.0') for t in txns))},
        {'name': 'Federal Excise Duty (FED)', 'value': float(sum(t.fed_amount or Decimal('0.0') for t in txns))},
        {'name': 'Additional ST & Other', 'value': float(sum((t.additional_sales_tax or Decimal('0.0')) + (t.other_taxes or Decimal('0.0')) for t in txns))}
    ]
    chart_taxes = [c for c in chart_taxes if c['value'] > 0]

    # Chart 4: FX vs Direct PKR
    fx_total = sum(t.pkr_amount or Decimal('0.0') for t in txns if t.usd_amount and t.usd_amount > 0)
    direct_pkr_total = sum(t.pkr_amount or Decimal('0.0') for t in txns if not t.usd_amount or t.usd_amount == 0)
    chart_fx_vs_pkr = [
        {'type': 'Foreign Currency (USD)', 'amount': float(fx_total)},
        {'type': 'Direct PKR Expenses', 'amount': float(direct_pkr_total)}
    ]

    # Chart 5: Paid vs Unpaid Statements
    all_stmts = Statement.query.all()
    chart_paid_unpaid = [
        {'status': 'Paid', 'amount': float(sum(s.amount_paid or Decimal('0.0') for s in all_stmts))},
        {'status': 'Unpaid / Outstanding', 'amount': float(sum(s.outstanding_balance or Decimal('0.0') for s in all_stmts))}
    ]

    # Chart 6: Monthly spending trends
    chart_monthly = []
    for s in Statement.query.order_by(Statement.statement_date.asc()).all():
        chart_monthly.append({
            'month': s.statement_date.strftime('%b %Y') if s.statement_date else s.statement_number,
            'total': float(s.total_statement_amount or 0.0),
            'paid': float(s.amount_paid or 0.0),
            'outstanding': float(s.outstanding_balance or 0.0)
        })

    return jsonify({
        'kpis': {
            'total_statement_amount': float(total_statement_amount),
            'total_transaction_amount': float(total_pkr_trans),
            'total_advance_tax': float(total_adv_tax),
            'total_sales_tax_withheld': float(total_sales_tax),
            'total_bank_charges': float(total_bank_charges),
            'total_red': float(red_total),
            'total_kkop': float(kkop_total),
            'total_pfdc': float(pfdc_total),
            'total_individual': float(individual_total),
            'total_paid': float(total_paid),
            'remaining_balance': float(remaining_balance)
        },
        'charts': {
            'by_allocation': chart_allocation,
            'by_merchant': chart_merchants,
            'tax_breakdown': chart_taxes,
            'fx_vs_pkr': chart_fx_vs_pkr,
            'paid_vs_unpaid': chart_paid_unpaid,
            'monthly_trend': chart_monthly
        }
    })

@settings_bp.route('/api/settings', methods=['GET'])
@token_required()
def get_settings():
    settings = ApplicationSetting.query.all()
    # Default initial settings if empty
    if not settings:
        defaults = [
            ('company_name', 'RED PUBLICIS (COMMUNICATION ARTS)', 'Official legal company title'),
            ('default_currency', 'PKR', 'Base financial currency'),
            ('default_bank', 'UBL', 'Primary corporate credit card issuing bank'),
            ('exchange_rate_auto_fetch', 'true', 'Automatically compute USD/PKR rate on input'),
            ('auto_reconcile_threshold', '0.01', 'Maximum allowable rounding difference for matched reconciliation'),
            ('fbr_section_236y_rate', '5.0', 'Standard withholding percentage under Sec 236Y')
        ]
        for k, v, d in defaults:
            s = ApplicationSetting(setting_key=k, setting_value=v, description=d)
            db.session.add(s)
        db.session.commit()
        settings = ApplicationSetting.query.all()

    return jsonify([s.to_dict() for s in settings])

@settings_bp.route('/api/settings', methods=['POST'])
@token_required(allowed_roles=['super_admin'])
def update_settings():
    data = request.get_json() or {}
    for k, v in data.items():
        s = ApplicationSetting.query.filter_by(setting_key=k).first()
        if s:
            s.setting_value = str(v)
        else:
            s = ApplicationSetting(setting_key=k, setting_value=str(v), description="")
    db.session.commit()
    return jsonify({'message': 'Settings saved successfully'})

@settings_bp.route('/api/settings/clear-transaction-data', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def clear_transaction_data():
    from models import ReconciliationRecord, AuditLog
    Transaction.query.delete()
    Payment.query.delete()
    ReconciliationRecord.query.delete()
    Statement.query.delete()
    AuditLog.query.delete()
    db.session.commit()
    return jsonify({
        'status': 'success',
        'message': 'All statements, transactions, payments, reconciliations, and audit records have been cleared. Database is fresh for your own entries.'
    })

@settings_bp.route('/api/settings/database-info', methods=['GET'])
@token_required()
def get_database_info():
    import os
    from flask import current_app
    from models import Statement, Transaction, User, AllocationCategory, TaxRule, Payment, ReconciliationRecord, AuditLog
    
    uri = current_app.config['SQLALCHEMY_DATABASE_URI']
    is_sqlite = 'sqlite' in uri
    db_file = 'red_publicis.db'
    db_size = 0
    if is_sqlite:
        raw_path = uri.replace('sqlite:///', '')
        if os.path.exists(raw_path):
            db_file = os.path.basename(raw_path)
            db_size = os.path.getsize(raw_path)
    
    counts = {
        'statements': Statement.query.count(),
        'transactions': Transaction.query.count(),
        'users': User.query.count(),
        'categories': AllocationCategory.query.count(),
        'tax_rules': TaxRule.query.count(),
        'payments': Payment.query.count(),
        'reconciliations': ReconciliationRecord.query.count(),
        'audit_logs': AuditLog.query.count(),
    }
    
    return jsonify({
        'engine': 'SQLite' if is_sqlite else 'PostgreSQL/Other',
        'database_file': db_file,
        'database_size_bytes': db_size,
        'database_size_kb': round(db_size / 1024, 2),
        'status': 'Connected & Operational',
        'journal_mode': 'WAL' if is_sqlite else 'N/A',
        'foreign_keys': True,
        'record_counts': counts
    })

@settings_bp.route('/api/settings/database-backup', methods=['GET'])
@token_required(allowed_roles=['super_admin'])
def download_database_backup():
    import os
    from datetime import datetime
    from flask import send_file, current_app
    
    uri = current_app.config['SQLALCHEMY_DATABASE_URI']
    if 'sqlite' in uri:
        raw_path = uri.replace('sqlite:///', '')
        if os.path.exists(raw_path):
            return send_file(
                raw_path,
                as_attachment=True,
                download_name=f"red_publicis_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
            )
    return jsonify({'error': 'Backup only supported for SQLite database'}), 400

