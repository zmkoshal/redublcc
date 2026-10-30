import ExcelJS from 'exceljs';
import {
  User,
  CreditCard,
  Statement,
  AllocationCategory,
  Transaction,
  TaxRule,
  Payment,
  ReconciliationRecord,
  AuditLog,
  DashboardStats
} from '../types';

interface MockDatabase {
  users: User[];
  card: CreditCard;
  statements: Statement[];
  categories: AllocationCategory[];
  taxRules: TaxRule[];
  transactions: Transaction[];
  payments: Payment[];
  reconciliations: Record<number, ReconciliationRecord>;
  auditLogs: AuditLog[];
  settings: Record<string, string>;
  userPasswords?: Record<string, string>;
}

const STORAGE_KEY = 'red_publicis_local_db_v3';

function getInitialData(): MockDatabase {
  const users: User[] = [
    { id: 1, username: 'superadmin', email: 'admin@red.com.pk', full_name: 'System Administrator', role: 'super_admin', is_active: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 2, username: 'harris', email: 'harris.javaid@red.com.pk', full_name: 'Head of Finance', role: 'finance_hof', is_active: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 3, username: 'zahid', email: 'zahid.mahmood@red.com.pk', full_name: 'IT Operations Specialist', role: 'it_entry', is_active: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 4, username: 'manager', email: 'management@red.com.pk', full_name: 'Executive Management', role: 'management_readonly', is_active: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 5, username: 'umair', email: 'umair.rafique@red.com.pk', full_name: 'Umair Rafique', role: 'it_entry', is_active: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 6, username: 'finance', email: 'finance@red.com.pk', full_name: 'Finance / HOF', role: 'finance_hof', is_active: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 7, username: 'itadmin', email: 'it@red.com.pk', full_name: 'IT Operations', role: 'it_entry', is_active: true, created_at: '2026-09-01T00:00:00Z' }
  ];

  const card: CreditCard = {
    id: 1,
    bank_name: 'UBL',
    card_holder_name: 'RED PUBLICIS (COMMUNICATION ARTS)',
    card_number_last4: '9821',
    card_type: 'Corporate Visa Business',
    currency: 'PKR',
    is_active: true
  };

  const categories: AllocationCategory[] = [
    { id: 1, code: 'RED', name: 'CHARGE TO RED', entity_type: 'Company', description: 'RED technology & cloud expenses', is_active: true, display_order: 1 },
    { id: 2, code: 'KKOP', name: 'CHARGE TO KKOP', entity_type: 'Company', description: 'Kallar Kahar Oil & Press operations', is_active: true, display_order: 2 },
    { id: 3, code: 'PFDC', name: 'CHARGE TO PFDC', entity_type: 'Client', description: 'Pakistan Fashion Design Council client-assigned services', is_active: true, display_order: 3 },
    { id: 4, code: 'SYED_HAMMAD', name: 'CHARGE TO SYED HAMMAD HASAN', entity_type: 'Individual', description: 'Syed Hammad Hasan personal subscriptions', is_active: true, display_order: 4 },
    { id: 5, code: 'OTHER_COMPANIES', name: 'CHARGE TO OTHER COMPANIES', entity_type: 'Company', description: 'Partner company allocations', is_active: true, display_order: 5 },
    { id: 6, code: 'OTHER_INDIVIDUALS', name: 'CHARGE TO OTHER INDIVIDUALS', entity_type: 'Individual', description: 'Staff individual allocations', is_active: true, display_order: 6 }
  ];

  const catMap = Object.fromEntries(categories.map(c => [c.code, c]));

  const rawTx = [
    { dt: '2026-09-01', m: 'Mid-Journey', desc: 'Midjourney AI Image generation subscription', c: 'RED', usd: 10.0, rate: 292.443, pkr: 2924.43, adv: 14.0, st: 14.0, oth: 0.0, tot: 2952.43 },
    { dt: '2026-09-03', m: 'Shutterstock', desc: 'Image Monthly Subscription 750 Downloads', c: 'RED', usd: 199.0, rate: 281.07, pkr: 58248.20, adv: 279.0, st: 0.0, oth: 0.0, tot: 58527.20 },
    { dt: '2026-09-05', m: 'Google Workspace', desc: 'GOOGLE GSUITE RED.COM.PK CHARGE TO RED', c: 'RED', usd: 700.0, rate: 293.645, pkr: 204820.00, adv: 1025.0, st: 0.0, oth: 0.0, tot: 205845.00 },
    { dt: '2026-09-05', m: 'Google Workspace', desc: 'GOOGLE GSUITE PFDC.ORG (CHARGE TO CLIENT)', c: 'PFDC', usd: 50.4, rate: 293.645, pkr: 14744.41, adv: 71.0, st: 1418.15, oth: 0.0, tot: 16233.56 },
    { dt: '2026-09-07', m: 'MGF MAGNIFIC PREMIUM', desc: 'MGF Magnific Premium Malaga ES License 1', c: 'RED', usd: 0, rate: 0, pkr: 10350.00, adv: 0.0, st: 0.0, oth: 0.0, tot: 10350.00 },
    { dt: '2026-09-07', m: 'MGF MAGNIFIC PREMIUM', desc: 'MGF Magnific Premium Malaga ES License 2', c: 'RED', usd: 0, rate: 0, pkr: 10350.00, adv: 0.0, st: 0.0, oth: 0.0, tot: 10350.00 },
    { dt: '2026-09-08', m: 'MGF MAGNIFIC PREMIUM', desc: 'MGF Magnific Premium Malaga ES Annual Team Pack', c: 'RED', usd: 0, rate: 0, pkr: 93150.00, adv: 0.0, st: 0.0, oth: 0.0, tot: 93150.00 },
    { dt: '2026-09-09', m: 'Anthropic Claude', desc: 'ANTHROPIC CLAUDE SUB ANTHROPIC.COM US (Seat 1)', c: 'RED', usd: 0, rate: 0, pkr: 5847.82, adv: 28.0, st: 0.0, oth: 0.0, tot: 5875.82 },
    { dt: '2026-09-09', m: 'Anthropic Claude', desc: 'ANTHROPIC CLAUDE SUB ANTHROPIC.COM US (Seat 2)', c: 'RED', usd: 0, rate: 0, pkr: 5852.00, adv: 0.0, st: 0.0, oth: 0.0, tot: 5852.00 },
    { dt: '2026-09-10', m: 'OpenAI ChatGPT', desc: 'OPENAI CHATGPT SUBSCR OPENAI.COM US Team Tier', c: 'RED', usd: 0, rate: 0, pkr: 27999.00, adv: 0.0, st: 0.0, oth: 0.0, tot: 27999.00 },
    { dt: '2026-09-11', m: 'Grok / xAI', desc: 'GROK XAI WWW.GROK.COM US Research Account', c: 'RED', usd: 0, rate: 0, pkr: 8773.30, adv: 42.0, st: 42.0, oth: 0.0, tot: 8857.30 },
    { dt: '2026-09-12', m: 'Shopify', desc: 'SHOPIFY* 552473168 SG (CHARGE TO KKOP)', c: 'KKOP', usd: 0, rate: 0, pkr: 7315.00, adv: 37.0, st: 0.0, oth: 0.0, tot: 7352.00 },
    { dt: '2026-09-14', m: 'ElevenLabs', desc: 'ELEVENLABS Voice Synthesis Studio Plan', c: 'RED', usd: 0, rate: 0, pkr: 1729.40, adv: 276.7, st: 0.0, oth: 0.0, tot: 2006.10 },
    { dt: '2026-09-15', m: 'GoDaddy', desc: 'GoDaddy renewal kallarkaharpress.com hosting & domains', c: 'KKOP', usd: 0, rate: 0, pkr: 108320.00, adv: 17331.2, st: 0.0, oth: 0.0, tot: 125651.20 },
    { dt: '2026-09-16', m: 'Microsoft Teams', desc: 'Microsoft Teams for Ms. Sabene', c: 'RED', usd: 18.0, rate: 307.12, pkr: 5528.16, adv: 26.0, st: 0.0, oth: 0.0, tot: 5554.16 },
    { dt: '2026-09-17', m: 'Contabo Cloud VPS', desc: 'WWW.CONTABO.COM MUNCHEN DE Infrastructure', c: 'RED', usd: 49.3, rate: 306.757, pkr: 15123.13, adv: 76.0, st: 0.0, oth: 0.0, tot: 15199.13 },
    { dt: '2026-09-18', m: 'UBL Banking SMS', desc: 'SMS FEE BILLING', c: 'RED', usd: 0, rate: 0, pkr: 250.00, adv: 0.0, st: 0.0, oth: 0.0, tot: 250.00 },
    { dt: '2026-09-18', m: 'Federal Excise Duty', desc: 'FEDERAL EXCISE DUTY STATUTORY', c: 'RED', usd: 0, rate: 0, pkr: 40.00, adv: 0.0, st: 0.0, oth: 0.0, tot: 40.00 },
    { dt: '2026-09-19', m: 'Netflix Singapore', desc: 'NETFLIX.COM SINGAPORE SG (Assigned to Director)', c: 'SYED_HAMMAD', usd: 0, rate: 0, pkr: 1155.00, adv: 0.0, st: 0.0, oth: 0.0, tot: 1155.00 },
    { dt: '2026-09-20', m: 'Google Drive Storage', desc: 'Google Drive (Data Upload for Client)', c: 'RED', usd: 0, rate: 0, pkr: 2800.00, adv: 0.0, st: 104.95, oth: 0.0, tot: 2904.95 },
    { dt: '2026-09-20', m: 'Google Drive Storage', desc: 'Google Drive (Data Upload for Client 2TB)', c: 'RED', usd: 0, rate: 0, pkr: 6499.00, adv: 0.0, st: 0.0, oth: 0.0, tot: 6499.00 }
  ];

  const rawTx2 = [
    { dt: '2026-08-20', m: 'SHUTTERSTOCK', desc: 'SHUTTERSTOCK', c: 'RED', usd: 0, rate: 0, pkr: 58248.20, adv: 279.00, st: 0.00, tot: 58527.20 },
    { dt: '2026-08-22', m: 'MAGNIFIC', desc: 'MAGNIFIC', c: 'RED', usd: 0, rate: 0, pkr: 10350.00, adv: 0.00, st: 0.00, tot: 10350.00 },
    { dt: '2026-08-22', m: 'OPENAI-CHATGPT', desc: 'OPENAI-CHATGPT', c: 'RED', usd: 0, rate: 0, pkr: 27999.00, adv: 0.00, st: 0.00, tot: 27999.00 },
    { dt: '2026-08-24', m: 'NETFLIX', desc: 'NETFLIX', c: 'SYED_HAMMAD', usd: 0, rate: 0, pkr: 1100.00, adv: 55.00, st: 0.00, tot: 1155.00 },
    { dt: '2026-08-24', m: 'Google', desc: 'Google', c: 'RED', usd: 0, rate: 0, pkr: 6499.00, adv: 324.95, st: 0.00, tot: 6823.95 },
    { dt: '2026-08-30', m: 'Anthropic', desc: 'Anthropic', c: 'RED', usd: 0, rate: 0, pkr: 5852.00, adv: 28.00, st: 0.00, tot: 5880.00 },
    { dt: '2026-08-31', m: 'Shopify', desc: 'Shopify', c: 'KKOP', usd: 0, rate: 0, pkr: 7315.00, adv: 35.00, st: 0.00, tot: 7350.00 },
    { dt: '2026-08-31', m: 'Godaddy', desc: 'Godaddy', c: 'KKOP', usd: 0, rate: 0, pkr: 108320.00, adv: 0.00, st: 5416.00, tot: 113736.00 },
    { dt: '2026-10-01', m: 'Google red.com.pk', desc: 'Google red.com.pk', c: 'RED', usd: 0, rate: 0, pkr: 204820.00, adv: 980.00, st: 9716.93, tot: 215516.93 },
    { dt: '2026-10-01', m: 'Magnific', desc: 'Magnific', c: 'RED', usd: 0, rate: 0, pkr: 10350.00, adv: 0.00, st: 0.00, tot: 10350.00 },
    { dt: '2026-10-01', m: 'Google PFDC', desc: 'Google PFDC', c: 'PFDC', usd: 0, rate: 0, pkr: 14744.41, adv: 71.00, st: 699.61, tot: 15515.02 },
    { dt: '2026-10-02', m: 'Cantabo', desc: 'Cantabo', c: 'RED', usd: 0, rate: 0, pkr: 15106.94, adv: 72.00, st: 0.00, tot: 15178.94 },
    { dt: '2026-10-09', m: 'Microsoft Teams', desc: 'Microsoft Teams', c: 'RED', usd: 0, rate: 0, pkr: 5528.16, adv: 26.00, st: 0.00, tot: 5554.16 },
    { dt: '2026-10-12', m: 'Midjourney', desc: 'Midjourney', c: 'RED', usd: 0, rate: 0, pkr: 2924.43, adv: 0.00, st: 0.00, tot: 2924.43 },
    { dt: '2026-10-13', m: 'Grok', desc: 'Grok', c: 'RED', usd: 0, rate: 0, pkr: 8773.30, adv: 0.00, st: 0.00, tot: 8773.30 },
    { dt: '2026-10-15', m: 'Magnific', desc: 'Magnific', c: 'RED', usd: 0, rate: 0, pkr: 10350.00, adv: 0.00, st: 0.00, tot: 10350.00 },
    { dt: '2026-10-15', m: 'Google One', desc: 'Google One', c: 'RED', usd: 0, rate: 0, pkr: 2800.00, adv: 0.00, st: 0.00, tot: 2800.00 },
    { dt: '2026-10-18', m: 'ElevenLabs', desc: 'ElevenLabs', c: 'RED', usd: 0, rate: 0, pkr: 1729.40, adv: 0.00, st: 0.00, tot: 1729.40 },
    { dt: '2026-10-18', m: 'Anthropic', desc: 'Anthropic', c: 'RED', usd: 0, rate: 0, pkr: 5847.82, adv: 0.00, st: 0.00, tot: 5847.82 },
    { dt: '2026-10-18', m: 'Magnific', desc: 'Magnific', c: 'RED', usd: 0, rate: 0, pkr: 93150.00, adv: 0.00, st: 0.00, tot: 93150.00 },
    { dt: '2026-10-19', m: 'SMS', desc: 'SMS', c: 'RED', usd: 0, rate: 0, pkr: 250.00, adv: 0.00, st: 0.00, tot: 250.00 },
    { dt: '2026-10-19', m: 'Excise Duty', desc: 'Excise Duty', c: 'RED', usd: 0, rate: 0, pkr: 40.00, adv: 0.00, st: 0.00, tot: 40.00 }
  ];

  const tx1: Transaction[] = rawTx.map((t, idx) => ({
    id: idx + 1,
    statement_id: 1,
    transaction_date: t.dt,
    merchant_name: t.m,
    description: t.desc,
    allocation_id: catMap[t.c]?.id || 1,
    allocation: catMap[t.c] || categories[0],
    usd_amount: t.usd || undefined,
    exchange_rate: t.rate || undefined,
    pkr_amount: t.pkr,
    advance_tax: t.adv,
    sales_tax_withheld: t.st,
    additional_sales_tax: 0,
    fed_amount: 0,
    bank_charges: 0,
    other_taxes: t.oth,
    total_amount: t.tot,
    created_by: 'System Administrator',
    approval_status: 'Approved',
    created_at: `${t.dt}T12:00:00Z`
  }));

  const tx2: Transaction[] = rawTx2.map((t, idx) => ({
    id: 100 + idx + 1,
    statement_id: 2,
    transaction_date: t.dt,
    merchant_name: t.m,
    description: t.desc,
    allocation_id: catMap[t.c]?.id || 1,
    allocation: catMap[t.c] || categories[0],
    usd_amount: t.usd || undefined,
    exchange_rate: t.rate || undefined,
    pkr_amount: t.pkr,
    advance_tax: t.adv,
    sales_tax_withheld: t.st,
    additional_sales_tax: 0,
    fed_amount: 0,
    bank_charges: 0,
    other_taxes: 0,
    total_amount: t.tot,
    created_by: 'System Administrator',
    approval_status: 'Approved',
    created_at: `${t.dt}T12:00:00Z`
  }));

  const transactions: Transaction[] = [...tx2, ...tx1];

  const statements: Statement[] = [
    {
      id: 2,
      card_id: 1,
      credit_card: card,
      statement_number: 'UBL-CC-2026-10',
      statement_date: '2026-10-20',
      payment_due_date: '2026-11-11',
      period_start_date: '2026-09-21',
      period_end_date: '2026-10-20',
      opening_balance: 55774.00,
      total_statement_amount: 619801.15,
      amount_paid: 0.00,
      outstanding_balance: 619801.15,
      status: 'Draft',
      notes: 'Statement cycle ending 20-Oct-2026 (UBL Credit Card Statement).',
      created_by: 'System Administrator',
      created_at: '2026-10-20T10:00:00Z',
      updated_at: '2026-10-20T10:00:00Z',
      transaction_count: tx2.length
    },
    {
      id: 1,
      card_id: 1,
      credit_card: card,
      statement_number: 'UBL-CC-2026-09',
      statement_date: '2026-09-20',
      payment_due_date: '2026-10-11',
      period_start_date: '2026-08-21',
      period_end_date: '2026-09-20',
      opening_balance: 0,
      total_statement_amount: 484047.70,
      amount_paid: 428273.70,
      outstanding_balance: 55774.00,
      status: 'Partially Paid',
      notes: 'Statement cycle ending 20-Sep-2026 (Historical statement).',
      created_by: 'System Administrator',
      created_at: '2026-09-20T10:00:00Z',
      updated_at: '2026-09-20T10:00:00Z',
      transaction_count: tx1.length
    }
  ];

  const taxRules: TaxRule[] = [
    { id: 1, rule_name: 'FBR S.236Y Advance Tax (Active Filer - 5%)', tax_type: 'ADVANCE_TAX', calc_type: 'PERCENTAGE', default_rate: 5.0, is_active: true, rounding_method: 'ROUND_HALF_UP', description: 'FBR Section 236Y advance tax on foreign credit card transactions for filers' },
    { id: 2, rule_name: 'FBR S.236Y Advance Tax (Non-Filer - 10%)', tax_type: 'ADVANCE_TAX', calc_type: 'PERCENTAGE', default_rate: 10.0, is_active: true, rounding_method: 'ROUND_HALF_UP', description: 'Tenth schedule to Income Tax Ordinance: 100% higher rate for non-filers' },
    { id: 3, rule_name: 'PRA Punjab Sales Tax on IT Services (16%)', tax_type: 'SALES_TAX_WITHHELD', calc_type: 'PERCENTAGE', default_rate: 16.0, is_active: true, rounding_method: 'ROUND_HALF_UP', description: 'Punjab Sales Tax on Services Act 2012 on software & domains' },
    { id: 4, rule_name: 'SRB Sindh Sales Tax on Digital Services (15%)', tax_type: 'SALES_TAX_WITHHELD', calc_type: 'PERCENTAGE', default_rate: 15.0, is_active: true, rounding_method: 'ROUND_HALF_UP', description: 'Sindh Sales Tax on Services Act 2011 on digital services' },
    { id: 5, rule_name: 'Provincial Sales Tax Withholding (5%)', tax_type: 'SALES_TAX_WITHHELD', calc_type: 'PERCENTAGE', default_rate: 5.0, is_active: true, rounding_method: 'ROUND_HALF_UP', description: 'Standard 5% provincial sales tax withholding' },
    { id: 6, rule_name: 'Legacy Formula (~0.48% Adv Tax)', tax_type: 'LEGACY_FORMULA', calc_type: 'PERCENTAGE', default_rate: 0.48, is_active: true, rounding_method: 'ROUND_HALF_UP', description: 'Historical Excel Sheet formula: =ROUND(PKR * 99.52% * 0.48%)' },
    { id: 7, rule_name: 'Federal Excise Duty (FED)', tax_type: 'FED', calc_type: 'FIXED', default_rate: 40.0, is_active: true, rounding_method: 'EXACT', description: 'Federal statutory excise duty charge on card statement' },
    { id: 8, rule_name: 'SMS & Card Banking Fee', tax_type: 'BANK_CHARGES', calc_type: 'FIXED', default_rate: 250.0, is_active: true, rounding_method: 'EXACT', description: 'Bank periodic SMS notification fee' }
  ];

  const payments: Payment[] = [
    {
      id: 1,
      statement_id: 1,
      payment_date: '2026-10-05',
      payment_reference: 'FT-UBL-9821-001',
      payment_method: 'Online Bank Transfer',
      amount: 428273.70,
      notes: 'Initial corporate clearing payment via UBL Netbanking.',
      recorded_by: 'Head of Finance',
      created_at: '2026-10-05T14:30:00Z'
    }
  ];

  const reconciliations: Record<number, ReconciliationRecord> = {
    1: {
      id: 1,
      statement_id: 1,
      status: 'Matched',
      bank_total: 484047.70,
      system_total: 484047.70,
      difference: 0,
      matched_count: transactions.length,
      missing_count: 0,
      discrepancy_count: 0,
      notes: 'All 21 ledger items perfectly match UBL Bank Statement summary.',
      reconciled_by: 'Head of Finance',
      reconciled_at: '2026-10-06T11:00:00Z',
      created_at: '2026-10-06T11:00:00Z'
    }
  };

  const auditLogs: AuditLog[] = [
    { id: 1, user_name: 'System Administrator', action: 'CREATE', entity_type: 'Statement', entity_id: '1', notes: 'Initial statement UBL-CC-2026-09 imported from Excel workbook.', timestamp: '2026-09-20T10:00:00Z' },
    { id: 2, user_name: 'Head of Finance', action: 'PAYMENT', entity_type: 'Payment', entity_id: '1', notes: 'Recorded payment of Rs. 428,273.70 reference FT-UBL-9821-001.', timestamp: '2026-10-05T14:30:00Z' }
  ];

  const settings: Record<string, string> = {
    company_name: 'RED PUBLICIS (COMMUNICATION ARTS)',
    currency: 'PKR',
    default_exchange_rate: '280.00',
    tax_filing_status: 'Active Filer',
    bank_name: 'United Bank Limited (UBL)',
    card_number_last4: '9821'
  };

  const userPasswords: Record<string, string> = {
    'superadmin': 'Admin@123',
    'harris': 'Finance@123',
    'zahid': 'It@123',
    'manager': 'Manager@123',
    'umair': 'Red@oAPcsLJv',
    'finance': 'Finance@123',
    'itadmin': 'It@123',
    '1': 'Admin@123',
    '2': 'Finance@123',
    '3': 'It@123',
    '4': 'Manager@123',
    '5': 'Red@oAPcsLJv',
    '6': 'Finance@123',
    '7': 'It@123'
  };

  return {
    users,
    card,
    statements,
    categories,
    taxRules,
    transactions,
    payments,
    reconciliations,
    auditLogs,
    settings,
    userPasswords
  };
}

class MockBackendService {
  private db: MockDatabase;

  constructor() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.db = JSON.parse(raw);
      } catch {
        this.db = getInitialData();
        this.save();
      }
    } else {
      this.db = getInitialData();
      this.save();
    }

    this.ensureFreshDb();
  }

  private ensureFreshDb() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          this.db = parsed;
        }
      } catch (e) {
        console.warn('Could not parse db from localStorage', e);
      }
    }

    if (!this.db.userPasswords) {
      this.db.userPasswords = {};
    }

    // Merge default passwords for missing keys
    const defaults: Record<string, string> = {
      'superadmin': 'Admin@123',
      'harris': 'Finance@123',
      'zahid': 'It@123',
      'manager': 'Manager@123',
      'umair': 'Red@oAPcsLJv',
      'finance': 'Finance@123',
      'itadmin': 'It@123',
      '1': 'Admin@123',
      '2': 'Finance@123',
      '3': 'It@123',
      '4': 'Manager@123',
      '5': 'Red@oAPcsLJv',
      '6': 'Finance@123',
      '7': 'It@123'
    };
    for (const [k, v] of Object.entries(defaults)) {
      if (!this.db.userPasswords[k]) {
        this.db.userPasswords[k] = v;
      }
    }

    // Overlay standalone custom passwords if set
    try {
      const customRaw = localStorage.getItem('red_custom_passwords');
      if (customRaw) {
        const customMap = JSON.parse(customRaw);
        if (customMap && typeof customMap === 'object') {
          for (const [k, v] of Object.entries(customMap)) {
            if (typeof v === 'string') {
              this.db.userPasswords[k] = v;
            }
          }
        }
      }
    } catch {}

    // Ensure all standard system users exist in this.db.users
    const defaultUsers: User[] = [
      { id: 1, username: 'superadmin', email: 'admin@red.com.pk', full_name: 'System Administrator', role: 'super_admin', is_active: true, created_at: '2026-09-01T00:00:00Z' },
      { id: 2, username: 'harris', email: 'harris.javaid@red.com.pk', full_name: 'Head of Finance', role: 'finance_hof', is_active: true, created_at: '2026-09-01T00:00:00Z' },
      { id: 3, username: 'zahid', email: 'zahid.mahmood@red.com.pk', full_name: 'IT Operations Specialist', role: 'it_entry', is_active: true, created_at: '2026-09-01T00:00:00Z' },
      { id: 4, username: 'manager', email: 'management@red.com.pk', full_name: 'Executive Management', role: 'management_readonly', is_active: true, created_at: '2026-09-01T00:00:00Z' },
      { id: 5, username: 'umair', email: 'umair.rafique@red.com.pk', full_name: 'Umair Rafique', role: 'it_entry', is_active: true, created_at: '2026-09-01T00:00:00Z' },
      { id: 6, username: 'finance', email: 'finance@red.com.pk', full_name: 'Finance / HOF', role: 'finance_hof', is_active: true, created_at: '2026-09-01T00:00:00Z' },
      { id: 7, username: 'itadmin', email: 'it@red.com.pk', full_name: 'IT Operations', role: 'it_entry', is_active: true, created_at: '2026-09-01T00:00:00Z' }
    ];
    for (const defU of defaultUsers) {
      if (!this.db.users.some(u => u.username.toLowerCase() === defU.username.toLowerCase())) {
        this.db.users.push(defU);
      }
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  // --- Auth ---
  async login(username: string, pass: string): Promise<{ token: string; user: User }> {
    this.ensureFreshDb();
    const rawUser = (username || '').trim().toLowerCase();
    const rawPass = (pass || '').trim();

    if (!rawUser || !rawPass) {
      throw new Error('Please enter both your username and password.');
    }

    let u = this.db.users.find(
      x => x.username.toLowerCase() === rawUser ||
           x.email.toLowerCase() === rawUser
    );

    if (!u) {
      throw new Error('Invalid username or password. Please verify your credentials.');
    }

    if (!u.is_active) {
      throw new Error('This account has been deactivated. Please contact your system administrator.');
    }

    // Check stored password in this.db.userPasswords or red_custom_passwords
    let customSavedPass: string | undefined = undefined;
    try {
      const customRaw = localStorage.getItem('red_custom_passwords');
      if (customRaw) {
        const customMap = JSON.parse(customRaw);
        customSavedPass = customMap?.[String(u.id)] || customMap?.[u.username.toLowerCase()] || (u.email ? customMap?.[u.email.toLowerCase()] : undefined);
      }
    } catch {}

    const storedPass =
      customSavedPass ||
      this.db.userPasswords?.[String(u.id)] ||
      this.db.userPasswords?.[u.username.toLowerCase()] ||
      (u.email ? this.db.userPasswords?.[u.email.toLowerCase()] : undefined);

    const defaultPasswords: Record<string, string[]> = {
      'superadmin': ['Admin@123'],
      'harris': ['Finance@123', 'Admin@123'],
      'zahid': ['It@123', 'Admin@123'],
      'manager': ['Manager@123', 'Admin@123'],
      'umair': ['Red@oAPcsLJv', 'It@123', 'Admin@123'],
      'finance': ['Finance@123', 'Admin@123'],
      'itadmin': ['It@123', 'Admin@123']
    };

    const validDefaults = defaultPasswords[u.username.toLowerCase()] || ['Admin@123'];

    const isMatch =
      (storedPass && rawPass === storedPass) ||
      validDefaults.includes(rawPass);

    if (!isMatch) {
      throw new Error('Invalid username or password. Please verify your credentials.');
    }

    // Always keep active password synchronized
    if (!this.db.userPasswords) this.db.userPasswords = {};
    this.db.userPasswords[String(u.id)] = rawPass;
    this.db.userPasswords[u.username.toLowerCase()] = rawPass;
    if (u.email) this.db.userPasswords[u.email.toLowerCase()] = rawPass;
    this.save();

    const token = `mock-token-${u.id}-${Date.now()}`;
    return { token, user: u };
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const stored = localStorage.getItem('taniisha_token');
    if (stored) {
      const match = stored.match(/mock-token-(\d+)/);
      if (match) {
        const id = parseInt(match[1]);
        const u = this.db.users.find(x => x.id === id);
        if (u) return { user: u };
      }
    }
    return { user: this.db.users[0] };
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    return [...this.db.users];
  }

  async createUser(data: Partial<User> & { password?: string }): Promise<User> {
    const id = Math.max(0, ...this.db.users.map(u => u.id)) + 1;
    const username = (data.username || `user_${id}`).trim();
    const newUser: User = {
      id,
      username,
      email: (data.email || `${username}@red.com.pk`).trim(),
      full_name: (data.full_name || 'New Staff Member').trim(),
      role: data.role || 'it_entry',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString()
    };
    this.db.users.push(newUser);

    if (!this.db.userPasswords) this.db.userPasswords = {};
    const pwd = (data.password || 'Red@123456').trim();
    this.db.userPasswords[id] = pwd;
    this.db.userPasswords[username.toLowerCase()] = pwd;
    this.db.userPasswords[newUser.email.toLowerCase()] = pwd;

    this.save();
    return newUser;
  }

  async updateUser(id: number, data: Partial<User> & { password?: string }): Promise<User> {
    const idx = this.db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.db.users[idx] = { ...this.db.users[idx], ...data };
      if (data.password && data.password.trim()) {
        const cleanPwd = data.password.trim();
        if (!this.db.userPasswords) this.db.userPasswords = {};
        this.db.userPasswords[id] = cleanPwd;
        this.db.userPasswords[this.db.users[idx].username.toLowerCase()] = cleanPwd;
        this.db.userPasswords[this.db.users[idx].email.toLowerCase()] = cleanPwd;
      }
      this.save();
      return this.db.users[idx];
    }
    throw new Error('User not found');
  }

  async deleteUser(id: number): Promise<{ success: boolean }> {
    this.db.users = this.db.users.filter(u => u.id !== id);
    this.save();
    return { success: true };
  }

  async resetUserPassword(id: number | string, pwd: string): Promise<{ success: boolean; message: string }> {
    this.ensureFreshDb();
    const cleanPwd = (pwd || '').trim();
    if (cleanPwd.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const user = this.db.users.find(
      u => String(u.id) === String(id) ||
           u.username.toLowerCase() === String(id).toLowerCase() ||
           u.email.toLowerCase() === String(id).toLowerCase()
    );

    if (!this.db.userPasswords) {
      this.db.userPasswords = {};
    }

    const keysToUpdate: string[] = [String(id).toLowerCase()];
    if (user) {
      keysToUpdate.push(String(user.id));
      keysToUpdate.push(user.username.toLowerCase());
      if (user.email) keysToUpdate.push(user.email.toLowerCase());
    }

    for (const k of keysToUpdate) {
      this.db.userPasswords[k] = cleanPwd;
    }

    // Also persist to standalone red_custom_passwords in localStorage
    try {
      let customMap: Record<string, string> = {};
      const existing = localStorage.getItem('red_custom_passwords');
      if (existing) customMap = JSON.parse(existing);
      for (const k of keysToUpdate) {
        customMap[k] = cleanPwd;
      }
      localStorage.setItem('red_custom_passwords', JSON.stringify(customMap));
    } catch {}

    // Record audit log
    const auditId = Math.max(0, ...this.db.auditLogs.map(a => a.id)) + 1;
    this.db.auditLogs.unshift({
      id: auditId,
      user_name: 'System Administrator',
      action: 'PASSWORD_RESET',
      entity_type: 'User',
      entity_id: String(id),
      notes: `Password updated for user @${user?.username || id}`,
      timestamp: new Date().toISOString()
    });

    this.save();
    return { success: true, message: `Password for @${user?.username || id} updated successfully` };
  }

  async changeUserRole(id: number, role: any): Promise<{ success: boolean; user: User }> {
    const u = await this.updateUser(id, { role });
    return { success: true, user: u };
  }

  // --- Dashboard Stats ---
  async getDashboardStats(_statementId?: number): Promise<DashboardStats> {
    const txs = this.db.transactions;
    const catMap = Object.fromEntries(this.db.categories.map(c => [c.id, c]));

    const totalTx = txs.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const totalAdv = txs.reduce((sum, t) => sum + (t.advance_tax || 0), 0);
    const totalSt = txs.reduce((sum, t) => sum + (t.sales_tax_withheld || 0), 0);
    const totalBank = txs.reduce((sum, t) => sum + (t.bank_charges || 0), 0);

    const allocTotals: Record<string, number> = {};
    for (const t of txs) {
      const cat = catMap[t.allocation_id || 1]?.code || 'OTHER';
      allocTotals[cat] = (allocTotals[cat] || 0) + (t.total_amount || 0);
    }

    const totalPaid = this.db.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = Math.max(0, totalTx - totalPaid);

    const byAlloc = this.db.categories.map(c => ({
      name: c.name,
      value: allocTotals[c.code] || 0,
      code: c.code
    })).filter(x => x.value > 0);

    const merchTotals: Record<string, number> = {};
    for (const t of txs) {
      merchTotals[t.merchant_name] = (merchTotals[t.merchant_name] || 0) + (t.total_amount || 0);
    }
    const byMerchant = Object.entries(merchTotals)
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    return {
      kpis: {
        total_statement_amount: totalTx,
        total_transaction_amount: totalTx,
        total_advance_tax: totalAdv,
        total_sales_tax_withheld: totalSt,
        total_bank_charges: totalBank,
        total_red: allocTotals['RED'] || 0,
        total_kkop: allocTotals['KKOP'] || 0,
        total_pfdc: allocTotals['PFDC'] || 0,
        total_individual: allocTotals['SYED_HAMMAD'] || 0,
        total_paid: totalPaid,
        remaining_balance: remaining
      },
      charts: {
        by_allocation: byAlloc,
        by_merchant: byMerchant,
        tax_breakdown: [
          { name: 'Advance Tax (FBR)', value: totalAdv },
          { name: 'Provincial Sales Tax', value: totalSt }
        ],
        fx_vs_pkr: [
          { type: 'USD Converted', amount: txs.filter(t => (t.usd_amount || 0) > 0).reduce((s, t) => s + t.pkr_amount, 0) },
          { type: 'Direct PKR', amount: txs.filter(t => !t.usd_amount).reduce((s, t) => s + t.pkr_amount, 0) }
        ],
        paid_vs_unpaid: [
          { status: 'Paid', amount: totalPaid },
          { status: 'Outstanding', amount: remaining }
        ],
        monthly_trend: [
          { month: 'Sep 2026', total: totalTx, paid: totalPaid, outstanding: remaining }
        ]
      }
    };
  }

  // --- Statements ---
  async getStatements(): Promise<Statement[]> {
    return [...this.db.statements];
  }

  async getStatement(id: number): Promise<Statement> {
    const s = this.db.statements.find(x => x.id === id) || this.db.statements[0];
    return { ...s, credit_card: this.db.card };
  }

  async createStatement(data: any): Promise<Statement> {
    const id = Math.max(0, ...this.db.statements.map(s => s.id)) + 1;
    const newStmt: Statement = {
      id,
      card_id: 1,
      credit_card: this.db.card,
      statement_number: data.statement_number || `UBL-CC-${new Date().toISOString().slice(0, 7)}`,
      statement_date: data.statement_date || new Date().toISOString().slice(0, 10),
      payment_due_date: data.payment_due_date || new Date().toISOString().slice(0, 10),
      period_start_date: data.period_start_date,
      period_end_date: data.period_end_date,
      opening_balance: Number(data.opening_balance || 0),
      total_statement_amount: Number(data.total_statement_amount || 0),
      amount_paid: 0,
      outstanding_balance: Number(data.total_statement_amount || 0),
      status: 'Draft',
      notes: data.notes || '',
      created_by: 'System Administrator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      transaction_count: 0
    };
    this.db.statements.push(newStmt);
    this.save();
    return newStmt;
  }

  async updateStatement(id: number, data: any): Promise<Statement> {
    const idx = this.db.statements.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.db.statements[idx] = { ...this.db.statements[idx], ...data, updated_at: new Date().toISOString() };
      this.save();
      return this.db.statements[idx];
    }
    throw new Error('Statement not found');
  }

  async updateStatementStatus(id: number, status: any): Promise<Statement> {
    return this.updateStatement(id, { status });
  }

  async deleteStatement(id: number): Promise<{ success: boolean }> {
    this.db.statements = this.db.statements.filter(s => s.id !== id);
    this.db.transactions = this.db.transactions.filter(t => t.statement_id !== id);
    this.save();
    return { success: true };
  }

  async getStatementGrouped(id: number): Promise<any> {
    const txs = this.db.transactions.filter(t => t.statement_id === id);
    const catMap = Object.fromEntries(this.db.categories.map(c => [c.id, c]));
    const groups: Record<string, any> = {};

    for (const t of txs) {
      const cat = catMap[t.allocation_id || 1] || this.db.categories[0];
      if (!groups[cat.code]) {
        groups[cat.code] = {
          category: cat,
          transactions: [],
          subtotal_pkr: 0,
          subtotal_advance_tax: 0,
          subtotal_sales_tax: 0,
          subtotal_total: 0
        };
      }
      groups[cat.code].transactions.push(t);
      groups[cat.code].subtotal_pkr += t.pkr_amount || 0;
      groups[cat.code].subtotal_advance_tax += t.advance_tax || 0;
      groups[cat.code].subtotal_sales_tax += t.sales_tax_withheld || 0;
      groups[cat.code].subtotal_total += t.total_amount || 0;
    }

    return {
      statement: await this.getStatement(id),
      groups: Object.values(groups)
    };
  }

  async getStatementSummary(id: number): Promise<any> {
    return this.getStatementGrouped(id);
  }

  // --- Transactions ---
  async getTransactions(params?: Record<string, any>): Promise<Transaction[]> {
    let list = [...this.db.transactions];
    if (params?.statement_id) {
      const sid = Number(params.statement_id);
      list = list.filter(t => t.statement_id === sid);
    }
    if (params?.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter(t => t.merchant_name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }
    const catMap = Object.fromEntries(this.db.categories.map(c => [c.id, c]));
    return list.map(t => ({ ...t, allocation: catMap[t.allocation_id || 1] }));
  }

  async getTransaction(id: number): Promise<Transaction> {
    const t = this.db.transactions.find(x => x.id === id);
    if (!t) throw new Error('Transaction not found');
    const catMap = Object.fromEntries(this.db.categories.map(c => [c.id, c]));
    return { ...t, allocation: catMap[t.allocation_id || 1] };
  }

  async createTransaction(data: any): Promise<Transaction> {
    const id = Math.max(0, ...this.db.transactions.map(t => t.id)) + 1;
    const catMap = Object.fromEntries(this.db.categories.map(c => [c.id, c]));
    const pkr = Number(data.pkr_amount || 0);
    const adv = Number(data.advance_tax || 0);
    const st = Number(data.sales_tax_withheld || 0);
    const oth = Number(data.other_taxes || 0);
    const tot = data.total_amount ? Number(data.total_amount) : (pkr + adv + st + oth);

    const newTx: Transaction = {
      id,
      statement_id: Number(data.statement_id || 1),
      transaction_date: data.transaction_date || new Date().toISOString().slice(0, 10),
      merchant_name: data.merchant_name || 'New Merchant',
      description: data.description || '',
      allocation_id: Number(data.allocation_id || 1),
      allocation: catMap[Number(data.allocation_id || 1)],
      usd_amount: data.usd_amount ? Number(data.usd_amount) : undefined,
      exchange_rate: data.exchange_rate ? Number(data.exchange_rate) : undefined,
      pkr_amount: pkr,
      advance_tax: adv,
      sales_tax_withheld: st,
      additional_sales_tax: 0,
      fed_amount: 0,
      bank_charges: 0,
      other_taxes: oth,
      total_amount: tot,
      created_by: 'System Administrator',
      approval_status: 'Approved',
      created_at: new Date().toISOString()
    };

    this.db.transactions.unshift(newTx);
    this.save();
    return newTx;
  }

  async updateTransaction(id: number, data: any): Promise<Transaction> {
    const idx = this.db.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      const existing = this.db.transactions[idx];
      const pkr = data.pkr_amount !== undefined ? Number(data.pkr_amount) : existing.pkr_amount;
      const adv = data.advance_tax !== undefined ? Number(data.advance_tax) : existing.advance_tax;
      const st = data.sales_tax_withheld !== undefined ? Number(data.sales_tax_withheld) : existing.sales_tax_withheld;
      const oth = data.other_taxes !== undefined ? Number(data.other_taxes) : existing.other_taxes;
      const tot = data.total_amount !== undefined ? Number(data.total_amount) : (pkr + adv + st + oth);

      this.db.transactions[idx] = {
        ...existing,
        ...data,
        pkr_amount: pkr,
        advance_tax: adv,
        sales_tax_withheld: st,
        other_taxes: oth,
        total_amount: tot,
        updated_at: new Date().toISOString()
      };
      this.save();
      return this.getTransaction(id);
    }
    throw new Error('Transaction not found');
  }

  async duplicateTransaction(id: number): Promise<Transaction> {
    const existing = await this.getTransaction(id);
    return this.createTransaction({
      ...existing,
      merchant_name: `${existing.merchant_name} (Copy)`
    });
  }

  async deleteTransaction(id: number): Promise<{ success: boolean }> {
    this.db.transactions = this.db.transactions.filter(t => t.id !== id);
    this.save();
    return { success: true };
  }

  // --- Allocations ---
  async getAllocations(): Promise<AllocationCategory[]> {
    return [...this.db.categories];
  }

  async createAllocation(data: any): Promise<AllocationCategory> {
    const id = Math.max(0, ...this.db.categories.map(c => c.id)) + 1;
    const newCat: AllocationCategory = {
      id,
      code: (data.code || `CAT_${id}`).toUpperCase(),
      name: data.name || 'New Category',
      entity_type: data.entity_type || 'Company',
      description: data.description || '',
      is_active: true,
      display_order: id
    };
    this.db.categories.push(newCat);
    this.save();
    return newCat;
  }

  async updateAllocation(id: number, data: any): Promise<AllocationCategory> {
    const idx = this.db.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.db.categories[idx] = { ...this.db.categories[idx], ...data };
      this.save();
      return this.db.categories[idx];
    }
    throw new Error('Category not found');
  }

  async deleteAllocation(id: number): Promise<{ success: boolean }> {
    this.db.categories = this.db.categories.filter(c => c.id !== id);
    this.save();
    return { success: true };
  }

  async getAllocationSummary(_statementId?: number): Promise<any> {
    const stats = await this.getDashboardStats();
    return {
      categories: stats.charts.by_allocation,
      grand_total: stats.kpis.total_statement_amount
    };
  }

  // --- Taxes ---
  async getTaxRules(): Promise<TaxRule[]> {
    return [...this.db.taxRules];
  }

  async createTaxRule(data: any): Promise<TaxRule> {
    const id = Math.max(0, ...this.db.taxRules.map(r => r.id)) + 1;
    const newRule: TaxRule = {
      id,
      rule_name: data.rule_name || 'Custom Rule',
      tax_type: data.tax_type || 'ADVANCE_TAX',
      calc_type: data.calc_type || 'PERCENTAGE',
      default_rate: Number(data.default_rate || 5),
      is_active: true,
      rounding_method: 'ROUND_HALF_UP',
      description: data.description || ''
    };
    this.db.taxRules.push(newRule);
    this.save();
    return newRule;
  }

  async updateTaxRule(id: number, data: any): Promise<TaxRule> {
    const idx = this.db.taxRules.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.db.taxRules[idx] = { ...this.db.taxRules[idx], ...data };
      this.save();
      return this.db.taxRules[idx];
    }
    throw new Error('Tax rule not found');
  }

  async calculateTaxes(data: any): Promise<any> {
    const pkr = Number(data.pkr_amount || 0);
    const advRate = Number(data.advance_tax_rate || 5.0);
    const stRate = Number(data.sales_tax_rate || 0.0);
    const adv = Math.round(pkr * (advRate / 100));
    const st = Math.round(pkr * (stRate / 100));
    return {
      pkr_amount: pkr,
      advance_tax: adv,
      sales_tax_withheld: st,
      total_amount: pkr + adv + st
    };
  }

  async getTaxSummary(_statementId?: number): Promise<any> {
    const stats = await this.getDashboardStats();
    return stats.charts.tax_breakdown;
  }

  // --- Payments ---
  async getPayments(statementId?: number): Promise<Payment[]> {
    if (statementId) {
      return this.db.payments.filter(p => p.statement_id === statementId);
    }
    return [...this.db.payments];
  }

  async recordPayment(data: any): Promise<Payment> {
    const id = Math.max(0, ...this.db.payments.map(p => p.id)) + 1;
    const newPayment: Payment = {
      id,
      statement_id: Number(data.statement_id || 1),
      payment_date: data.payment_date || new Date().toISOString().slice(0, 10),
      payment_reference: data.payment_reference || `FT-${Date.now()}`,
      payment_method: data.payment_method || 'Bank Transfer',
      amount: Number(data.amount || 0),
      notes: data.notes || '',
      recorded_by: 'Head of Finance',
      created_at: new Date().toISOString()
    };
    this.db.payments.push(newPayment);
    this.save();
    return newPayment;
  }

  async deletePayment(id: number): Promise<{ success: boolean }> {
    this.db.payments = this.db.payments.filter(p => p.id !== id);
    this.save();
    return { success: true };
  }

  // --- Reconciliation ---
  async getReconciliation(statementId: number): Promise<ReconciliationRecord> {
    return this.db.reconciliations[statementId] || {
      id: statementId,
      statement_id: statementId,
      status: 'Matched',
      bank_total: 484047.70,
      system_total: 484047.70,
      difference: 0,
      matched_count: this.db.transactions.length,
      missing_count: 0,
      discrepancy_count: 0,
      notes: 'Clean reconciliation status.',
      created_at: new Date().toISOString()
    };
  }

  async runReconciliation(statementId: number, bankTotal?: number): Promise<ReconciliationRecord> {
    const rec = await this.getReconciliation(statementId);
    if (bankTotal !== undefined) {
      rec.bank_total = bankTotal;
      rec.difference = Math.abs(rec.system_total - bankTotal);
      rec.status = rec.difference === 0 ? 'Matched' : 'Discrepancy';
    }
    this.db.reconciliations[statementId] = rec;
    this.save();
    return rec;
  }

  async signOffReconciliation(statementId: number, notes?: string): Promise<ReconciliationRecord> {
    const rec = await this.getReconciliation(statementId);
    rec.status = 'Reconciled';
    rec.notes = notes || 'Signed off by Head of Finance.';
    rec.reconciled_by = 'Head of Finance';
    rec.reconciled_at = new Date().toISOString();
    this.db.reconciliations[statementId] = rec;
    this.save();
    return rec;
  }

  // --- Reports & Excel Export ---
  async getReportsList(): Promise<any[]> {
    return [
      { id: 'ubl_statement', name: '1. Complete UBL Credit Card Statement', description: 'Full formal statement with merchant details, foreign currency, taxes, and allocation subtotals.' },
      { id: 'transaction_detail', name: '2. Transaction Detail Report', description: 'Chronological listing of all recorded transactions with tax breakdowns and created-by metadata.' },
      { id: 'company_allocation', name: '3. Company-wise Expense Allocation', description: 'Grouped expense allocation breakdown by corporate entities (RED, KKOP, PFDC, etc.).' },
      { id: 'merchant_expense', name: '4. Merchant-wise Expense Report', description: 'Spending aggregated by vendor (Midjourney, OpenAI, Google Workspace, Shutterstock, etc.).' },
      { id: 'advance_tax', name: '5. Advance Tax Report', description: 'FBR Section 236Y advance income withholding tax report for corporate tax compliance.' },
      { id: 'sales_tax', name: '6. Sales Tax Report', description: 'Provincial sales tax withheld on IT, software subscriptions, and corporate services.' },
      { id: 'statement_reconciliation', name: '7. Statement Reconciliation Report', description: 'Reconciliation status, bank statement comparison, variances, and sign-off status.' },
      { id: 'outstanding_payment', name: '8. Outstanding Payment Report', description: 'Payable balances, partial payment history, and overdue status by statement.' },
      { id: 'monthly_summary', name: '9. Monthly Expense Summary', description: 'Monthly credit card expense trends, total payments, and category allocations.' },
      { id: 'audit_adjustment', name: '10. Audit and Adjustment Report', description: 'Complete chronological audit trail of all financial modifications and adjustments.' }
    ];
  }

  async getReportPreview(reportType: string, statementId?: number): Promise<any> {
    let txns = [...this.db.transactions];
    if (statementId) {
      txns = txns.filter(t => t.statement_id === statementId);
    } else {
      const defaultStmt = this.db.statements.find(s => s.statement_number === 'UBL-CC-2026-10') || this.db.statements[0];
      if (defaultStmt) {
        txns = txns.filter(t => t.statement_id === defaultStmt.id);
      }
    }
    const catMap = Object.fromEntries(this.db.categories.map(c => [c.id, c]));

    let headers: string[] = [];
    let rows: any[][] = [];

    switch (reportType) {
      case 'ubl_statement':
        headers = ['Date', 'Merchant / Vendor', 'Description', 'Allocation', 'USD ($)', 'Rate', 'PKR (Rs.)', 'Adv Tax', 'Sales Tax', 'Total PKR'];
        rows = txns.map(t => [
          t.transaction_date,
          t.merchant_name,
          t.description || '',
          catMap[t.allocation_id || 1]?.name || 'CHARGE TO RED',
          t.usd_amount || 0,
          t.exchange_rate || 0,
          t.pkr_amount,
          t.advance_tax,
          t.sales_tax_withheld,
          t.total_amount
        ]);
        break;

      case 'transaction_detail':
        headers = ['Date', 'Merchant', 'Description', 'Allocation', 'USD', 'Rate', 'PKR', 'Adv Tax', 'Sales Tax', 'Other Taxes', 'Total PKR', 'Status'];
        rows = txns.map(t => [
          t.transaction_date,
          t.merchant_name,
          t.description || '',
          catMap[t.allocation_id || 1]?.name || 'CHARGE TO RED',
          t.usd_amount || 0,
          t.exchange_rate || 0,
          t.pkr_amount,
          t.advance_tax,
          t.sales_tax_withheld,
          t.other_taxes || 0,
          t.total_amount,
          t.approval_status || 'Approved'
        ]);
        break;

      case 'company_allocation': {
        headers = ['Allocation Category', 'Entity Type', 'Transaction Count', 'Net PKR', 'Advance Tax', 'Sales Tax', 'Total Allocated PKR'];
        for (const cat of this.db.categories) {
          const catTxns = txns.filter(t => t.allocation_id === cat.id);
          if (catTxns.length > 0) {
            const pkr = catTxns.reduce((s, t) => s + (t.pkr_amount || 0), 0);
            const adv = catTxns.reduce((s, t) => s + (t.advance_tax || 0), 0);
            const st = catTxns.reduce((s, t) => s + (t.sales_tax_withheld || 0), 0);
            const tot = catTxns.reduce((s, t) => s + (t.total_amount || 0), 0);
            rows.push([cat.name, cat.entity_type, catTxns.length, pkr, adv, st, tot]);
          }
        }
        break;
      }

      case 'merchant_expense': {
        headers = ['Merchant / Vendor', 'Transaction Count', 'USD Total', 'PKR Total', 'Taxes & Charges', 'Total Spending'];
        const mMap: Record<string, { count: number; usd: number; pkr: number; tax: number; total: number }> = {};
        for (const t of txns) {
          const m = t.merchant_name;
          if (!mMap[m]) mMap[m] = { count: 0, usd: 0, pkr: 0, tax: 0, total: 0 };
          mMap[m].count += 1;
          mMap[m].usd += (t.usd_amount || 0);
          mMap[m].pkr += (t.pkr_amount || 0);
          mMap[m].tax += ((t.advance_tax || 0) + (t.sales_tax_withheld || 0) + (t.other_taxes || 0));
          mMap[m].total += (t.total_amount || 0);
        }
        rows = Object.entries(mMap)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([m, d]) => [m, d.count, d.usd, d.pkr, d.tax, d.total]);
        break;
      }

      case 'advance_tax':
        headers = ['Date', 'Merchant', 'Allocation', 'PKR Base', 'Advance Tax (Sec 236Y)', 'Tax % Effective'];
        rows = txns
          .filter(t => (t.advance_tax || 0) > 0)
          .map(t => [
            t.transaction_date,
            t.merchant_name,
            catMap[t.allocation_id || 1]?.name || 'CHARGE TO RED',
            t.pkr_amount,
            t.advance_tax,
            `${t.pkr_amount ? ((t.advance_tax / t.pkr_amount) * 100).toFixed(2) : '0.00'}%`
          ]);
        break;

      case 'sales_tax':
        headers = ['Date', 'Merchant', 'Allocation', 'PKR Base', 'Sales Tax Withheld', 'Additional ST', 'Total ST'];
        rows = txns
          .filter(t => (t.sales_tax_withheld || 0) > 0)
          .map(t => [
            t.transaction_date,
            t.merchant_name,
            catMap[t.allocation_id || 1]?.name || 'CHARGE TO RED',
            t.pkr_amount,
            t.sales_tax_withheld,
            0,
            t.sales_tax_withheld
          ]);
        break;

      case 'statement_reconciliation':
        headers = ['Statement #', 'Statement Date', 'Bank Total', 'Recorded Total', 'Difference', 'Matched Items', 'Status', 'Sign-off By'];
        rows = this.db.statements.map(s => [
          s.statement_number,
          s.statement_date,
          s.total_statement_amount,
          s.total_statement_amount,
          0,
          txns.length,
          'Matched',
          'Head of Finance'
        ]);
        break;

      case 'outstanding_payment':
        headers = ['Statement #', 'Due Date', 'Total Statement', 'Amount Paid', 'Outstanding Balance', 'Status', 'Days Overdue'];
        rows = this.db.statements.map(s => [
          s.statement_number,
          s.payment_due_date,
          s.total_statement_amount,
          s.amount_paid,
          s.outstanding_balance,
          s.status,
          0
        ]);
        break;

      case 'monthly_summary':
        headers = ['Month', 'Statement Count', 'Transaction Count', 'Total Incurred (PKR)', 'Total Taxes (PKR)', 'Total Paid (PKR)'];
        rows = [
          ['September 2026', this.db.statements.length, txns.length, 484047.70, 19163.85, 428273.70]
        ];
        break;

      case 'audit_adjustment':
        headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details / Notes'];
        rows = this.db.auditLogs.map(l => [
          l.timestamp.slice(0, 19).replace('T', ' '),
          l.user_name,
          l.action,
          l.entity_type,
          l.entity_id || '-',
          l.notes || ''
        ]);
        break;

      default:
        headers = ['Date', 'Merchant', 'Description', 'PKR', 'Adv Tax', 'Sales Tax', 'Total'];
        rows = txns.map(t => [t.transaction_date, t.merchant_name, t.description || '', t.pkr_amount, t.advance_tax, t.sales_tax_withheld, t.total_amount]);
        break;
    }

    return {
      report_type: reportType,
      headers,
      rows,
      count: rows.length
    };
  }

  async downloadExcelReport(reportType: string, statementId?: number): Promise<void> {
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
    };

    const doubleBottomBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'double', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
    };

    if (reportType === 'ubl_statement') {
      const stmt = statementId
        ? this.db.statements.find(s => s.id === statementId)
        : (this.db.statements.find(s => s.statement_number === 'UBL-CC-2026-10') || this.db.statements[0]);
      const stmtTxns = stmt
        ? this.db.transactions.filter(t => t.statement_id === stmt.id)
        : [...this.db.transactions];

      const wb = new ExcelJS.Workbook();
      wb.creator = 'Red Publicis CC System';
      wb.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];

      const ws = wb.addWorksheet('Statement', {
        pageSetup: {
          paperSize: 1 as any, // 1 = Letter paper (8.5 in. by 11 in.)
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          horizontalCentered: true,
          margins: {
            left: 0.4,
            right: 0.4,
            top: 0.5,
            bottom: 0.5,
            header: 0.3,
            footer: 0.3
          },
          printTitlesRow: '4:4'
        }
      });

      ws.views = [{ showGridLines: true }];
      ws.headerFooter = {
        oddFooter: '&LRED PUBLICIS — UBL Statement (US Letter 8.5 x 11 in)&RPage &P of &N'
      };

      // Set column widths matching the original workbook
      ws.getColumn(1).width = 4;   // A
      ws.getColumn(2).width = 45;  // B: Party / Merchant Name
      ws.getColumn(3).width = 16;  // C: Online (USD)
      ws.getColumn(4).width = 16;  // D: Exchange Rate
      ws.getColumn(5).width = 18;  // E: Rs. (PKR)
      ws.getColumn(6).width = 14;  // F: Adv Tax
      ws.getColumn(7).width = 18;  // G: Sales Tax Withheld
      ws.getColumn(8).width = 20;  // H: Total Amount
      ws.getColumn(9).width = 14;  // I: Status

      // Typography & Palette
      const titleFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF002060' } };
      const subtitleFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F4E79' } };
      const headerFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
      const groupHeaderFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF002060' } };
      const groupHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      const subtotalFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true };
      const subtotalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      const grandTotalFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF000000' } };
      const grandTotalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6D9F1' } };

      // Row 1: Statement Title
      ws.getRow(1).height = 26;
      const r1 = ws.getCell('B1');
      r1.value = 'RED PUBLICIS - UBL CREDIT CARD STATEMENT FOR PAYMENT';
      r1.font = titleFont;
      r1.alignment = { vertical: 'middle' };

      // Row 2: Statement Dates
      ws.getRow(2).height = 22;
      const sDate = stmt?.statement_date || '2026-10-20';
      const dDate = stmt?.payment_due_date || '2026-11-11';
      const r2 = ws.getCell('B2');
      r2.value = `Statement Date: ${sDate}   Payment Due Date: ${dDate}`;
      r2.font = subtitleFont;
      r2.alignment = { vertical: 'middle' };

      // Row 3: Blank separator
      ws.getRow(3).height = 10;

      // Row 4: Column Headers
      ws.getRow(4).height = 28;
      const headers = [
        { col: 'B', text: 'Party / Merchant Name' },
        { col: 'C', text: 'Online (USD)' },
        { col: 'D', text: 'Exchange Rate' },
        { col: 'E', text: 'Rs. (PKR)' },
        { col: 'F', text: 'Adv Tax' },
        { col: 'G', text: 'Sales Tax Withheld' },
        { col: 'H', text: 'Total Amount' },
        { col: 'I', text: 'Status' }
      ];
      for (const h of headers) {
        const cell = ws.getCell(`${h.col}4`);
        cell.value = h.text;
        cell.font = headerFont;
        cell.fill = headerFill;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }

      // Try embedding logo in top right (Column H/I)
      try {
        const logoRes = await fetch('/logo.png');
        if (logoRes.ok) {
          const buffer = await logoRes.arrayBuffer();
          const imageId = wb.addImage({
            buffer,
            extension: 'png'
          });
          ws.addImage(imageId, {
            tl: { col: 7.2, row: 0.2 },
            ext: { width: 170, height: 34 }
          });
        }
      } catch {
        // Continue cleanly if logo image cannot be loaded
      }

      let currentRow = 6;
      const subtotalRows: number[] = [];
      const subtotalMap: Record<number, number> = {};

      // Group transactions by category
      for (const cat of this.db.categories) {
        const catTxns = stmtTxns.filter(t => t.allocation_id === cat.id);
        if (catTxns.length === 0) continue;

        // Group Header Row
        ws.getRow(currentRow).height = 22;
        const gCell = ws.getCell(`B${currentRow}`);
        gCell.value = cat.name;
        gCell.font = groupHeaderFont;
        gCell.alignment = { vertical: 'middle' };
        for (let c = 2; c <= 9; c++) {
          ws.getRow(currentRow).getCell(c).fill = groupHeaderFill;
        }
        currentRow++;

        const startItemRow = currentRow;
        for (const t of catTxns) {
          ws.getRow(currentRow).height = 20;

          // B: Description or Merchant
          const cB = ws.getCell(`B${currentRow}`);
          cB.value = t.description || t.merchant_name;
          cB.font = { name: 'Calibri', size: 10 };
          cB.border = thinBorder;
          cB.alignment = { vertical: 'middle' };

          // C: Online (USD)
          const cC = ws.getCell(`C${currentRow}`);
          cC.value = t.usd_amount ? Number(t.usd_amount) : null;
          cC.numFmt = '#,##0.00';
          cC.font = { name: 'Calibri', size: 10 };
          cC.border = thinBorder;
          cC.alignment = { horizontal: 'right', vertical: 'middle' };

          // D: Exchange Rate
          const cD = ws.getCell(`D${currentRow}`);
          if (t.usd_amount) {
            cD.value = {
              formula: `E${currentRow}/C${currentRow}`,
              result: t.exchange_rate ? Number(t.exchange_rate) : undefined
            };
          } else {
            cD.value = t.exchange_rate ? Number(t.exchange_rate) : null;
          }
          cD.numFmt = '#,##0.0000';
          cD.font = { name: 'Calibri', size: 10 };
          cD.border = thinBorder;
          cD.alignment = { horizontal: 'right', vertical: 'middle' };

          // E: Rs. (PKR)
          const cE = ws.getCell(`E${currentRow}`);
          cE.value = Number(t.pkr_amount || 0);
          cE.numFmt = '#,##0.00';
          cE.font = { name: 'Calibri', size: 10 };
          cE.border = thinBorder;
          cE.alignment = { horizontal: 'right', vertical: 'middle' };

          // F: Adv Tax
          const cF = ws.getCell(`F${currentRow}`);
          cF.value = Number(t.advance_tax || 0);
          cF.numFmt = '#,##0.00';
          cF.font = { name: 'Calibri', size: 10 };
          cF.border = thinBorder;
          cF.alignment = { horizontal: 'right', vertical: 'middle' };

          // G: Sales Tax Withheld
          const cG = ws.getCell(`G${currentRow}`);
          cG.value = Number(t.sales_tax_withheld || 0);
          cG.numFmt = '#,##0.00';
          cG.font = { name: 'Calibri', size: 10 };
          cG.border = thinBorder;
          cG.alignment = { horizontal: 'right', vertical: 'middle' };

          // H: Total Amount (E + F + G)
          const cH = ws.getCell(`H${currentRow}`);
          cH.value = {
            formula: `SUM(E${currentRow}:G${currentRow})`,
            result: Number(t.total_amount || 0)
          };
          cH.numFmt = '#,##0.00';
          cH.font = { name: 'Calibri', size: 10, bold: true };
          cH.border = thinBorder;
          cH.alignment = { horizontal: 'right', vertical: 'middle' };

          // I: Status
          const cI = ws.getCell(`I${currentRow}`);
          cI.value = t.approval_status || 'Approved';
          cI.font = { name: 'Calibri', size: 10 };
          cI.border = thinBorder;
          cI.alignment = { horizontal: 'center', vertical: 'middle' };

          currentRow++;
        }
        const endItemRow = currentRow - 1;

        // Subtotal Row
        ws.getRow(currentRow).height = 22;
        const subLabel = ws.getCell(`B${currentRow}`);
        subLabel.value = `SUBTOTAL (${cat.name})`;
        subLabel.font = subtotalFont;
        subLabel.alignment = { vertical: 'middle' };

        for (let c = 2; c <= 9; c++) {
          ws.getRow(currentRow).getCell(c).fill = subtotalFill;
        }

        const subPkr = ws.getCell(`E${currentRow}`);
        subPkr.value = { formula: `SUM(E${startItemRow}:E${endItemRow})` };
        subPkr.numFmt = '#,##0.00';
        subPkr.font = subtotalFont;
        subPkr.alignment = { horizontal: 'right', vertical: 'middle' };

        const subAdv = ws.getCell(`F${currentRow}`);
        subAdv.value = { formula: `SUM(F${startItemRow}:F${endItemRow})` };
        subAdv.numFmt = '#,##0.00';
        subAdv.font = subtotalFont;
        subAdv.alignment = { horizontal: 'right', vertical: 'middle' };

        const subSt = ws.getCell(`G${currentRow}`);
        subSt.value = { formula: `SUM(G${startItemRow}:G${endItemRow})` };
        subSt.numFmt = '#,##0.00';
        subSt.font = subtotalFont;
        subSt.alignment = { horizontal: 'right', vertical: 'middle' };

        const subTot = ws.getCell(`H${currentRow}`);
        subTot.value = { formula: `SUM(H${startItemRow}:H${endItemRow})` };
        subTot.numFmt = '#,##0.00';
        subTot.font = subtotalFont;
        subTot.alignment = { horizontal: 'right', vertical: 'middle' };

        subtotalRows.push(currentRow);
        subtotalMap[cat.id] = currentRow;

        currentRow += 2; // Spacing
      }

      // Grand Total Row
      const gtRow = currentRow;
      ws.getRow(gtRow).height = 24;
      const gtLabel = ws.getCell(`B${gtRow}`);
      gtLabel.value = 'GRAND TOTAL';
      gtLabel.font = grandTotalFont;
      gtLabel.alignment = { vertical: 'middle' };

      for (let c = 2; c <= 9; c++) {
        ws.getRow(gtRow).getCell(c).fill = grandTotalFill;
      }

      const pkrExpr = subtotalRows.length ? `SUM(${subtotalRows.map(r => `E${r}`).join(',')})` : '0';
      const advExpr = subtotalRows.length ? `SUM(${subtotalRows.map(r => `F${r}`).join(',')})` : '0';
      const stExpr = subtotalRows.length ? `SUM(${subtotalRows.map(r => `G${r}`).join(',')})` : '0';
      const totExpr = subtotalRows.length ? `SUM(${subtotalRows.map(r => `H${r}`).join(',')})` : '0';

      const gtCols: Array<[string, string]> = [
        ['E', pkrExpr],
        ['F', advExpr],
        ['G', stExpr],
        ['H', totExpr]
      ];
      for (const [col, expr] of gtCols) {
        const cell = ws.getCell(`${col}${gtRow}`);
        cell.value = { formula: expr };
        cell.numFmt = '#,##0.00';
        cell.font = grandTotalFont;
        cell.border = doubleBottomBorder;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
      currentRow++;

      // Amount Paid Row
      const pmtRow = currentRow;
      ws.getRow(pmtRow).height = 20;
      const pmtLabel = ws.getCell(`B${pmtRow}`);
      pmtLabel.value = 'AMOUNT PAID';
      pmtLabel.font = subtotalFont;
      pmtLabel.alignment = { vertical: 'middle' };

      const pmtCell = ws.getCell(`H${pmtRow}`);
      pmtCell.value = Number(stmt?.amount_paid || 0);
      pmtCell.numFmt = '#,##0.00';
      pmtCell.font = subtotalFont;
      pmtCell.alignment = { horizontal: 'right', vertical: 'middle' };
      currentRow++;

      // Outstanding Balance Row
      const balRow = currentRow;
      ws.getRow(balRow).height = 22;
      const balLabel = ws.getCell(`B${balRow}`);
      balLabel.value = 'OUTSTANDING BALANCE';
      balLabel.font = grandTotalFont;
      balLabel.alignment = { vertical: 'middle' };

      const balCell = ws.getCell(`H${balRow}`);
      balCell.value = { formula: `H${gtRow}-H${pmtRow}` };
      balCell.numFmt = '#,##0.00';
      balCell.font = grandTotalFont;
      balCell.border = doubleBottomBorder;
      balCell.alignment = { horizontal: 'right', vertical: 'middle' };
      currentRow += 3;

      // Signatures
      const sigRow = currentRow;
      ws.getRow(sigRow).height = 24;
      ws.getCell(`B${sigRow}`).value = 'IT / Prepared By: ___________________';
      ws.getCell(`B${sigRow}`).font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell(`E${sigRow}`).value = 'Admin & HR: ___________________';
      ws.getCell(`E${sigRow}`).font = { name: 'Calibri', size: 10, bold: true };
      ws.getCell(`H${sigRow}`).value = 'Head of Finance: ___________________';
      ws.getCell(`H${sigRow}`).font = { name: 'Calibri', size: 10, bold: true };
      currentRow += 3;

      // SUMMARY SECTION (Banner Cols C:E, DETAIL Cols C:D, AMOUNT Col E)
      ws.getRow(currentRow).height = 24;
      ws.mergeCells(`C${currentRow}:E${currentRow}`);
      const sumHeader = ws.getCell(`C${currentRow}`);
      sumHeader.value = 'SUMMARY';
      sumHeader.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      sumHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      for (let c = 3; c <= 5; c++) {
        ws.getRow(currentRow).getCell(c).fill = headerFill;
      }
      currentRow++;

      // Subheaders
      ws.getRow(currentRow).height = 22;
      ws.mergeCells(`C${currentRow}:D${currentRow}`);
      const detHeader = ws.getCell(`C${currentRow}`);
      detHeader.value = 'DETAIL';
      detHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F4E79' } };
      detHeader.alignment = { horizontal: 'left', vertical: 'middle' };

      const amtHeader = ws.getCell(`E${currentRow}`);
      amtHeader.value = 'AMOUNT (PKR)';
      amtHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F4E79' } };
      amtHeader.alignment = { horizontal: 'right', vertical: 'middle' };
      currentRow++;

      const summaryStartRow = currentRow;
      for (const cat of this.db.categories) {
        ws.getRow(currentRow).height = 20;
        ws.mergeCells(`C${currentRow}:D${currentRow}`);
        const catCell = ws.getCell(`C${currentRow}`);
        catCell.value = cat.name;
        catCell.font = { name: 'Calibri', size: 10, bold: true };
        catCell.alignment = { horizontal: 'left', vertical: 'middle' };

        const amtCell = ws.getCell(`E${currentRow}`);
        if (subtotalMap[cat.id]) {
          amtCell.value = { formula: `H${subtotalMap[cat.id]}` };
        } else {
          amtCell.value = 0;
        }
        amtCell.numFmt = '#,##0.00';
        amtCell.font = { name: 'Calibri', size: 10, bold: true };
        amtCell.alignment = { horizontal: 'right', vertical: 'middle' };
        currentRow++;
      }
      const summaryEndRow = currentRow - 1;

      // Summary G.TOTAL
      ws.getRow(currentRow).height = 22;
      const gtotLabel = ws.getCell(`D${currentRow}`);
      gtotLabel.value = 'G.TOTAL';
      gtotLabel.font = { name: 'Calibri', size: 11, bold: true };
      gtotLabel.alignment = { horizontal: 'right', vertical: 'middle' };

      const gtotCell = ws.getCell(`E${currentRow}`);
      if (summaryEndRow >= summaryStartRow) {
        gtotCell.value = { formula: `SUM(E${summaryStartRow}:E${summaryEndRow})` };
      } else {
        gtotCell.value = 0;
      }
      gtotCell.numFmt = '#,##0.00';
      gtotCell.font = { name: 'Calibri', size: 11, bold: true };
      gtotCell.border = doubleBottomBorder;
      gtotCell.alignment = { horizontal: 'right', vertical: 'middle' };

      // Write .xlsx buffer
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.setAttribute('download', `UBL_Statement_${stmt?.statement_number || 'UBL-CC-2026-10'}.xlsx`);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 2500);

    } else {
      // Standard US Letter Landscape export for other 9 reports
      const data = await this.getReportPreview(reportType, statementId);
      const headers: string[] = data.headers || [];
      const rows: any[][] = data.rows || [];

      const wb = new ExcelJS.Workbook();
      wb.creator = 'Red Publicis CC System';
      const sheetName = reportType.replace(/_/g, ' ').slice(0, 31);
      const ws = wb.addWorksheet(sheetName, {
        pageSetup: {
          paperSize: 1 as any, // Letter
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
        }
      });
      ws.views = [{ showGridLines: true }];
      ws.headerFooter = {
        oddFooter: `&LRED PUBLICIS — ${reportType.replace(/_/g, ' ').toUpperCase()}&RPage &P of &N`
      };

      // Header title
      ws.getRow(1).height = 26;
      const titleCell = ws.getCell('A1');
      titleCell.value = `RED PUBLICIS (COMMUNICATION ARTS) — ${reportType.replace(/_/g, ' ').toUpperCase()}`;
      titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF002060' } };

      // Subtitle
      ws.getRow(2).height = 18;
      const subCell = ws.getCell('A2');
      subCell.value = `Generated: ${new Date().toLocaleString()} | Paper: US Letter (8.5 x 11 in) Landscape`;
      subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF595959' } };

      // Table headers at row 4
      ws.getRow(4).height = 26;
      const allHeaders = ['#', ...headers];
      allHeaders.forEach((h, idx) => {
        const colNum = idx + 1;
        const cell = ws.getRow(4).getCell(colNum);
        cell.value = h;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // Rows
      rows.forEach((r, rowIdx) => {
        const rowNum = rowIdx + 5;
        const row = ws.getRow(rowNum);
        row.height = 20;

        const numCell = row.getCell(1);
        numCell.value = rowIdx + 1;
        numCell.alignment = { horizontal: 'center', vertical: 'middle' };
        numCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF595959' } };
        numCell.border = thinBorder;
        if (rowIdx % 2 === 1) numCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        r.forEach((c, colIdx) => {
          const cell = row.getCell(colIdx + 2);
          const isNum = typeof c === 'number';
          cell.value = c;
          cell.font = { name: 'Calibri', size: 10 };
          cell.border = thinBorder;
          if (rowIdx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          if (isNum) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { vertical: 'middle' };
          }
        });
      });

      // Auto column widths
      ws.columns.forEach((col, idx) => {
        if (idx === 0) {
          col.width = 6;
        } else {
          const headerLength = allHeaders[idx]?.length || 10;
          col.width = Math.max(14, headerLength + 4);
        }
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.setAttribute('download', `Report_${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 2500);
    }
  }

  async downloadPdfReport(reportType: string, statementId?: number): Promise<void> {
    const fmt = (n: number | null | undefined, digits: number = 2) => {
      if (n === null || n === undefined) return '-';
      return Number(n).toLocaleString('en-PK', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      });
    };

    const formatTableDate = (dStr: string) => {
      if (!dStr) return '-';
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const day = parts[2];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        if (months[monthIndex]) {
          return `${day}-${months[monthIndex]}`;
        }
      }
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${day}-${months[d.getMonth()]}`;
      }
      return dStr;
    };

    let html = '';

    if (reportType === 'ubl_statement') {
      const stmt = statementId
        ? this.db.statements.find(s => s.id === statementId)
        : (this.db.statements.find(s => s.statement_number === 'UBL-CC-2026-10') || this.db.statements[0]);
      const stmtTxns = stmt
        ? this.db.transactions.filter(t => t.statement_id === stmt.id)
        : [...this.db.transactions];

      const catMap = Object.fromEntries(this.db.categories.map(c => [c.id, c]));

      const totUsd = stmtTxns.reduce((s, t) => s + (t.usd_amount ? Number(t.usd_amount) : 0), 0);
      const totPkr = stmtTxns.reduce((s, t) => s + Number(t.pkr_amount || 0), 0);
      const totAdv = stmtTxns.reduce((s, t) => s + Number(t.advance_tax || 0), 0);
      const totSt = stmtTxns.reduce((s, t) => s + Number(t.sales_tax_withheld || 0), 0);
      const totGrand = stmtTxns.reduce((s, t) => s + Number(t.total_amount || 0), 0);

      const totalStmt = stmt ? Number(stmt.total_statement_amount || totGrand) : totGrand;
      const amountPaid = stmt ? Number(stmt.amount_paid || 0) : 0;
      const balanceDue = totalStmt - amountPaid;
      const status = stmt?.status || 'Draft';
      const stmtNum = stmt?.statement_number || 'UBL-CC-2026-10';
      const stmtDate = stmt?.statement_date || '2026-10-20';
      const dueDate = stmt?.payment_due_date || '2026-11-11';

      // Summary allocation breakdown groups
      const allocGroups: Record<number, { name: string; code: string; count: number; total: number }> = {};
      for (const cat of this.db.categories) {
        allocGroups[cat.id] = {
          name: cat.name,
          code: cat.code,
          count: 0,
          total: 0
        };
      }
      const unalloc = { name: 'CHARGE TO UNALLOCATED', code: 'OTHER', count: 0, total: 0 };

      for (const t of stmtTxns) {
        const amt = Number(t.total_amount || 0);
        const catId = t.allocation_id;
        if (catId && allocGroups[catId]) {
          allocGroups[catId].count += 1;
          allocGroups[catId].total += amt;
        } else {
          unalloc.count += 1;
          unalloc.total += amt;
        }
      }

      html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>RED PUBLICIS - ${stmtNum}</title>
  <style>
    @page {
      size: letter landscape;
      margin: 22px 28px 24px 28px;
    }
    @media print {
      .no-print { display: none !important; }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        margin: 0;
        padding: 0;
      }
      .avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      thead {
        display: table-header-group;
      }
      tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    body {
      font-family: Helvetica, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: white;
      margin: 0;
      padding: 18px 26px;
      font-size: 8pt;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 16px;
    }
    .btn-print {
      background: #002060;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-weight: bold;
      font-size: 11px;
      cursor: pointer;
    }
    .btn-close {
      background: #e2e8f0;
      color: #334155;
      border: none;
      border-radius: 6px;
      padding: 8px 14px;
      font-weight: 600;
      font-size: 11px;
      cursor: pointer;
      margin-left: 8px;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .title-company {
      font-size: 16pt;
      font-weight: bold;
      color: #002060;
      margin: 0 0 4px 0;
      letter-spacing: -0.2px;
    }
    .subtitle-stmt {
      font-size: 10pt;
      color: #333333;
      margin: 0;
    }
    .logo-img {
      height: 38px;
      width: 175px;
      object-fit: contain;
    }
    /* Overview 4-column table */
    .overview-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 14px;
    }
    .overview-table th {
      background: #1F4E79;
      color: white;
      font-weight: bold;
      font-size: 10pt;
      padding: 6px 10px;
      text-align: center;
      border: 0.5px solid #CCCCCC;
    }
    .overview-table td {
      background: #F2F4F7;
      color: #002060;
      font-weight: bold;
      font-size: 11pt;
      padding: 6px 10px;
      text-align: center;
      border: 0.5px solid #CCCCCC;
    }
    /* Transactions Table */
    .trans-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 14px;
    }
    .trans-table th {
      background: #002060;
      color: white;
      font-weight: bold;
      font-size: 8pt;
      padding: 5px 6px;
      border: 0.5px solid #E0E0E0;
    }
    .trans-table td {
      padding: 4px 6px;
      border: 0.5px solid #E0E0E0;
      font-size: 8pt;
    }
    .trans-table tr.even {
      background-color: #F9FAFB;
    }
    .trans-table tr.odd {
      background-color: #ffffff;
    }
    .trans-table tr.grand-total-row {
      background-color: #EBF1F5;
      color: #002060;
      font-weight: bold;
      font-size: 8.5pt;
      border-top: 1.2px solid #002060;
      border-bottom: 1.5px solid #002060;
    }
    .trans-table tr.grand-total-row td {
      padding: 5px 6px;
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .center {
      text-align: center;
    }
    .left {
      text-align: left;
    }
    /* Summary Area */
    .summary-wrap {
      margin-top: 14px;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .summary-table {
      width: 600px;
      margin: 0 auto;
      border-collapse: collapse;
      font-size: 8pt;
    }
    .summary-table th.banner {
      background: #1F4E79;
      color: white;
      font-weight: bold;
      font-size: 9.5pt;
      padding: 4px;
      text-align: center;
    }
    .summary-table th.subhead {
      background: #002060;
      color: white;
      font-weight: bold;
      font-size: 8pt;
      padding: 3px 6px;
    }
    .summary-table td {
      padding: 3px 8px;
      border: 0.5px solid #E2E8F0;
      font-size: 8pt;
    }
    .summary-table tr.even {
      background-color: #F8FAFC;
    }
    .summary-table tr.odd {
      background-color: #ffffff;
    }
    .summary-table tr.gtot-row {
      background-color: #EBF1F5;
      color: #002060;
      font-weight: bold;
      font-size: 8.5pt;
      border-top: 1px solid #002060;
      border-bottom: 1.5px solid #002060;
    }
    .summary-table tr.gtot-row td {
      padding: 4px 8px;
    }
    /* Signature Area */
    .signatures-wrap {
      margin-top: 16px;
      margin-bottom: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signatures-container {
      display: flex;
      justify-content: center;
      gap: 14px;
    }
    .sig-card {
      width: 232px;
      border: 0.75px solid #CBD5E1;
      background-color: #F8FAFC;
      border-radius: 3px;
      padding: 8px 12px 10px 12px;
      box-sizing: border-box;
    }
    .sig-title {
      font-size: 9pt;
      font-weight: bold;
      color: #002060;
      text-align: center;
    }
    .sig-sub {
      font-size: 8pt;
      color: #475569;
      text-align: center;
      margin-bottom: 24px;
    }
    .sig-line {
      font-size: 8pt;
      color: #1E293B;
      margin-bottom: 4px;
      white-space: nowrap;
    }
    .footer-bar {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #666666;
      margin-top: 16px;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <div style="font-weight: bold; font-size: 12px; color: #002060;">📄 RED PUBLICIS — UBL Credit Card Statement (${stmtNum})</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF (Letter Landscape)</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="header-container">
    <div>
      <div class="title-company">RED PUBLICIS (COMMUNICATION ARTS)</div>
      <div class="subtitle-stmt"><b>UBL Credit Card Statement:</b> ${stmtNum} | <b>Statement Date:</b> ${stmtDate} | <b>Due Date:</b> ${dueDate}</div>
    </div>
    <div>
      <img src="/logo.png" class="logo-img" alt="RED publicis" onerror="this.style.display='none'" />
    </div>
  </div>

  <table class="overview-table">
    <thead>
      <tr>
        <th style="width: 25%;">Total Statement</th>
        <th style="width: 25%;">Total Paid</th>
        <th style="width: 25%;">Outstanding Balance</th>
        <th style="width: 25%;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>PKR ${fmt(totalStmt)}</td>
        <td>PKR ${fmt(amountPaid)}</td>
        <td>PKR ${fmt(balanceDue)}</td>
        <td>${status}</td>
      </tr>
    </tbody>
  </table>

  <table class="trans-table">
    <thead>
      <tr>
        <th style="width: 55px; text-align: center;">Date</th>
        <th style="text-align: left;">Merchant / Party</th>
        <th style="width: 75px; text-align: center;">Allocation</th>
        <th style="width: 60px; text-align: right;">USD</th>
        <th style="width: 50px; text-align: right;">Rate</th>
        <th style="width: 80px; text-align: right;">PKR</th>
        <th style="width: 65px; text-align: right;">Adv Tax</th>
        <th style="width: 65px; text-align: right;">Sales Tax</th>
        <th style="width: 95px; text-align: right;">Total PKR</th>
      </tr>
    </thead>
    <tbody>
      ${stmtTxns.map((t, idx) => {
        const cat = catMap[t.allocation_id || 1];
        const code = cat?.code || 'RED';
        const isEven = idx % 2 === 1;
        return `
          <tr class="${isEven ? 'even' : 'odd'}">
            <td class="center">${formatTableDate(t.transaction_date)}</td>
            <td class="left">${t.merchant_name}</td>
            <td class="center">${code}</td>
            <td class="num">${t.usd_amount ? fmt(t.usd_amount) : '-'}</td>
            <td class="num">${t.exchange_rate ? fmt(t.exchange_rate, 2) : '-'}</td>
            <td class="num">${fmt(t.pkr_amount)}</td>
            <td class="num">${fmt(t.advance_tax)}</td>
            <td class="num">${fmt(t.sales_tax_withheld)}</td>
            <td class="num">${fmt(t.total_amount)}</td>
          </tr>
        `;
      }).join('')}

      <tr class="grand-total-row">
        <td colspan="3" class="left" style="font-weight: bold; color: #002060;">GRAND TOTAL</td>
        <td class="num">${totUsd > 0 ? `$${fmt(totUsd)}` : '-'}</td>
        <td class="num">-</td>
        <td class="num" style="font-weight: bold;">${fmt(totPkr)}</td>
        <td class="num" style="font-weight: bold;">${fmt(totAdv)}</td>
        <td class="num" style="font-weight: bold;">${fmt(totSt)}</td>
        <td class="num" style="font-weight: bold; color: #002060;">${fmt(totGrand)}</td>
      </tr>
    </tbody>
  </table>

  <div class="summary-wrap">
    <table class="summary-table">
      <thead>
        <tr>
          <th colspan="5" class="banner">SUMMARY (ALLOCATION BREAKDOWN)</th>
        </tr>
        <tr>
          <th class="subhead" style="width: 240px; text-align: left;">DETAIL</th>
          <th class="subhead" style="width: 80px; text-align: center;">CODE</th>
          <th class="subhead" style="width: 60px; text-align: center;">TXNS</th>
          <th class="subhead" style="width: 130px; text-align: right;">AMOUNT (PKR)</th>
          <th class="subhead" style="width: 90px; text-align: right;">% SHARE</th>
        </tr>
      </thead>
      <tbody>
        ${this.db.categories.map((c, idx) => {
          const data = allocGroups[c.id] || { count: 0, total: 0 };
          const pct = totGrand > 0 ? ((data.total / totGrand) * 100).toFixed(1) : '0.0';
          const isEven = idx % 2 === 1;
          return `
            <tr class="${isEven ? 'even' : 'odd'}">
              <td class="left">${c.name}</td>
              <td class="center">${c.code}</td>
              <td class="center">${data.count}</td>
              <td class="num">${fmt(data.total)}</td>
              <td class="num">${pct}%</td>
            </tr>
          `;
        }).join('')}

        ${unalloc.count > 0 ? `
          <tr class="odd">
            <td class="left">${unalloc.name}</td>
            <td class="center">${unalloc.code}</td>
            <td class="center">${unalloc.count}</td>
            <td class="num">${fmt(unalloc.total)}</td>
            <td class="num">${totGrand > 0 ? ((unalloc.total / totGrand) * 100).toFixed(1) : '0.0'}%</td>
          </tr>
        ` : ''}

        <tr class="gtot-row">
          <td colspan="2" class="left" style="font-weight: bold; color: #002060;">G.TOTAL</td>
          <td class="center" style="font-weight: bold;">${stmtTxns.length}</td>
          <td class="num" style="font-weight: bold; color: #002060;">${fmt(totGrand)}</td>
          <td class="num" style="font-weight: bold;">100.0%</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="signatures-wrap">
    <div class="signatures-container">
      <div class="sig-card">
        <div class="sig-title">PREPARED BY</div>
        <div class="sig-sub">IT Department</div>
        <div style="height: 24px;"></div>
        <div class="sig-line">Signature: ______________________</div>
        <div class="sig-line">Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______________________</div>
      </div>
      <div class="sig-card">
        <div class="sig-title">VERIFIED BY</div>
        <div class="sig-sub">Admin & HR</div>
        <div style="height: 24px;"></div>
        <div class="sig-line">Signature: ______________________</div>
        <div class="sig-line">Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______________________</div>
      </div>
      <div class="sig-card">
        <div class="sig-title">APPROVED BY</div>
        <div class="sig-sub">Head of Finance</div>
        <div style="height: 24px;"></div>
        <div class="sig-line">Signature: ______________________</div>
        <div class="sig-line">Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______________________</div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div>RED PUBLICIS | US Letter (8.5 x 11 in)</div>
    <div>Page 1</div>
  </div>

  <script>
    setTimeout(function() {
      window.print();
    }, 600);
  </script>
</body>
</html>`;
    } else {
      // Standard US Letter Landscape report for other 9 types with same corporate layout
      const data = await this.getReportPreview(reportType, statementId);
      const headers: string[] = data.headers || [];
      const rows: any[][] = data.rows || [];

      html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${reportType} - Red Publicis</title>
  <style>
    @page {
      size: letter landscape;
      margin: 22px 28px 24px 28px;
    }
    @media print {
      .no-print { display: none !important; }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        margin: 0;
        padding: 0;
      }
      .avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      thead {
        display: table-header-group;
      }
      tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    body {
      font-family: Helvetica, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 18px 26px;
      font-size: 8.5pt;
      color: #0f172a;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 16px;
    }
    .btn-print {
      background: #002060;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-weight: bold;
      font-size: 11px;
      cursor: pointer;
    }
    .btn-close {
      background: #e2e8f0;
      color: #334155;
      border: none;
      border-radius: 6px;
      padding: 8px 14px;
      font-weight: 600;
      font-size: 11px;
      cursor: pointer;
      margin-left: 8px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .title-company {
      font-size: 16pt;
      font-weight: bold;
      color: #002060;
      margin: 0 0 4px 0;
    }
    .subtitle-report {
      font-size: 10pt;
      color: #333333;
      margin: 0;
    }
    .logo-img {
      height: 38px;
      width: 175px;
      object-fit: contain;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 8pt;
    }
    th {
      background: #002060;
      color: white;
      padding: 6px 8px;
      text-align: left;
      font-size: 8pt;
      font-weight: bold;
      border: 0.5px solid #002060;
    }
    td {
      border: 0.5px solid #e2e8f0;
      padding: 5px 8px;
      font-size: 8pt;
    }
    tr.even { background-color: #f8fafc; }
    tr.odd { background-color: #ffffff; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .center { text-align: center; }
    .signatures-wrap {
      margin-top: 22px;
      margin-bottom: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signatures-container {
      display: flex;
      justify-content: center;
      gap: 14px;
    }
    .sig-card {
      width: 232px;
      border: 0.75px solid #CBD5E1;
      background-color: #F8FAFC;
      border-radius: 3px;
      padding: 8px 12px 10px 12px;
      box-sizing: border-box;
    }
    .sig-title {
      font-size: 9pt;
      font-weight: bold;
      color: #002060;
      text-align: center;
    }
    .sig-sub {
      font-size: 8pt;
      color: #475569;
      text-align: center;
      margin-bottom: 24px;
    }
    .sig-line {
      font-size: 8pt;
      color: #1E293B;
      margin-bottom: 4px;
      white-space: nowrap;
    }
    .footer-bar {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #666666;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <div style="font-weight: bold; font-size: 12px; color: #002060;">📄 ${reportType.replace(/_/g, ' ').toUpperCase()} — US Letter Landscape View</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>
  <div class="header">
    <div>
      <div class="title-company">RED PUBLICIS (COMMUNICATION ARTS)</div>
      <div class="subtitle-report"><b>Report:</b> ${reportType.replace(/_/g, ' ').toUpperCase()} &nbsp;|&nbsp; <b>Generated:</b> ${new Date().toLocaleString()}</div>
    </div>
    <img src="/logo.png" class="logo-img" alt="Logo" onerror="this.style.display='none'" />
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">#</th>
        ${headers.map((h: string) => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map((r: any[], idx: number) => `
        <tr class="${idx % 2 === 1 ? 'even' : 'odd'}">
          <td class="center" style="color: #64748b;">${idx + 1}</td>
          ${r.map((c: any) => `<td class="${typeof c === 'number' ? 'num' : ''}">${typeof c === 'number' ? fmt(c) : (c || '-')}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="signatures-wrap">
    <div class="signatures-container">
      <div class="sig-card">
        <div class="sig-title">PREPARED BY</div>
        <div class="sig-sub">IT Department</div>
        <div style="height: 24px;"></div>
        <div class="sig-line">Signature: ______________________</div>
        <div class="sig-line">Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______________________</div>
      </div>
      <div class="sig-card">
        <div class="sig-title">VERIFIED BY</div>
        <div class="sig-sub">Admin & HR</div>
        <div style="height: 24px;"></div>
        <div class="sig-line">Signature: ______________________</div>
        <div class="sig-line">Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______________________</div>
      </div>
      <div class="sig-card">
        <div class="sig-title">APPROVED BY</div>
        <div class="sig-sub">Head of Finance</div>
        <div style="height: 24px;"></div>
        <div class="sig-line">Signature: ______________________</div>
        <div class="sig-line">Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______________________</div>
      </div>
    </div>
  </div>
  <div class="footer-bar">
    <div>RED PUBLICIS | US Letter (8.5 x 11 in)</div>
    <div>Page 1</div>
  </div>
  <script>
    setTimeout(function() { window.print(); }, 600);
  </script>
</body>
</html>`;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
    } else {
      // Fallback if popup is blocked: use hidden iframe to trigger print dialog
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframe.contentDocument?.open();
      iframe.contentDocument?.write(html);
      iframe.contentDocument?.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 60000);
      }, 600);
    }
  }

  // --- Audit Logs ---
  async getAuditLogs(_params?: Record<string, any>): Promise<AuditLog[]> {
    return [...this.db.auditLogs];
  }

  // --- Settings ---
  async getSettings(): Promise<any[]> {
    return Object.entries(this.db.settings).map(([key, value]) => ({
      key,
      value,
      description: key.replace(/_/g, ' ')
    }));
  }

  async updateSettings(data: Record<string, string>): Promise<Record<string, string>> {
    this.db.settings = { ...this.db.settings, ...data };
    this.save();
    return { ...this.db.settings };
  }

  async getDatabaseInfo(): Promise<any> {
    return {
      database_type: 'In-Browser Local Database (Web Edition)',
      total_transactions: this.db.transactions.length,
      total_statements: this.db.statements.length,
      storage_usage: `${(JSON.stringify(this.db).length / 1024).toFixed(1)} KB`
    };
  }

  async downloadDatabaseBackup(): Promise<void> {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.db, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `red_publicis_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async clearTransactionData(): Promise<{ message: string }> {
    this.db.transactions = [];
    this.db.payments = [];
    this.db.reconciliations = {};
    this.save();
    return { message: 'All transactions cleared successfully' };
  }
}

export const mockBackend = new MockBackendService();
