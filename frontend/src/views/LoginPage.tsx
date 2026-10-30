import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  Percent,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>(() => localStorage.getItem('red_remember_username') || '');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(() => !!localStorage.getItem('red_remember_username'));
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await login(username, password);
      if (rememberMe) {
        localStorage.setItem('red_remember_username', username);
      } else {
        localStorage.removeItem('red_remember_username');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 font-sans">
      {/* ============================================================ */}
      {/* LEFT SIDE: Red Publicis Logo & Corporate Brand Showcase       */}
      {/* ============================================================ */}
      <div className="lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Ambient Decorative Lighting */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag */}
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Corporate Financial Portal</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-emerald-400 font-mono">UBL *9821</span>
          </div>
        </div>

        {/* Center: Prominent Red Publicis Logo & Value Proposition */}
        <div className="relative z-10 my-10 lg:my-auto space-y-8 max-w-xl">
          {/* Logo Showcase (Transparent - No white background) */}
          <div className="inline-block transition-transform duration-300 hover:scale-[1.02]">
            <img
              src="/logo.png"
              alt="Red Publicis Logo"
              className="h-16 sm:h-20 w-auto object-contain max-w-full drop-shadow-[0_2px_12px_rgba(255,255,255,0.18)]"
            />
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Credit Card Statement &amp; Expense Management System
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              Automated multi-entity expense allocation, real-time foreign currency conversions, statutory withholding tax calculation, and bank statement payment reconciliation.
            </p>
          </div>

          {/* Key Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 backdrop-blur-sm flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">UBL Corporate Bill</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated statement reconciliation &amp; settlements</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 backdrop-blur-sm flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">FBR Section 236Y</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Advance tax withholding &amp; sales tax automation</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 backdrop-blur-sm flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Entity Allocations</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Charge to Corporate, Client &amp; Individual Accounts</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 backdrop-blur-sm flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Audit Reports</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Formatted openpyxl Excel &amp; ReportLab PDF</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500">
          &copy; 2026 Red Publicis. All rights reserved.
        </div>

      </div>

      {/* ============================================================ */}
      {/* RIGHT SIDE: Elevated Login Card                              */}
      {/* ============================================================ */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-950">
        <div className="w-full max-w-md space-y-6">
          {/* Card Wrapper */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-black/60 backdrop-blur-xl">
            {/* Card Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Account Sign In
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your authorized credentials to access the credit card management portal.
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-400 animate-in fade-in-50">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username or Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Username / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Username or user@red.com.pk"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-800/80 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-700 bg-slate-800/80 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Password Recovery & Security"
        subtitle="Red Publicis Corporate Access Protocol"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <p className="font-bold text-blue-900 dark:text-blue-200 mb-1">Corporate Security Notice</p>
            In accordance with Red Publicis financial governance policies, password changes must be authorized by an active System Administrator or the Head of Finance.
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <p>To request an account reset, please contact:</p>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">
              <b>IT Security Desk:</b> admin@red.com.pk<br />
              <b>Finance Dept:</b> finance@red.com.pk
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
