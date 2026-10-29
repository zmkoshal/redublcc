import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple' | 'slate';
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  trend,
  onClick
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-900/60',
      iconBg: 'bg-blue-600 text-white',
      text: 'text-blue-900 dark:text-blue-100',
      subtext: 'text-blue-600 dark:text-blue-400'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-900/60',
      iconBg: 'bg-emerald-600 text-white',
      text: 'text-emerald-900 dark:text-emerald-100',
      subtext: 'text-emerald-600 dark:text-emerald-400'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-900/60',
      iconBg: 'bg-amber-600 text-white',
      text: 'text-amber-900 dark:text-amber-100',
      subtext: 'text-amber-600 dark:text-amber-400'
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-900/60',
      iconBg: 'bg-rose-600 text-white',
      text: 'text-rose-900 dark:text-rose-100',
      subtext: 'text-rose-600 dark:text-rose-400'
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-900/60',
      iconBg: 'bg-indigo-600 text-white',
      text: 'text-indigo-900 dark:text-indigo-100',
      subtext: 'text-indigo-600 dark:text-indigo-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      border: 'border-purple-200 dark:border-purple-900/60',
      iconBg: 'bg-purple-600 text-white',
      text: 'text-purple-900 dark:text-purple-100',
      subtext: 'text-purple-600 dark:text-purple-400'
    },
    slate: {
      bg: 'bg-slate-50 dark:bg-slate-900/60',
      border: 'border-slate-200 dark:border-slate-800',
      iconBg: 'bg-slate-700 text-white dark:bg-slate-800',
      text: 'text-slate-900 dark:text-slate-100',
      subtext: 'text-slate-600 dark:text-slate-400'
    }
  };

  const scheme = colorMap[variant];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 border ${scheme.border} ${scheme.bg} transition-all duration-200 shadow-sm hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h4 className={`text-2xl font-extrabold mt-1.5 tabular-nums ${scheme.text}`}>
            {value}
          </h4>
          {subtitle && (
            <p className={`text-xs mt-1 font-medium ${scheme.subtext}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded bg-white/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {trend}
            </span>
          )}
        </div>
        <div className={`p-3 rounded-xl shadow-sm ${scheme.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
