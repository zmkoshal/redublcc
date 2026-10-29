export type UserRole = 'super_admin' | 'finance_hof' | 'it_entry' | 'management_readonly';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface CreditCard {
  id: number;
  bank_name: string;
  card_holder_name: string;
  card_number_last4: string;
  card_type: string;
  currency: string;
  is_active: boolean;
}

export type StatementStatus = 'Draft' | 'Under Review' | 'Approved' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface Statement {
  id: number;
  card_id: number;
  credit_card?: CreditCard;
  statement_number: string;
  statement_date: string;
  payment_due_date: string;
  period_start_date?: string;
  period_end_date?: string;
  opening_balance: number;
  total_statement_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  status: StatementStatus;
  notes?: string;
  attachment_path?: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  transaction_count?: number;
}

export interface AllocationCategory {
  id: number;
  code: string;
  name: string;
  entity_type: 'Company' | 'Individual' | 'Client' | 'Other';
  description?: string;
  is_active: boolean;
  display_order: number;
}

export interface Transaction {
  id: number;
  statement_id: number;
  transaction_date: string;
  merchant_name: string;
  description?: string;
  allocation_id?: number;
  allocation?: AllocationCategory;
  usd_amount?: number;
  exchange_rate?: number;
  pkr_amount: number;
  advance_tax: number;
  sales_tax_withheld: number;
  additional_sales_tax: number;
  fed_amount: number;
  bank_charges: number;
  other_taxes: number;
  total_amount: number;
  receipt_path?: string;
  notes?: string;
  created_by: string;
  created_by_id?: number;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  created_at?: string;
  updated_at?: string;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id?: number;
  allocation_id: number;
  allocated_pkr: number;
  percentage?: number;
  notes?: string;
}

export interface TaxRule {
  id: number;
  rule_name: string;
  tax_type: string;
  calc_type: string;
  default_rate: number;
  is_active: boolean;
  rounding_method: string;
  description?: string;
}

export interface Payment {
  id: number;
  statement_id: number;
  payment_date: string;
  payment_reference: string;
  payment_method: string;
  amount: number;
  notes?: string;
  receipt_path?: string;
  recorded_by: string;
  created_at: string;
}

export interface ReconciliationRecord {
  id: number;
  statement_id: number;
  status: 'Unreconciled' | 'Matched' | 'Discrepancy' | 'Reconciled';
  bank_total: number;
  system_total: number;
  difference: number;
  matched_count: number;
  missing_count: number;
  discrepancy_count: number;
  details?: any[];
  notes?: string;
  reconciled_by?: string;
  reconciled_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  notes?: string;
  ip_address?: string;
  timestamp: string;
}

export interface DashboardStats {
  kpis: {
    total_statement_amount: number;
    total_transaction_amount: number;
    total_advance_tax: number;
    total_sales_tax_withheld: number;
    total_bank_charges: number;
    total_red: number;
    total_kkop: number;
    total_pfdc: number;
    total_individual: number;
    total_paid: number;
    remaining_balance: number;
  };
  charts: {
    by_allocation: { name: string; value: number; code: string }[];
    by_merchant: { merchant: string; amount: number }[];
    tax_breakdown: { name: string; value: number }[];
    fx_vs_pkr: { type: string; amount: number }[];
    paid_vs_unpaid: { status: string; amount: number }[];
    monthly_trend: { month: string; total: number; paid: number; outstanding: number }[];
  };
}
