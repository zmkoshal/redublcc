from flask import Blueprint, request, jsonify
from models import db, AuditLog
from routes.auth_routes import token_required

audit_bp = Blueprint('audit_bp', __name__)

@audit_bp.route('/api/audit-logs', methods=['GET'])
@token_required()
def get_audit_logs():
    q = AuditLog.query

    action = request.args.get('action')
    if action:
        q = q.filter_by(action=action)

    entity_type = request.args.get('entity_type')
    if entity_type:
        q = q.filter_by(entity_type=entity_type)

    user_id = request.args.get('user_id')
    if user_id:
        q = q.filter_by(user_id=user_id)

    limit = int(request.args.get('limit', 100))
    logs = q.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return jsonify([l.to_dict() for l in logs])
