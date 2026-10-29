import json
from datetime import datetime
from decimal import Decimal
from flask import Blueprint, request, jsonify
from models import db, Statement, Transaction, AllocationCategory, AuditLog, Payment
from routes.auth_routes import token_required

statement_bp = Blueprint('statement_bp', __name__)

@statement_bp.route('/api/statements', methods=['GET'])
@token_required()
def get_statements():
    statements = Statement.query.order_by(Statement.statement_date.desc()).all()
    # Ensure totals are up to date
    for s in statements:
        s.recalculate_totals()
    db.session.commit()
    return jsonify([s.to_dict() for s in statements])

@statement_bp.route('/api/statements', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof', 'it_entry'])
def create_statement():
    data = request.get_json() or {}
    statement_number = data.get('statement_number')
    statement_date = data.get('statement_date')
    due_date = data.get('payment_due_date')

    if not statement_number or not statement_date or not due_date:
        return jsonify({'error': 'Statement Number, Statement Date and Payment Due Date are required'}), 400

    if Statement.query.filter_by(statement_number=statement_number).first():
        return jsonify({'error': 'Statement Number already exists'}), 400

    stmt = Statement(
        card_id=data.get('card_id', 1),
        statement_number=statement_number,
        statement_date=datetime.strptime(statement_date, '%Y-%m-%d').date(),
        payment_due_date=datetime.strptime(due_date, '%Y-%m-%d').date(),
        period_start_date=datetime.strptime(data['period_start_date'], '%Y-%m-%d').date() if data.get('period_start_date') else None,
        period_end_date=datetime.strptime(data['period_end_date'], '%Y-%m-%d').date() if data.get('period_end_date') else None,
        opening_balance=Decimal(str(data.get('opening_balance', 0.0))),
        status=data.get('status', 'Draft'),
        notes=data.get('notes'),
        created_by_id=request.current_user.id
    )
    db.session.add(stmt)
    db.session.commit()

    # Audit Log
    audit = AuditLog(
        user_id=request.current_user.id,
        action='CREATE',
        entity_type='Statement',
        entity_id=str(stmt.id),
        new_values=json.dumps(stmt.to_dict()),
        notes=f'Statement {stmt.statement_number} created',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(stmt.to_dict()), 201

@statement_bp.route('/api/statements/<int:stmt_id>', methods=['GET'])
@token_required()
def get_statement(stmt_id):
    stmt = Statement.query.get_or_404(stmt_id)
    stmt.recalculate_totals()
    db.session.commit()
    data = stmt.to_dict()
    data['transactions'] = [t.to_dict() for t in stmt.transactions]
    data['payments'] = [p.to_dict() for p in stmt.payments]
    return jsonify(data)

@statement_bp.route('/api/statements/<int:stmt_id>', methods=['PUT'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def update_statement(stmt_id):
    stmt = Statement.query.get_or_404(stmt_id)
    data = request.get_json() or {}
    old_values = json.dumps(stmt.to_dict())

    if 'statement_date' in data and data['statement_date']:
        stmt.statement_date = datetime.strptime(data['statement_date'], '%Y-%m-%d').date()
    if 'payment_due_date' in data and data['payment_due_date']:
        stmt.payment_due_date = datetime.strptime(data['payment_due_date'], '%Y-%m-%d').date()
    if 'period_start_date' in data and data['period_start_date']:
        stmt.period_start_date = datetime.strptime(data['period_start_date'], '%Y-%m-%d').date()
    if 'period_end_date' in data and data['period_end_date']:
        stmt.period_end_date = datetime.strptime(data['period_end_date'], '%Y-%m-%d').date()
    if 'opening_balance' in data:
        stmt.opening_balance = Decimal(str(data['opening_balance']))
    if 'status' in data:
        stmt.status = data['status']
    if 'notes' in data:
        stmt.notes = data['notes']

    stmt.recalculate_totals()
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='UPDATE',
        entity_type='Statement',
        entity_id=str(stmt.id),
        old_values=old_values,
        new_values=json.dumps(stmt.to_dict()),
        notes=f'Statement {stmt.statement_number} updated',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(stmt.to_dict())

@statement_bp.route('/api/statements/<int:stmt_id>/status', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def update_statement_status(stmt_id):
    stmt = Statement.query.get_or_404(stmt_id)
    data = request.get_json() or {}
    new_status = data.get('status')
    
    if new_status not in ['Draft', 'Under Review', 'Approved', 'Partially Paid', 'Paid', 'Overdue']:
        return jsonify({'error': 'Invalid status'}), 400

    old_status = stmt.status
    stmt.status = new_status
    if new_status == 'Approved':
        stmt.approved_by_id = request.current_user.id
        stmt.approved_at = datetime.utcnow()

    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='STATUS_CHANGE',
        entity_type='Statement',
        entity_id=str(stmt.id),
        notes=f'Changed status from {old_status} to {new_status}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(stmt.to_dict())

@statement_bp.route('/api/statements/<int:stmt_id>', methods=['DELETE'])
@token_required(allowed_roles=['super_admin'])
def delete_statement(stmt_id):
    stmt = Statement.query.get_or_404(stmt_id)
    if stmt.status == 'Approved':
        return jsonify({'error': 'Approved statements cannot be deleted to preserve financial audit trail'}), 400

    old_values = json.dumps(stmt.to_dict())
    stmt_num = stmt.statement_number
    db.session.delete(stmt)
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='DELETE',
        entity_type='Statement',
        entity_id=str(stmt_id),
        old_values=old_values,
        notes=f'Statement {stmt_num} deleted',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': 'Statement deleted successfully'})

@statement_bp.route('/api/statements/<int:stmt_id>/grouped', methods=['GET'])
@token_required()
def get_statement_grouped(stmt_id):
    """
    Returns transactions grouped by allocation category exactly as structured in Excel sheet,
    with calculated subtotals (PKR, Adv Tax, Sales Tax, Total) and grand totals.
    """
    stmt = Statement.query.get_or_404(stmt_id)
    categories = AllocationCategory.query.order_by(AllocationCategory.display_order.asc()).all()
    
    grouped_result = []
    grand_pkr = Decimal('0.00')
    grand_adv_tax = Decimal('0.00')
    grand_sales_tax = Decimal('0.00')
    grand_other = Decimal('0.00')
    grand_total = Decimal('0.00')

    # Transactions map
    txns = stmt.transactions
    for cat in categories:
        cat_txns = [t for t in txns if t.allocation_id == cat.id]
        if not cat_txns:
            continue
        
        sub_pkr = sum(t.pkr_amount or Decimal('0.00') for t in cat_txns)
        sub_adv = sum(t.advance_tax or Decimal('0.00') for t in cat_txns)
        sub_st = sum(t.sales_tax_withheld or Decimal('0.00') for t in cat_txns)
        sub_oth = sum((t.additional_sales_tax or Decimal('0.00')) + 
                      (t.fed_amount or Decimal('0.00')) + 
                      (t.bank_charges or Decimal('0.00')) + 
                      (t.other_taxes or Decimal('0.00')) for t in cat_txns)
        sub_tot = sum(t.total_amount or Decimal('0.00') for t in cat_txns)

        grand_pkr += sub_pkr
        grand_adv_tax += sub_adv
        grand_sales_tax += sub_st
        grand_other += sub_oth
        grand_total += sub_tot

        grouped_result.append({
            'category': cat.to_dict(),
            'transactions': [t.to_dict() for t in cat_txns],
            'subtotal': {
                'pkr_amount': float(sub_pkr),
                'advance_tax': float(sub_adv),
                'sales_tax_withheld': float(sub_st),
                'other_charges': float(sub_oth),
                'total_amount': float(sub_tot)
            }
        })

    # Unallocated transactions if any
    unallocated_txns = [t for t in txns if not t.allocation_id]
    if unallocated_txns:
        sub_pkr = sum(t.pkr_amount or Decimal('0.00') for t in unallocated_txns)
        sub_adv = sum(t.advance_tax or Decimal('0.00') for t in unallocated_txns)
        sub_st = sum(t.sales_tax_withheld or Decimal('0.00') for t in unallocated_txns)
        sub_oth = sum((t.other_taxes or Decimal('0.00')) for t in unallocated_txns)
        sub_tot = sum(t.total_amount or Decimal('0.00') for t in unallocated_txns)

        grand_pkr += sub_pkr
        grand_adv_tax += sub_adv
        grand_sales_tax += sub_st
        grand_other += sub_oth
        grand_total += sub_tot

        grouped_result.append({
            'category': {'id': None, 'code': 'UNALLOCATED', 'name': 'CHARGE TO UNALLOCATED', 'entity_type': 'Other'},
            'transactions': [t.to_dict() for t in unallocated_txns],
            'subtotal': {
                'pkr_amount': float(sub_pkr),
                'advance_tax': float(sub_adv),
                'sales_tax_withheld': float(sub_st),
                'other_charges': float(sub_oth),
                'total_amount': float(sub_tot)
            }
        })

    return jsonify({
        'statement': stmt.to_dict(),
        'groups': grouped_result,
        'grand_total': {
            'pkr_amount': float(grand_pkr),
            'advance_tax': float(grand_adv_tax),
            'sales_tax_withheld': float(grand_sales_tax),
            'other_charges': float(grand_other),
            'total_amount': float(grand_total),
            'amount_paid': float(stmt.amount_paid or 0.0),
            'outstanding_balance': float(grand_total - (stmt.amount_paid or Decimal('0.00')))
        }
    })

@statement_bp.route('/api/statements/<int:stmt_id>/summary', methods=['GET'])
@token_required()
def get_statement_summary(stmt_id):
    """
    Automated summary matching the SUMMARY section (rows 84-90) of the workbook.
    Returns charge per company/individual and total reconciliation.
    """
    stmt = Statement.query.get_or_404(stmt_id)
    categories = AllocationCategory.query.order_by(AllocationCategory.display_order.asc()).all()
    
    summary_items = []
    running_total = Decimal('0.00')

    for cat in categories:
        cat_txns = [t for t in stmt.transactions if t.allocation_id == cat.id]
        cat_amount = sum(t.total_amount or Decimal('0.00') for t in cat_txns)
        running_total += cat_amount
        summary_items.append({
            'category_id': cat.id,
            'code': cat.code,
            'name': cat.name,
            'entity_type': cat.entity_type,
            'transaction_count': len(cat_txns),
            'amount': float(cat_amount)
        })

    return jsonify({
        'statement_id': stmt.id,
        'statement_number': stmt.statement_number,
        'summary_rows': summary_items,
        'grand_total': float(running_total),
        'amount_paid': float(stmt.amount_paid or 0.0),
        'remaining_balance': float(running_total - (stmt.amount_paid or Decimal('0.00')))
    })
