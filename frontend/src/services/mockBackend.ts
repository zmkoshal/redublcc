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
}

const STORAGE_KEY = 'red_publicis_local_db_v1';

function getInitialData(): MockDatabase {
  const users: User[] = [
    { id: 1, username: 'superadmin', email: 'admin@red.com.pk', full_name: 'System Administrator', role: 'super_admin', is_active: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 2, username: 'finance', email: 'finance@red.com.pk', full_name: 'Head of Finance', role: 'finance_hof', is_active: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 3, username: 'itadmin', email: 'it@red.com.pk', full_name: 'IT Operations Specialist', role: 'it_entry', is_active: true, created_at: '2026-09-01T00:00:00Z' },
    { id: 4, username: 'manager', email: 'management@red.com.pk', full_name: 'Executive Management', role: 'management_readonly', is_active: true, created_at: '2026-09-01T00:00:00Z' }
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

  const transactions: Transaction[] = rawTx.map((t, idx) => ({
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

  const statements: Statement[] = [
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
      notes: 'Statement cycle ending 20-Sep-2026 (Migrated from original Excel sheet).',
      created_by: 'System Administrator',
      created_at: '2026-09-20T10:00:00Z',
      updated_at: '2026-09-20T10:00:00Z',
      transaction_count: transactions.length
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
    settings
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
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  // --- Auth ---
  async login(username: string, _pass: string): Promise<{ token: string; user: User }> {
    const u = this.db.users.find(x => x.username.toLowerCase() === username.toLowerCase() || x.email.toLowerCase() === username.toLowerCase());
    const user = u || this.db.users[0]; // fallback to superadmin
    const token = `mock-token-${user.id}-${Date.now()}`;
    return { token, user };
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

  async createUser(data: Partial<User>): Promise<User> {
    const id = Math.max(0, ...this.db.users.map(u => u.id)) + 1;
    const newUser: User = {
      id,
      username: data.username || `user_${id}`,
      email: data.email || `user_${id}@red.com.pk`,
      full_name: data.full_name || 'New Staff Member',
      role: data.role || 'it_entry',
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.db.users.push(newUser);
    this.save();
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const idx = this.db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.db.users[idx] = { ...this.db.users[idx], ...data };
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

  async resetUserPassword(_id: number, _pwd: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Password updated successfully' };
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
      { id: 'master_statement', name: 'Master Credit Card Statement Report', description: 'Replicates official corporate workbook with subtotals and formulas.' },
      { id: 'entity_allocations', name: 'Entity Allocation Breakdown', description: 'Expenses grouped by RED, KKOP, PFDC, and Individuals.' },
      { id: 'fbr_tax_certificate', name: 'FBR S.236Y Withholding Summary', description: 'Withholding income and sales tax certificate breakdown.' }
    ];
  }

  async getReportPreview(reportType: string, statementId?: number): Promise<any> {
    const stats = await this.getDashboardStats(statementId);
    return {
      reportType,
      statement: await this.getStatement(statementId || 1),
      summary: stats.kpis,
      rows: this.db.transactions.slice(0, 10)
    };
  }

  async downloadExcelReport(_reportType: string, _statementId?: number): Promise<void> {
    // Generate CSV export that opens directly in Excel!
    const headers = ['Date', 'Merchant', 'Description', 'Allocation', 'USD', 'Rate', 'PKR', 'Adv Tax', 'Sales Tax', 'Total PKR'];
    const rows = this.db.transactions.map(t => [
      t.transaction_date,
      `"${t.merchant_name.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.allocation?.name || '',
      t.usd_amount || '',
      t.exchange_rate || '',
      t.pkr_amount,
      t.advance_tax,
      t.sales_tax_withheld,
      t.total_amount
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit_card_statement_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async downloadPdfReport(_reportType: string, _statementId?: number): Promise<void> {
    window.print();
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
