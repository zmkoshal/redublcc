import json
from decimal import Decimal
from flask import Blueprint, request, jsonify
from models import db, AllocationCategory, Transaction, AuditLog
from routes.auth_routes import token_required

allocation_bp = Blueprint('allocation_bp', __name__)

@allocation_bp.route('/api/allocations', methods=['GET'])
@token_required()
def get_allocations():
    categories = AllocationCategory.query.order_by(AllocationCategory.display_order.asc(), AllocationCategory.name.asc()).all()
    return jsonify([c.to_dict() for c in categories])

@allocation_bp.route('/api/allocations', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def create_allocation():
    data = request.get_json() or {}
    code = data.get('code', '').strip().upper()
    name = data.get('name', '').strip()
    entity_type = data.get('entity_type', 'Company')
    desc = data.get('description', '')

    if not code or not name:
        return jsonify({'error': 'Code and Name are required'}), 400

    if AllocationCategory.query.filter_by(code=code).first():
        return jsonify({'error': 'Category Code already exists'}), 400

    cat = AllocationCategory(
        code=code,
        name=name,
        entity_type=entity_type,
        description=desc,
        is_active=data.get('is_active', True),
        display_order=data.get('display_order', 10)
    )
    db.session.add(cat)
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='CREATE',
        entity_type='AllocationCategory',
        entity_id=str(cat.id),
        new_values=json.dumps(cat.to_dict()),
        notes=f'Created allocation category {cat.code}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(cat.to_dict()), 201

@allocation_bp.route('/api/allocations/<int:cat_id>', methods=['PUT'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def update_allocation(cat_id):
    cat = AllocationCategory.query.get_or_404(cat_id)
    data = request.get_json() or {}
    old_values = json.dumps(cat.to_dict())

    if 'name' in data:
        cat.name = data['name']
    if 'entity_type' in data:
        cat.entity_type = data['entity_type']
    if 'description' in data:
        cat.description = data['description']
    if 'is_active' in data:
        cat.is_active = data['is_active']
    if 'display_order' in data:
        cat.display_order = data['display_order']

    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='UPDATE',
        entity_type='AllocationCategory',
        entity_id=str(cat.id),
        old_values=old_values,
        new_values=json.dumps(cat.to_dict()),
        notes=f'Updated allocation category {cat.code}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(cat.to_dict())

@allocation_bp.route('/api/allocations/<int:cat_id>', methods=['DELETE'])
@token_required(allowed_roles=['super_admin'])
def delete_allocation(cat_id):
    cat = AllocationCategory.query.get_or_404(cat_id)
    # Check if used in transactions
    usage = Transaction.query.filter_by(allocation_id=cat.id).count()
    if usage > 0:
        return jsonify({'error': f'Cannot delete category: {usage} transactions are assigned to it. Deactivate instead.'}), 400

    db.session.delete(cat)
    db.session.commit()
    return jsonify({'message': 'Allocation category deleted'})

@allocation_bp.route('/api/allocations/summary', methods=['GET'])
@token_required()
def get_allocation_summary():
    """
    Returns breakdown across all categories with transaction drill-downs.
    """
    stmt_id = request.args.get('statement_id')
    categories = AllocationCategory.query.order_by(AllocationCategory.display_order.asc()).all()

    results = []
    grand_total = Decimal('0.00')

    for cat in categories:
        q = Transaction.query.filter_by(allocation_id=cat.id)
        if stmt_id:
            q = q.filter_by(statement_id=stmt_id)
        txns = q.all()

        pkr = sum(t.pkr_amount or Decimal('0.00') for t in txns)
        adv = sum(t.advance_tax or Decimal('0.00') for t in txns)
        st = sum(t.sales_tax_withheld or Decimal('0.00') for t in txns)
        tot = sum(t.total_amount or Decimal('0.00') for t in txns)
        grand_total += tot

        results.append({
            'category': cat.to_dict(),
            'transaction_count': len(txns),
            'pkr_amount': float(pkr),
            'advance_tax': float(adv),
            'sales_tax_withheld': float(st),
            'total_amount': float(tot),
            'transactions': [t.to_dict() for t in txns]
        })

    return jsonify({
        'categories': results,
        'grand_total': float(grand_total)
    })
