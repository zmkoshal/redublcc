import json
from decimal import Decimal
from flask import Blueprint, request, jsonify
from models import db, TaxRule, Transaction, AuditLog
from routes.auth_routes import token_required
from services.tax_service import TaxService

tax_bp = Blueprint('tax_bp', __name__)

@tax_bp.route('/api/taxes/rules', methods=['GET'])
@token_required()
def get_tax_rules():
    rules = TaxRule.query.all()
    return jsonify([r.to_dict() for r in rules])

@tax_bp.route('/api/taxes/rules', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def create_tax_rule():
    data = request.get_json() or {}
    rule_name = data.get('rule_name')
    tax_type = data.get('tax_type')
    
    if not rule_name or not tax_type:
        return jsonify({'error': 'Rule Name and Tax Type are required'}), 400

    rule = TaxRule(
        rule_name=rule_name,
        tax_type=tax_type,
        calc_type=data.get('calc_type', 'PERCENTAGE'),
        default_rate=Decimal(str(data.get('default_rate', 0.0))),
        rounding_method=data.get('rounding_method', 'ROUND_HALF_UP'),
        description=data.get('description'),
        is_active=data.get('is_active', True)
    )
    db.session.add(rule)
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='CREATE',
        entity_type='TaxRule',
        entity_id=str(rule.id),
        new_values=json.dumps(rule.to_dict()),
        notes=f'Created tax rule {rule.rule_name}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(rule.to_dict()), 201

@tax_bp.route('/api/taxes/rules/<int:rule_id>', methods=['PUT'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def update_tax_rule(rule_id):
    rule = TaxRule.query.get_or_404(rule_id)
    data = request.get_json() or {}
    old_values = json.dumps(rule.to_dict())

    if 'rule_name' in data:
        rule.rule_name = data['rule_name']
    if 'tax_type' in data:
        rule.tax_type = data['tax_type']
    if 'calc_type' in data:
        rule.calc_type = data['calc_type']
    if 'default_rate' in data:
        rule.default_rate = Decimal(str(data['default_rate']))
    if 'rounding_method' in data:
        rule.rounding_method = data['rounding_method']
    if 'description' in data:
        rule.description = data['description']
    if 'is_active' in data:
        rule.is_active = data['is_active']

    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='UPDATE',
        entity_type='TaxRule',
        entity_id=str(rule.id),
        old_values=old_values,
        new_values=json.dumps(rule.to_dict()),
        notes=f'Updated tax rule {rule.rule_name}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(rule.to_dict())

@tax_bp.route('/api/taxes/calculate', methods=['POST'])
@token_required()
def calculate_tax():
    data = request.get_json() or {}
    usd = data.get('usd_amount')
    pkr = data.get('pkr_amount')
    rate = data.get('exchange_rate')
    tax_rule = data.get('tax_rule', 'fbr_236y_filer')
    merchant = data.get('merchant', '')
    overrides = data.get('manual_overrides', {})
    res = TaxService.calculate_transaction_taxes(usd, pkr, rate, tax_rule=tax_rule, merchant=merchant, manual_overrides=overrides)
    return jsonify(res)

@tax_bp.route('/api/taxes/compare', methods=['POST'])
@token_required()
def compare_pakistan_taxes():
    data = request.get_json() or {}
    pkr = data.get('pkr_amount', 0.0)
    merchant = data.get('merchant', '')
    comparison = TaxService.get_pakistan_tax_comparison(pkr, merchant=merchant)
    return jsonify(comparison)

@tax_bp.route('/api/taxes/summary', methods=['GET'])
@token_required()
def get_tax_summary():
    stmt_id = request.args.get('statement_id')
    q = Transaction.query
    if stmt_id:
        q = q.filter_by(statement_id=stmt_id)
    txns = q.all()

    total_adv = sum(t.advance_tax or Decimal('0.00') for t in txns)
    total_sales_tax = sum(t.sales_tax_withheld or Decimal('0.00') for t in txns)
    total_additional_st = sum(t.additional_sales_tax or Decimal('0.00') for t in txns)
    total_fed = sum(t.fed_amount or Decimal('0.00') for t in txns)
    total_bank = sum(t.bank_charges or Decimal('0.00') for t in txns)
    total_other = sum(t.other_taxes or Decimal('0.00') for t in txns)
    total_all_taxes = total_adv + total_sales_tax + total_additional_st + total_fed + total_bank + total_other

    return jsonify({
        'total_advance_tax': float(total_adv),
        'total_sales_tax_withheld': float(total_sales_tax),
        'total_additional_sales_tax': float(total_additional_st),
        'total_fed': float(total_fed),
        'total_bank_charges': float(total_bank),
        'total_other_taxes': float(total_other),
        'grand_total_taxes': float(total_all_taxes)
    })
