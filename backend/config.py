import os
import shutil
from decimal import Decimal
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Load environment variables from .env file if present
load_dotenv(os.path.join(BASE_DIR, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'red-publicis-secret-key-2026-prod-secure-token')
    
    # Database: Default SQLite file is red_publicis.db
    # If legacy taniisha_cc.db exists, migrate/copy it to red_publicis.db
    default_sqlite_path = os.path.join(BASE_DIR, 'red_publicis.db')
    legacy_sqlite_path = os.path.join(BASE_DIR, 'taniisha_cc.db')
    if not os.path.exists(default_sqlite_path) and os.path.exists(legacy_sqlite_path):
        try:
            shutil.copy2(legacy_sqlite_path, default_sqlite_path)
        except Exception as e:
            print(f"Warning: could not migrate legacy DB: {e}")

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{default_sqlite_path}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
    }
    if 'sqlite' in SQLALCHEMY_DATABASE_URI:
        SQLALCHEMY_ENGINE_OPTIONS['connect_args'] = {'timeout': 30}
    
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32 MB max upload
    
    # Financial precision
    DEFAULT_CURRENCY = 'PKR'
    DEFAULT_EXCHANGE_RATE = Decimal('280.00')

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
