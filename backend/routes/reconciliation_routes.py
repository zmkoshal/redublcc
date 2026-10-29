import json
import openpyxl
from datetime import datetime
from decimal import Decimal
from flask import Blueprint, request, jsonify
from models import db, Statement, Transaction, ReconciliationRecord, AuditLog
from routes.auth_routes import token_required

reconciliation_bp = Blueprint('reconciliation_bp', __name__)

@reconciliation_bp.route('/api/reconciliation/<int:statement_id>', methods=['GET'])
@token_required()
def get_reconciliation(statement_id):
    stmt = Statement.query.get_or_404(statement_id)
    recon = ReconciliationRecord.query.filter_by(statement_id=statement_id).first()
    
    if not recon:
        # Create empty initial record
        recon = ReconciliationRecord(
            statement_id=statement_id,
            status='Unreconciled',
            bank_total=stmt.total_statement_amount,
            system_total=stmt.total_statement_amount,
            difference=Decimal('0.00'),
            matched_count=len(stmt.transactions),
            missing_count=0,
            discrepancy_count=0
        )
        db.session.add(recon)
        db.session.commit()

    return jsonify(recon.to_dict())

@reconciliation_bp.route('/api/reconciliation/<int:statement_id>/reconcile', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def run_reconciliation(statement_id):
    """
    Runs automated reconciliation check comparing system recorded transactions
    against statement totals or uploaded bank lines.
    """
    stmt = Statement.query.get_or_404(statement_id)
    data = request.get_json() or {}
    bank_total = Decimal(str(data.get('bank_total', stmt.total_statement_amount or 0.0)))

    stmt.recalculate_totals()
    system_total = stmt.total_statement_amount
    diff = bank_total - system_total

    # Scan for potential duplicate transactions
    seen = {}
    duplicates = []
    for t in stmt.transactions:
        key = (t.merchant_name.lower().strip(), float(t.total_amount), t.transaction_date.isoformat())
        if key in seen:
            duplicates.append(t.to_dict())
        seen[key] = t.id

    recon = ReconciliationRecord.query.filter_by(statement_id=statement_id).first()
    if not recon:
        recon = ReconciliationRecord(statement_id=statement_id)
        db.session.add(recon)

    recon.bank_total = bank_total
    recon.system_total = system_total
    recon.difference = diff
    recon.matched_count = len(stmt.transactions) - len(duplicates)
    recon.discrepancy_count = len(duplicates)
    recon.status = 'Matched' if (abs(diff) < Decimal('0.01') and not duplicates) else 'Discrepancy'
    recon.details_json = json.dumps({
        'duplicates_found': duplicates,
        'difference': float(diff),
        'payments': [p.to_dict() for p in stmt.payments]
    })
    
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='RECONCILE',
        entity_type='Statement',
        entity_id=str(statement_id),
        notes=f'Ran reconciliation check for {stmt.statement_number}. Status: {recon.status}, Diff: PKR {diff}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(recon.to_dict())

@reconciliation_bp.route('/api/reconciliation/<int:statement_id>/sign-off', methods=['POST'])
@token_required(allowed_roles=['super_admin', 'finance_hof'])
def sign_off_reconciliation(statement_id):
    """
    Explicitly approve and lock the statement reconciliation.
    """
    stmt = Statement.query.get_or_404(statement_id)
    recon = ReconciliationRecord.query.filter_by(statement_id=statement_id).first()
    if not recon:
        return jsonify({'error': 'Reconciliation not yet initialized'}), 400

    data = request.get_json() or {}
    notes = data.get('notes', 'Reconciliation formally approved by Finance.')

    recon.status = 'Reconciled'
    recon.notes = notes
    recon.reconciled_by_id = request.current_user.id
    recon.reconciled_at = datetime.utcnow()
    
    stmt.status = 'Approved'
    stmt.approved_by_id = request.current_user.id
    stmt.approved_at = datetime.utcnow()

    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='RECONCILIATION_SIGN_OFF',
        entity_type='Statement',
        entity_id=str(statement_id),
        notes=f'Statement {stmt.statement_number} reconciliation signed off and locked',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(recon.to_dict())
