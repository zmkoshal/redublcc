import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
from services.seed_service import seed_database

# Blueprints
from routes.auth_routes import auth_bp
from routes.statement_routes import statement_bp
from routes.transaction_routes import transaction_bp
from routes.allocation_routes import allocation_bp
from routes.tax_routes import tax_bp
from routes.payment_routes import payment_bp
from routes.reconciliation_routes import reconciliation_bp
from routes.report_routes import report_bp
from routes.import_export_routes import import_export_bp
from routes.audit_routes import audit_bp
from routes.settings_routes import settings_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for React frontend (both local development and local LAN IP)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Init database
    db.init_app(app)

    # SQLite connection enhancements (foreign keys and WAL journal mode)
    with app.app_context():
        from sqlalchemy import event
        from sqlalchemy.engine import Engine
        import sqlite3

        @event.listens_for(Engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            if isinstance(dbapi_connection, sqlite3.Connection):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.close()

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(statement_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(allocation_bp)
    app.register_blueprint(tax_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(reconciliation_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(import_export_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(settings_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'RED Publicis Credit Card Statement Management API',
            'version': '1.0.0'
        })

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Production SPA Frontend Serving (when frontend/dist exists)
    base_dir = os.path.abspath(os.path.dirname(__file__))
    frontend_dist = os.path.abspath(os.path.join(base_dir, '..', 'frontend', 'dist'))
    if os.path.exists(frontend_dist):
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_frontend(path):
            if path and os.path.exists(os.path.join(frontend_dist, path)):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, 'index.html')

    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Resource not found'}), 404
        if os.path.exists(frontend_dist):
            return send_from_directory(frontend_dist, 'index.html')
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    with app.app_context():
        db.create_all()
        seed_database()

    return app

if __name__ == '__main__':
    app = create_app()
    # Host on 0.0.0.0 to enable access from local office network server
    app.run(host='0.0.0.0', port=5000, debug=True)
