import React, { useState } from 'react';
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
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView, isOpen }) => {
  const { user, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    try {
      await api.resetUserPassword(user.id, newPassword);
      setPasswordSuccess('Your password has been changed successfully!');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess(null);
      }, 1300);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

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
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${active
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
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPasswordModalOpen(true);
              setPasswordError(null);
              setPasswordSuccess(null);
              setNewPassword('');
              setConfirmPassword('');
            }}
            className="flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-amber-400 border border-slate-700/60 transition-colors"
            title="Change Your Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Password</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 bg-slate-800/80 hover:bg-slate-800 hover:text-rose-400 border border-slate-700/60 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal for Current User */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Your Password"
        subtitle={`Update sign-in password for @${user?.username}`}
        maxWidth="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              New Password * (Minimum 6 characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Enter new password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Confirm new password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${confirmPassword && confirmPassword !== newPassword
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                }`}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[11px] text-rose-500 mt-1 font-semibold">Passwords do not match</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{passwordLoading ? 'Saving...' : 'Save Password'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </aside>
  );
};
