-- =========================================================================
-- TANIISHA TECHNOLOGIES PRIVATE LIMITED
-- Credit Card Statement & Expense Management System - PostgreSQL Schema
-- =========================================================================

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS expense_allocation_splits CASCADE;
DROP TABLE IF EXISTS reconciliation_records CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS statements CASCADE;
DROP TABLE IF EXISTS tax_rules CASCADE;
DROP TABLE IF EXISTS allocation_categories CASCADE;
DROP TABLE IF EXISTS credit_cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS application_settings CASCADE;

-- 1. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'it_entry',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_username ON users(username);

-- 2. Credit Cards
CREATE TABLE credit_cards (
    id SERIAL PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL DEFAULT 'UBL',
    card_holder_name VARCHAR(120) NOT NULL,
    card_number_last4 VARCHAR(4) NOT NULL,
    card_type VARCHAR(50) DEFAULT 'Corporate Visa Business',
    currency VARCHAR(10) DEFAULT 'PKR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Allocation Categories
CREATE TABLE allocation_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'Company',
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0
);

-- 4. Statements
CREATE TABLE statements (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES credit_cards(id) ON DELETE SET NULL,
    statement_number VARCHAR(50) UNIQUE NOT NULL,
    statement_date DATE NOT NULL,
    payment_due_date DATE NOT NULL,
    period_start_date DATE,
    period_end_date DATE,
    opening_balance NUMERIC(15, 2) DEFAULT 0.00,
    total_statement_amount NUMERIC(15, 2) DEFAULT 0.00,
    amount_paid NUMERIC(15, 2) DEFAULT 0.00,
    outstanding_balance NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Draft' NOT NULL,
    notes TEXT,
    attachment_path VARCHAR(255),
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_statements_number ON statements(statement_number);

-- 5. Transactions
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    statement_id INTEGER NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    merchant_name VARCHAR(150) NOT NULL,
    description TEXT,
    allocation_id INTEGER REFERENCES allocation_categories(id) ON DELETE SET NULL,
    usd_amount NUMERIC(15, 2),
    exchange_rate NUMERIC(15, 4),
    pkr_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    advance_tax NUMERIC(15, 2) DEFAULT 0.00,
    sales_tax_withheld NUMERIC(15, 2) DEFAULT 0.00,
    additional_sales_tax NUMERIC(15, 2) DEFAULT 0.00,
    fed_amount NUMERIC(15, 2) DEFAULT 0.00,
    bank_charges NUMERIC(15, 2) DEFAULT 0.00,
    other_taxes NUMERIC(15, 2) DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    receipt_path VARCHAR(255),
    notes TEXT,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approval_status VARCHAR(30) DEFAULT 'Approved',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transactions_statement_id ON transactions(statement_id);
CREATE INDEX idx_transactions_allocation_id ON transactions(allocation_id);

-- 6. Expense Allocation Splits
CREATE TABLE expense_allocation_splits (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    allocation_id INTEGER NOT NULL REFERENCES allocation_categories(id) ON DELETE RESTRICT,
    allocated_pkr NUMERIC(15, 2) NOT NULL,
    percentage NUMERIC(5, 2),
    notes VARCHAR(255)
);

-- 7. Tax Rules
CREATE TABLE tax_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    tax_type VARCHAR(50) NOT NULL,
    calc_type VARCHAR(30) DEFAULT 'PERCENTAGE',
    default_rate NUMERIC(8, 4) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    rounding_method VARCHAR(30) DEFAULT 'ROUND_HALF_UP',
    description TEXT
);

-- 8. Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    statement_id INTEGER NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    payment_reference VARCHAR(100) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Online Transfer',
    amount NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    receipt_path VARCHAR(255),
    recorded_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payments_statement_id ON payments(statement_id);

-- 9. Reconciliation Records
CREATE TABLE reconciliation_records (
    id SERIAL PRIMARY KEY,
    statement_id INTEGER NOT NULL UNIQUE REFERENCES statements(id) ON DELETE CASCADE,
    status VARCHAR(40) DEFAULT 'Unreconciled',
    bank_total NUMERIC(15, 2) DEFAULT 0.00,
    system_total NUMERIC(15, 2) DEFAULT 0.00,
    difference NUMERIC(15, 2) DEFAULT 0.00,
    matched_count INTEGER DEFAULT 0,
    missing_count INTEGER DEFAULT 0,
    discrepancy_count INTEGER DEFAULT 0,
    details_json TEXT,
    notes TEXT,
    reconciled_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reconciled_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    old_values TEXT,
    new_values TEXT,
    notes TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 11. Application Settings
CREATE TABLE application_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
