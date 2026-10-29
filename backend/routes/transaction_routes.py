import json
from datetime import datetime
from decimal import Decimal
from flask import Blueprint, request, jsonify
from models import db, Transaction, Statement, AllocationCategory, AuditLog, ExpenseAllocationSplit
from routes.auth_routes import token_required

transaction_bp = Blueprint('transaction_bp', __name__)

@transaction_bp.route('/api/transactions', methods=['GET'])
@token_required()
def get_transactions():
    query = Transaction.query

    statement_id = request.args.get('statement_id')
    if statement_id:
        query = query.filter_by(statement_id=statement_id)

    allocation_id = request.args.get('allocation_id')
    if allocation_id:
        query = query.filter_by(allocation_id=allocation_id)

    merchant = request.args.get('merchant')
    if merchant:
        query = query.filter(Transaction.merchant_name.ilike(f'%{merchant}%'))

    search = request.args.get('search')
    if search:
        query = query.filter(
            (Transaction.merchant_name.ilike(f'%{search}%')) |
            (Transaction.description.ilike(f'%{search}%')) |
            (Transaction.notes.ilike(f'%{search}%'))
        )

    approval_status = request.args.get('approval_status')
    if approval_status:
        query = query.filter_by(approval_status=approval_status)

    transactions = query.order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).all()
    return jsonify([t.to_dict() for t in transactions])

@transaction_bp.route('/api/transactions', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof', 'it_entry'])
def create_transaction():
    data = request.get_json() or {}
    statement_id = data.get('statement_id')
    txn_date_str = data.get('transaction_date')
    merchant_name = data.get('merchant_name', '').strip()

    if not statement_id or not txn_date_str or not merchant_name:
        return jsonify({'error': 'Statement ID, Transaction Date, and Merchant Name are required'}), 400

    stmt = Statement.query.get(statement_id)
    if not stmt:
        return jsonify({'error': 'Invalid statement ID'}), 404

    usd_amount = Decimal(str(data['usd_amount'])) if data.get('usd_amount') else None
    exchange_rate = Decimal(str(data['exchange_rate'])) if data.get('exchange_rate') else None
    pkr_amount = Decimal(str(data.get('pkr_amount', 0.0)))
    
    # Auto-calculate PKR if USD and rate provided
    if usd_amount and exchange_rate and pkr_amount == Decimal('0.00'):
        pkr_amount = round(usd_amount * exchange_rate, 2)
    elif usd_amount and pkr_amount and (not exchange_rate or exchange_rate == Decimal('0.00')):
        exchange_rate = round(pkr_amount / usd_amount, 4)

    adv_tax = Decimal(str(data.get('advance_tax', 0.0)))
    sales_tax = Decimal(str(data.get('sales_tax_withheld', 0.0)))
    additional_st = Decimal(str(data.get('additional_sales_tax', 0.0)))
    fed = Decimal(str(data.get('fed_amount', 0.0)))
    bank_charges = Decimal(str(data.get('bank_charges', 0.0)))
    other_taxes = Decimal(str(data.get('other_taxes', 0.0)))

    txn = Transaction(
        statement_id=statement_id,
        transaction_date=datetime.strptime(txn_date_str, '%Y-%m-%d').date(),
        merchant_name=merchant_name,
        description=data.get('description'),
        allocation_id=data.get('allocation_id'),
        usd_amount=usd_amount,
        exchange_rate=exchange_rate,
        pkr_amount=pkr_amount,
        advance_tax=adv_tax,
        sales_tax_withheld=sales_tax,
        additional_sales_tax=additional_st,
        fed_amount=fed,
        bank_charges=bank_charges,
        other_taxes=other_taxes,
        receipt_path=data.get('receipt_path'),
        notes=data.get('notes'),
        approval_status=data.get('approval_status', 'Approved'),
        created_by_id=request.current_user.id
    )
    txn.calculate_totals()
    db.session.add(txn)
    db.session.flush()

    # Multi-allocation splits if provided
    splits_data = data.get('splits', [])
    for sp in splits_data:
        split = ExpenseAllocationSplit(
            transaction_id=txn.id,
            allocation_id=sp['allocation_id'],
            allocated_pkr=Decimal(str(sp['allocated_pkr'])),
            percentage=Decimal(str(sp.get('percentage', 0.0))),
            notes=sp.get('notes')
        )
        db.session.add(split)

    stmt.recalculate_totals()
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='CREATE',
        entity_type='Transaction',
        entity_id=str(txn.id),
        new_values=json.dumps(txn.to_dict()),
        notes=f'Added transaction {txn.merchant_name} (PKR {txn.total_amount})',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(txn.to_dict()), 201

@transaction_bp.route('/api/transactions/<int:txn_id>', methods=['GET'])
@token_required()
def get_transaction(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    return jsonify(txn.to_dict())

@transaction_bp.route('/api/transactions/<int:txn_id>', methods=['PUT'])
@token_required(allowed_roles=['super_admin', 'finance_hof', 'it_entry'])
def update_transaction(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    data = request.get_json() or {}
    old_values = json.dumps(txn.to_dict())

    if 'transaction_date' in data and data['transaction_date']:
        txn.transaction_date = datetime.strptime(data['transaction_date'], '%Y-%m-%d').date()
    if 'merchant_name' in data:
        txn.merchant_name = data['merchant_name']
    if 'description' in data:
        txn.description = data['description']
    if 'allocation_id' in data:
        txn.allocation_id = data['allocation_id']
    if 'usd_amount' in data:
        txn.usd_amount = Decimal(str(data['usd_amount'])) if data['usd_amount'] is not None else None
    if 'exchange_rate' in data:
        txn.exchange_rate = Decimal(str(data['exchange_rate'])) if data['exchange_rate'] is not None else None
    if 'pkr_amount' in data and data['pkr_amount'] is not None:
        txn.pkr_amount = Decimal(str(data['pkr_amount']))
    if 'advance_tax' in data and data['advance_tax'] is not None:
        txn.advance_tax = Decimal(str(data['advance_tax']))
    if 'sales_tax_withheld' in data and data['sales_tax_withheld'] is not None:
        txn.sales_tax_withheld = Decimal(str(data['sales_tax_withheld']))
    if 'additional_sales_tax' in data and data['additional_sales_tax'] is not None:
        txn.additional_sales_tax = Decimal(str(data['additional_sales_tax']))
    if 'fed_amount' in data and data['fed_amount'] is not None:
        txn.fed_amount = Decimal(str(data['fed_amount']))
    if 'bank_charges' in data and data['bank_charges'] is not None:
        txn.bank_charges = Decimal(str(data['bank_charges']))
    if 'other_taxes' in data and data['other_taxes'] is not None:
        txn.other_taxes = Decimal(str(data['other_taxes']))
    if 'notes' in data:
        txn.notes = data['notes']
    if 'approval_status' in data:
        # IT Entry cannot approve statements or transactions without Finance authorization
        if request.current_user.role == 'it_entry' and data['approval_status'] == 'Approved':
            pass
        else:
            txn.approval_status = data['approval_status']

    txn.calculate_totals()
    txn.statement.recalculate_totals()
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='UPDATE',
        entity_type='Transaction',
        entity_id=str(txn.id),
        old_values=old_values,
        new_values=json.dumps(txn.to_dict()),
        notes=f'Updated transaction {txn.merchant_name}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(txn.to_dict())

@transaction_bp.route('/api/transactions/<int:txn_id>/duplicate', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof', 'it_entry'])
def duplicate_transaction(txn_id):
    original = Transaction.query.get_or_404(txn_id)
    new_txn = Transaction(
        statement_id=original.statement_id,
        transaction_date=original.transaction_date,
        merchant_name=f"{original.merchant_name} (Copy)",
        description=original.description,
        allocation_id=original.allocation_id,
        usd_amount=original.usd_amount,
        exchange_rate=original.exchange_rate,
        pkr_amount=original.pkr_amount,
        advance_tax=original.advance_tax,
        sales_tax_withheld=original.sales_tax_withheld,
        additional_sales_tax=original.additional_sales_tax,
        fed_amount=original.fed_amount,
        bank_charges=original.bank_charges,
        other_taxes=original.other_taxes,
        total_amount=original.total_amount,
        notes=original.notes,
        approval_status='Approved',
        created_by_id=request.current_user.id
    )
    db.session.add(new_txn)
    db.session.flush()
    original.statement.recalculate_totals()
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='DUPLICATE',
        entity_type='Transaction',
        entity_id=str(new_txn.id),
        notes=f'Duplicated from transaction #{original.id}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(new_txn.to_dict()), 201

@transaction_bp.route('/api/transactions/<int:txn_id>', methods=['DELETE'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def delete_transaction(txn_id):
    txn = Transaction.query.get_or_404(txn_id)
    old_values = json.dumps(txn.to_dict())
    stmt = txn.statement

    db.session.delete(txn)
    db.session.flush()
    stmt.recalculate_totals()
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='DELETE',
        entity_type='Transaction',
        entity_id=str(txn_id),
        old_values=old_values,
        notes='Deleted transaction',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': 'Transaction deleted successfully'})
