---
title: Red Publicis Credit Card Management
emoji: 💳
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# RED Publicis Credit Card Statement & Expense Management System

> **Enterprise Financial Management Solution for RED PUBLICIS (COMMUNICATION ARTS)**  
> Built to digitally replace manual Excel workbook credit card preparation (`Credit Card sheet 28-9-26.xlsx`) with automated tax withholding calculations, multi-entity expense allocation, payment reconciliation, and audit control.

---

## 1. System Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Python 3.14+ with Flask REST API, SQLAlchemy ORM (with strict `NUMERIC(15,2)` precision).
- **Database**:
  - Out-of-the-box: SQLite (`backend/taniisha_cc.db`) for immediate zero-config local execution.
  - Production Enterprise: PostgreSQL support with complete DDL schema script in `backend/schema.sql`.
- **Reporting Engine**:
  - `openpyxl`: Excel exports closely replicating original workbook cell formulas (`SUM`, `SUBTOTAL`), grouping, headers, and signatures.
  - `reportlab`: Formal PDF statements and audit certificates.
- **Authentication**: JWT token authorization, secure password hashing (`werkzeug.security`), and Role-Based Access Control (RBAC).

---

## 2. Default Access Accounts (RBAC Roles)

The database is pre-seeded with four role tiers:

| Username | Password | Full Name | Role | Responsibilities |
|---|---|---|---|---|
| `superadmin` | `Admin@123` | System Administrator | **Super Admin** | Full system configuration, user management, audit logs |
| `finance` | `Finance@123` | Head of Finance | **Finance / HOF** | Statement approvals, payments, reconciliation sign-off |
| `itadmin` | `It@123` | IT Operations Specialist | **IT / Data Entry** | Transaction entry, Excel imports, receipt attachments |
| `manager` | `Manager@123` | Executive Management | **Management (Read-Only)** | View dashboards, download authorized statements |

*(Note: The UI includes a quick Role Switcher dropdown in the top navigation bar for immediate testing between tiers).*

---

## 3. Quick Start & Local Execution

### Prerequisites
- Python 3.10+ (Installed and on PATH)
- Node.js 18+ and `npm`

### Step 1: Start the Backend (Flask API)
Open a terminal in `backend/`:
```bash
cd backend
python app.py
```
*The Flask REST API will start at `http://127.0.0.1:5000` (and `0.0.0.0:5000` for LAN).*

### Step 2: Start the Frontend (React + Vite)
Open a second terminal in `frontend/`:
```bash
cd frontend
npm run dev -- --host
```
*The web interface will open at `http://localhost:5173`.*

---

## 4. Key Functional Modules

### 1. Dashboard & KPI Financial Summary
- KPI metric cards: Total Statement Amount, Total Paid, Remaining Payable Balance, Advance Tax (Sec 236Y), Charge to RED, KKOP, PFDC, and Individual.
- Interactive charts: Expense distribution by corporate allocation, top vendors/merchants, statutory tax breakdown, and foreign currency (USD) vs direct PKR spend.

### 2. Credit Card Statement Header & Grouped View
- Statement creation with UBL bank name, card reference (`*9821`), statement date, payment due date, opening balance, status workflow (`Draft`, `Under Review`, `Approved`, `Partially Paid`, `Paid`, `Overdue`).
- **Exact Excel Replication View**: Recreates the grouped layout from `Credit Card sheet 28-9-26.xlsx`:
  - `CHARGE TO RED` (Midjourney, Shutterstock, Google Workspace, OpenAI, Anthropic Claude, etc.)
  - `CHARGE TO KKOP` (Shopify, GoDaddy renewal, etc.)
  - `CHARGE TO PFDC` (Client project expenses)
  - `CHARGE TO SYED HAMMAD HASAN` (Director personal subscriptions)
  - Subtotals per group for PKR amount, Advance tax, Sales tax, and Grand Total.
  - Three-tier authorization signatures block: *IT / Prepared By*, *Admin & HR*, *Head of Finance*.
  - Automated **Financial Allocation Summary** (matching rows 84-90 of original workbook).

### 3. Transactions Registry & Currency Calculations
- Foreign Currency (USD) $\times$ Exchange Rate = Base PKR Amount.
- Auto-computes exchange rate if both USD and PKR amounts are entered.
- Real-time tax computation: FBR Section 236Y Advance Tax, Sales Tax Withheld, Additional ST, FED (PKR 40), SMS and Bank Fees (PKR 250).
- Actions: Add, Edit, Delete, Duplicate, Filter by Statement, Allocation, and Merchant search.

### 4. Excel Import Wizard
- Parses uploaded `.xlsx` workbooks (or the default `Credit Card sheet 28-9-26.xlsx`).
- Automatically recognizes charge allocation group headings (`CHARGE TO RED`, `CHARGE TO KKOP`, etc.).
- Safely excludes summary, grand-total, and subtotal formula rows to prevent duplicate accounting.
- Interactive table preview with amount verification before confirming import.

### 5. Statement Reconciliation & Multi-Payment Settlement
- Compares bank statement billing totals against recorded transaction sums.
- Flags duplicate transactions and amount variances.
- Records multi-payment partial settlements (Bank Online Transfer, Cheque, Direct Debit) with real-time outstanding balance calculation.
- Formal reconciliation sign-off locking mechanism.

### 6. Configurable Tax & Allocation Rules
- Dynamic Allocation Categories (RED, KKOP, PFDC, Syed Hammad Hasan, Other Companies, Other Individuals).
- Administrator-configurable tax rules (Percentage vs. Fixed amount, rounding options: `ROUND_HALF_UP`, `EXACT`, `ROUND_UP`).
- Built-in interactive Tax Calculator Sandbox.

### 7. 10 Comprehensive Financial Reports
Downloadable in both styled Excel (`.xlsx`) via openpyxl and PDF (`.pdf`) via ReportLab, with real-time interactive preview:
1. Complete UBL Credit Card Statement
2. Transaction Detail Report
3. Company-wise Expense Allocation
4. Merchant-wise Expense Report
5. Advance Tax Report (Sec 236Y)
6. Sales Tax Report
7. Statement Reconciliation Report
8. Outstanding Payment Report
9. Monthly Expense Summary
10. Audit and Adjustment Report

### 8. Immutable Security Audit Trail
- Comprehensive audit logging recording every `CREATE`, `UPDATE`, `DELETE`, `PAYMENT`, and `RECONCILE` operation.
- Side-by-side JSON diff inspector comparing previous values against modified values.

---

## 5. PostgreSQL Production Setup

To connect to a production PostgreSQL database:
1. Execute the schema script:
   ```bash
   psql -U postgres -d taniisha_cc -f backend/schema.sql
   ```
2. Set the `DATABASE_URL` environment variable in `backend/.env` or system environment:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/taniisha_cc
   ```
3. Restart `backend/app.py`. The application will automatically detect PostgreSQL and run with connection pooling.

---

## 6. Running Automated Tests

Run the test suite covering currency conversion, tax withholding, reconciliation variances, and exports:
```bash
python backend/tests/test_system.py
```

*Developed for TANIISHA TECHNOLOGIES PRIVATE LIMITED.*
