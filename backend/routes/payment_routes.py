import json
from datetime import datetime
from decimal import Decimal
from flask import Blueprint, request, jsonify
from models import db, Payment, Statement, AuditLog
from routes.auth_routes import token_required

payment_bp = Blueprint('payment_bp', __name__)

@payment_bp.route('/api/payments', methods=['GET'])
@token_required()
def get_payments():
    stmt_id = request.args.get('statement_id')
    q = Payment.query
    if stmt_id:
        q = q.filter_by(statement_id=stmt_id)
    payments = q.order_by(Payment.payment_date.desc(), Payment.id.desc()).all()
    return jsonify([p.to_dict() for p in payments])

@payment_bp.route('/api/payments', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def record_payment():
    data = request.get_json() or {}
    statement_id = data.get('statement_id')
    payment_date_str = data.get('payment_date')
    ref = data.get('payment_reference', '').strip()
    amount = Decimal(str(data.get('amount', 0.0)))

    if not statement_id or not payment_date_str or not ref or amount <= 0:
        return jsonify({'error': 'Valid Statement, Date, Reference and positive Amount are required'}), 400

    stmt = Statement.query.get_or_404(statement_id)

    pmt = Payment(
        statement_id=statement_id,
        payment_date=datetime.strptime(payment_date_str, '%Y-%m-%d').date(),
        payment_reference=ref,
        payment_method=data.get('payment_method', 'Online Transfer'),
        amount=amount,
        notes=data.get('notes'),
        receipt_path=data.get('receipt_path'),
        recorded_by_id=request.current_user.id
    )
    db.session.add(pmt)
    db.session.flush()

    stmt.recalculate_totals()
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='PAYMENT',
        entity_type='Payment',
        entity_id=str(pmt.id),
        new_values=json.dumps(pmt.to_dict()),
        notes=f'Recorded payment of PKR {amount} for statement {stmt.statement_number}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(pmt.to_dict()), 201

@payment_bp.route('/api/payments/<int:pmt_id>', methods=['DELETE'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def delete_payment(pmt_id):
    pmt = Payment.query.get_or_404(pmt_id)
    stmt = pmt.statement
    old_values = json.dumps(pmt.to_dict())

    db.session.delete(pmt)
    db.session.flush()

    stmt.recalculate_totals()
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='DELETE',
        entity_type='Payment',
        entity_id=str(pmt_id),
        old_values=old_values,
        notes='Deleted payment record',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': 'Payment record deleted'})
