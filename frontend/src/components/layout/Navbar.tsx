import React from 'react';
import { Menu, Sun, Moon, Shield, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface NavbarProps {
  currentViewTitle: string;
  onToggleSidebar: () => void;
  statements?: any[];
  selectedStatementId?: number | null;
  onSelectStatement?: (id: number | null) => void;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentViewTitle,
  onToggleSidebar,
  statements = [],
  selectedStatementId,
  onSelectStatement,
  onRefresh
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, switchRole } = useAuth();

  const roles: { role: UserRole; label: string }[] = [
    { role: 'super_admin', label: 'Super Admin' },
    { role: 'finance_hof', label: 'Finance / HOF' },
    { role: 'it_entry', label: 'IT / Data Entry' },
    { role: 'management_readonly', label: 'Management (Read-Only)' }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between transition-colors duration-200">
      {/* Left: Mobile Toggle & View Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currentViewTitle}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            Red Publicis Financial Statement & Expense Control
          </p>

        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Statement Filter Selector */}
        {statements.length > 0 && onSelectStatement && (
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl px-2.5 py-1 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Statement:</span>
            <select
              value={selectedStatementId || ''}
              onChange={(e) => onSelectStatement(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Statements</option>
              {statements.map(s => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">
                  {s.statement_number} ({s.statement_date})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Role Switcher for paired testing */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl px-2.5 py-1">
          <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">Role:</span>
          <select
            value={user?.role || 'super_admin'}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="bg-transparent text-xs font-bold text-blue-800 dark:text-blue-200 focus:outline-none cursor-pointer"
          >
            {roles.map(r => (
              <option key={r.role} value={r.role} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Light/Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Dark/Light Mode"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
        </button>
      </div>
    </header>
  );
};
