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
  ShieldAlert,
  PieChart as PieChartIcon,
  Globe,
  Receipt,
  Sparkles,
  Percent,
  Building2
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
  CartesianGrid
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  selectedStatementId?: number | null;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#4F46E5', '#64748B'];

const ALLOC_COLORS: Record<string, string> = {
  'RED': '#3B82F6',
  'KKOP': '#10B981',
  'PFDC': '#F59E0B',
  'SYED_HAMMAD': '#8B5CF6',
  'OTHER_COMPANIES': '#06B6D4',
  'OTHER_INDIVIDUALS': '#EC4899',
  'OTHER': '#64748B'
};

const CustomDonutTooltip = ({ active, payload, formatter, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const val = Number(data.value || 0);
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
    const color = data.payload?.fill || data.color || '#3B82F6';
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <p className="font-semibold text-slate-200">{data.name}</p>
        </div>
        <p className="font-bold text-white text-sm">
          {formatter ? formatter(val) : `Rs. ${val.toLocaleString('en-PK')}`}
        </p>
        <p className="text-[11px] text-slate-400">
          Share: <span className="font-bold text-emerald-400">{pct}%</span> of total
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const val = Number(data.value || 0);
    const title = label || data.payload?.merchant || data.payload?.name || data.name;
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs space-y-1">
        <p className="font-semibold text-slate-300">{title}</p>
        <p className="font-bold text-white text-sm">
          {formatter ? formatter(val) : `Rs. ${val.toLocaleString('en-PK')}`}
        </p>
      </div>
    );
  }
  return null;
};

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
  const totalAllocated = charts.by_allocation.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalFxPkr = charts.fx_vs_pkr.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalTaxAmount = charts.tax_breakdown.reduce((sum, item) => sum + (item.value || 0), 0);

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
              onClick={() => onNavigate('allocations')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold shadow-md transition-all duration-150"
            >
              <PieChartIcon className="w-4 h-4" />
              <span>Expense Allocations</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
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
        <div className="rounded-2xl p-6 bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800/90 shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 opacity-80" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Expenses by Company & Allocation
                </h3>
                <p className="text-xs text-slate-400">
                  Distribution across RED, KKOP, PFDC and Personal accounts
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('allocations')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 hover:text-white transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <span>Expense Allocations</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Donut Chart */}
            <div className="md:col-span-6 h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.by_allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={3}
                    cornerRadius={4}
                    dataKey="value"
                  >
                    {charts.by_allocation.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ALLOC_COLORS[entry.code] || COLORS[index % COLORS.length]}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomDonutTooltip formatter={formatPKR} total={totalAllocated} />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Statistic Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-xs font-extrabold text-white">{formatPKR(totalAllocated)}</span>
              </div>
            </div>

            {/* Elegant Legend Pills */}
            <div className="md:col-span-6 space-y-2 pr-1 max-h-56 overflow-y-auto">
              {charts.by_allocation.map((item, idx) => {
                const pct = totalAllocated > 0 ? ((item.value / totalAllocated) * 100).toFixed(0) : '0';
                const color = ALLOC_COLORS[item.code] || COLORS[idx % COLORS.length];
                const cleanName = item.name.replace('CHARGE TO ', '');
                return (
                  <div
                    key={item.code || idx}
                    onClick={() => onNavigate('allocations')}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer group/item text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                      <span className="font-semibold text-slate-200 truncate">{cleanName}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 pl-2">
                      <span className="font-mono text-slate-300 font-medium">{formatPKR(item.value)}</span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: `${color}20`, color }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Top Merchants Spending */}
        <div className="rounded-2xl p-6 bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800/90 shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 opacity-80" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Top Merchants & Subscriptions
                </h3>
                <p className="text-xs text-slate-400">
                  Highest expense vendors (GoDaddy, Google Workspace, OpenAI, etc.)
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Top 8</span>
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.by_merchant} layout="vertical" margin={{ left: 10, right: 30, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="vendorBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `Rs. ${(v / 1000).toFixed(0)}k`}
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <YAxis
                  dataKey="merchant"
                  type="category"
                  width={125}
                  tick={{ fontSize: 11, fill: '#CBD5E1', fontWeight: 500 }}
                  stroke="#64748B"
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip formatter={formatPKR} />} />
                <Bar
                  dataKey="amount"
                  fill="url(#vendorBarGrad)"
                  radius={[0, 6, 6, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Tax & Bank Charges Breakdown */}
        <div className="rounded-2xl p-6 bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800/90 shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-400 opacity-80" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Taxes & Statutory Fees Breakdown
                </h3>
                <p className="text-xs text-slate-400">
                  Advance Tax, Provincial ST, FED, and UBL Bank Charges
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
              Total: {formatPKR(totalTaxAmount)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.tax_breakdown} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                <defs>
                  <linearGradient id="taxBarGrad0" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="taxBarGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2DD4BF" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="taxBarGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBBF24" stopOpacity={1} />
                    <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="taxBarGrad3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C084FC" stopOpacity={1} />
                    <stop offset="100%" stopColor="#9333EA" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  tick={{ fontSize: 10, fill: '#CBD5E1', fontWeight: 500 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <YAxis
                  tickFormatter={(v) => `Rs. ${(v / 1000).toFixed(0)}k`}
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomBarTooltip formatter={formatPKR} />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={34}>
                  {charts.tax_breakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#taxBarGrad${index % 4})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Foreign Currency (USD) vs PKR */}
        <div className="rounded-2xl p-6 bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800/90 shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-80" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Foreign Currency (USD) vs Direct PKR
                </h3>
                <p className="text-xs text-slate-400">
                  Analysis of international cloud tools vs local transactions
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              Currency Mix
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Donut Chart */}
            <div className="md:col-span-6 h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.fx_vs_pkr}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={4}
                    cornerRadius={4}
                    dataKey="amount"
                    nameKey="type"
                  >
                    <Cell fill="#06B6D4" stroke="#0f172a" strokeWidth={2} />
                    <Cell fill="#3B82F6" stroke="#0f172a" strokeWidth={2} />
                  </Pie>
                  <Tooltip content={<CustomDonutTooltip formatter={formatPKR} total={totalFxPkr} />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Hole Currency Icon */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Globe className="w-5 h-5 text-cyan-400 mb-0.5" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">FX Mix</span>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="md:col-span-6 space-y-2.5 pr-1">
              {charts.fx_vs_pkr.map((item, idx) => {
                const pct = totalFxPkr > 0 ? ((item.amount / totalFxPkr) * 100).toFixed(0) : '0';
                const isUsd = item.type.toLowerCase().includes('usd') || item.type.toLowerCase().includes('foreign');
                const color = isUsd ? '#06B6D4' : '#3B82F6';
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                        <span className="font-bold text-slate-200">
                          {isUsd ? 'USD International Spend' : 'Direct PKR Domestic'}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: `${color}20`, color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[11px] text-slate-400">Total volume</span>
                      <span className="font-mono text-white font-bold">{formatPKR(item.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
