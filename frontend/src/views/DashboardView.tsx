import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  TrendingDown,
  Building,
  UserCheck,
  CheckCircle,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  selectedStatementId?: number | null;
}

const COLORS = ['#2563EB', '#0D9488', '#D97706', '#9333EA', '#DC2626', '#4F46E5', '#059669', '#E11D48'];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, selectedStatementId }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStats();
  }, [selectedStatementId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats(selectedStatementId || undefined);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPKR = (val: number) => {
    return `Rs. ${Number(val || 0).toLocaleString('en-PK', {
      maximumFractionDigits: 0
    })}`;
  };

  if (loading || !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Financial Analytics...</p>
        </div>
      </div>
    );
  }

  const { kpis, charts } = stats;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 mb-2">
              Corporate Expense Control System
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Red Publicis Credit Card Financial Overview
            </h2>

            <p className="text-xs md:text-sm text-blue-200/90 mt-1 max-w-2xl font-normal">
              Reconciled statements, automated tax withholding (FBR Sec 236Y), multi-entity charge allocations for RED, KKOP, PFDC, and Executive accounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('transactions')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all duration-150"
            >
              <span>+ Add Transaction</span>
            </button>
            <button
              onClick={() => onNavigate('statements')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition-all duration-150"
            >
              <span>View Statements</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Section 8 Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Statement Amount"
          value={formatPKR(kpis.total_statement_amount)}
          subtitle="Net billing cycle obligation"
          icon={CreditCard}
          variant="blue"
          onClick={() => onNavigate('statements')}
        />
        <StatCard
          title="Total Amount Paid"
          value={formatPKR(kpis.total_paid)}
          subtitle="Settled against statements"
          icon={CheckCircle}
          variant="emerald"
          onClick={() => onNavigate('payments')}
        />
        <StatCard
          title="Remaining Payable Balance"
          value={formatPKR(kpis.remaining_balance)}
          subtitle="Current outstanding balance"
          icon={TrendingDown}
          variant={kpis.remaining_balance > 0 ? "amber" : "emerald"}
          onClick={() => onNavigate('reconciliation')}
        />
        <StatCard
          title="Advance Tax Withheld (FBR)"
          value={formatPKR(kpis.total_advance_tax)}
          subtitle="Sec 236Y Foreign spend tax"
          icon={ShieldAlert}
          variant="purple"
          onClick={() => onNavigate('taxes')}
        />
      </div>

      {/* Allocation KPI Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Charge to RED"
          value={formatPKR(kpis.total_red)}
          subtitle="RED.com.pk cloud & software"
          icon={Building}
          variant="indigo"
          onClick={() => onNavigate('allocations')}
        />
        <StatCard
          title="Charge to KKOP / KOOP"
          value={formatPKR(kpis.total_kkop)}
          subtitle="Kallar Kahar operations"
          icon={Building}
          variant="amber"
          onClick={() => onNavigate('allocations')}
        />
        <StatCard
          title="Charge to PFDC"
          value={formatPKR(kpis.total_pfdc)}
          subtitle="Assigned client services"
          icon={Layers}
          variant="emerald"
          onClick={() => onNavigate('allocations')}
        />
        <StatCard
          title="Individual / Director"
          value={formatPKR(kpis.total_individual)}
          subtitle="Syed Hammad Hasan & staff"
          icon={UserCheck}
          variant="slate"
          onClick={() => onNavigate('allocations')}
        />
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Expenses by Entity / Allocation */}
        <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Expenses by Company & Allocation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribution across RED, KKOP, PFDC and Personal accounts
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Interactive
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.by_allocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {charts.by_allocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatPKR(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Merchants Spending */}
        <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Top Merchants & Subscriptions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highest expense vendors (GoDaddy, Google Workspace, OpenAI, etc.)
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Top 8
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.by_merchant} layout="vertical" margin={{ left: 30, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tickFormatter={(v) => `Rs. ${(v/1000).toFixed(0)}k`} />
                <YAxis dataKey="merchant" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => formatPKR(Number(value))} />
                <Bar dataKey="amount" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Tax & Bank Charges Breakdown */}
        <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Taxes & Statutory Fees Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Advance Tax, Provincial ST, FED, and UBL Bank Charges
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.tax_breakdown}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `Rs. ${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatPKR(Number(value))} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Foreign Currency (USD) vs PKR */}
        <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Foreign Currency (USD) vs Direct PKR
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Analysis of international cloud tools vs local transactions
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.fx_vs_pkr}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="amount"
                  nameKey="type"
                  label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                >
                  <Cell fill="#0D9488" />
                  <Cell fill="#3B82F6" />
                </Pie>
                <Tooltip formatter={(value: any) => formatPKR(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
