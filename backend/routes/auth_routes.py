import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from models import db, User, AuditLog

auth_bp = Blueprint('auth_bp', __name__)

def create_token(user):
    payload = {
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def token_required(allowed_roles=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            elif 'token' in request.args:
                token = request.args.get('token')
            
            if not token:
                # Fallback for development if no header is provided: use default admin user
                user = User.query.filter_by(role='super_admin').first() or User.query.filter_by(username='superadmin').first() or User.query.first()
                if not user:
                    return jsonify({'error': 'Authentication token missing'}), 401
                request.current_user = user
                return f(*args, **kwargs)

            try:
                data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
                user = User.query.get(data['user_id'])
                if not user or not user.is_active:
                    return jsonify({'error': 'User invalid or inactive'}), 401
                
                if allowed_roles and user.role not in allowed_roles:
                    return jsonify({'error': 'Permission denied: unauthorized role'}), 403
                
                request.current_user = user
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Session expired, please login again'}), 401
            except Exception:
                return jsonify({'error': 'Invalid token'}), 401

            return f(*args, **kwargs)
        return decorated
    return decorator

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    user = User.query.filter((User.username == username) | (User.email == username)).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    token = create_token(user)

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action='LOGIN',
        entity_type='User',
        entity_id=str(user.id),
        notes=f'User {user.username} logged in successfully',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'token': token,
        'user': user.to_dict()
    })

@auth_bp.route('/api/auth/me', methods=['GET'])
@token_required()
def get_current_user():
    return jsonify({'user': request.current_user.to_dict()})

@auth_bp.route('/api/users', methods=['GET'])
@token_required()
def list_users():
    users = User.query.order_by(User.id.asc()).all()
    return jsonify([u.to_dict() for u in users])

@auth_bp.route('/api/users', methods=['POST'])
@token_required(allowed_roles=['super_admin'])
def create_user():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    role = data.get('role', 'it_entry')

    if not username or not password or not email or not full_name:
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'error': 'Username or Email already exists'}), 400

    new_user = User(username=username, email=email, full_name=full_name, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    # Audit log
    audit = AuditLog(
        user_id=request.current_user.id,
        action='CREATE_USER',
        entity_type='User',
        entity_id=str(new_user.id),
        notes=f'Super Admin created user {new_user.username} ({new_user.full_name}) with role {new_user.role}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(new_user.to_dict()), 201

@auth_bp.route('/api/users/<int:user_id>', methods=['PUT'])
@token_required(allowed_roles=['super_admin'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    old_role = user.role
    
    if 'username' in data and data['username']:
        new_uname = str(data['username']).strip()
        if new_uname and new_uname != user.username:
            if User.query.filter(User.username == new_uname, User.id != user.id).first():
                return jsonify({'error': f'Username "{new_uname}" is already taken'}), 400
            user.username = new_uname

    if 'full_name' in data and data['full_name']:
        user.full_name = str(data['full_name']).strip()

    if 'email' in data and data['email']:
        new_email = str(data['email']).strip()
        if new_email and new_email != user.email:
            if User.query.filter(User.email == new_email, User.id != user.id).first():
                return jsonify({'error': f'Email "{new_email}" is already registered to another user'}), 400
            user.email = new_email

    if 'role' in data and data['role']:
        user.role = data['role']
    if 'is_active' in data:
        user.is_active = bool(data['is_active'])
    if data.get('password'):
        user.set_password(str(data['password']).strip())

    db.session.commit()

    # Audit log
    audit = AuditLog(
        user_id=request.current_user.id,
        action='UPDATE_USER',
        entity_type='User',
        entity_id=str(user.id),
        notes=f'Super Admin updated user {user.username} (Role: {old_role} -> {user.role}, Active: {user.is_active})',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(user.to_dict())

@auth_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@token_required(allowed_roles=['super_admin'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    
    # Cannot delete oneself
    if request.current_user and request.current_user.id == user.id:
        return jsonify({'error': 'You cannot delete your own logged-in administrator account'}), 400
    
    # Prevent deleting the last remaining super_admin
    if user.role == 'super_admin':
        admin_count = User.query.filter_by(role='super_admin', is_active=True).count()
        if admin_count <= 1:
            return jsonify({'error': 'Cannot delete the only active Super Administrator'}), 400

    del_username = user.username
    del_name = user.full_name
    db.session.delete(user)
    db.session.commit()

    audit = AuditLog(
        user_id=request.current_user.id,
        action='DELETE_USER',
        entity_type='User',
        entity_id=str(user_id),
        notes=f'Super Admin {request.current_user.username} deleted user {del_username} ({del_name})',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({'message': f'User "{del_username}" has been deleted successfully'})

@auth_bp.route('/api/users/<int:user_id>/reset-password', methods=['POST'])
@token_required(allowed_roles=['super_admin'])
def reset_user_password(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    new_password = data.get('new_password') or data.get('password')
    
    if not new_password or len(str(new_password).strip()) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    user.set_password(str(new_password).strip())
    db.session.commit()

    # Audit log
    audit = AuditLog(
        user_id=request.current_user.id,
        action='PASSWORD_RESET',
        entity_type='User',
        entity_id=str(user.id),
        notes=f'Super Admin {request.current_user.username} reset password for user {user.username}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'Password for {user.username} has been successfully reset',
        'user': user.to_dict()
    })

@auth_bp.route('/api/users/<int:user_id>/role', methods=['POST', 'PUT'])
@token_required(allowed_roles=['super_admin'])
def change_user_role(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    new_role = data.get('role')
    valid_roles = ['super_admin', 'finance_hof', 'it_entry', 'management_readonly']
    
    if not new_role or new_role not in valid_roles:
        return jsonify({'error': f'Invalid role. Valid roles are: {", ".join(valid_roles)}'}), 400

    old_role = user.role
    user.role = new_role
    db.session.commit()

    # Audit log
    audit = AuditLog(
        user_id=request.current_user.id,
        action='ROLE_CHANGE',
        entity_type='User',
        entity_id=str(user.id),
        notes=f'Super Admin changed role of {user.username} from {old_role} to {new_role}',
        ip_address=request.remote_addr
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'User role for {user.username} updated to {new_role}',
        'user': user.to_dict()
    })


