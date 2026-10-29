import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  PieChart,
  Percent,
  CheckCircle2,
  Banknote,
  FileSpreadsheet,
  Users,
  Settings,
  History,
  Building2,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView, isOpen }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'statements', label: 'Credit Card Statements', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'allocations', label: 'Expense Allocations', icon: PieChart },
    { id: 'taxes', label: 'Tax Management', icon: Percent },
    { id: 'reconciliation', label: 'Reconciliation', icon: CheckCircle2 },
    { id: 'payments', label: 'Payments', icon: Banknote },
    { id: 'reports', label: 'Financial Reports', icon: FileSpreadsheet },
    { id: 'users', label: 'User Management', icon: ShieldCheck },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: History, roles: ['super_admin', 'finance_hof'] },
  ];

  const filteredNav = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex flex-col space-y-2">
        <div className="py-1 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Red Publicis"
            className="h-9 w-auto object-contain max-w-full drop-shadow-[0_1px_6px_rgba(255,255,255,0.18)]"
          />

        </div>
        <div className="px-1 text-center">
          <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
            Expense & Statement Portal
          </p>
        </div>
      </div>

      {/* Corporate Bank Sub-badge */}
      <div className="mx-4 mt-3 mb-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-200">UBL Corporate Portal</span>
        </div>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
          *9821
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {filteredNav.map(item => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Role Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs uppercase">
            {user?.full_name?.substring(0, 2) || 'AD'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Admin User'}</p>
            <div className="flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide truncate">
                {user?.role?.replace('_', ' ') || 'Super Admin'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
