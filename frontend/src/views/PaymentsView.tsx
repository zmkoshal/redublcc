import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  FileCheck,
  Building,
  RefreshCw
} from 'lucide-react';

import { api } from '../services/api';
import { Payment, Statement } from '../types';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    statement_id: 1,
    payment_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
    payment_method: 'Online Transfer',
    amount: '',
    notes: ''
  });

  const { hasPermission } = useAuth();
  const canManage = hasPermission(['super_admin', 'finance_hof']);

  useEffect(() => {
    loadData();
  }, [selectedStatement]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pmts, stmts] = await Promise.all([
        api.getPayments(selectedStatement ? Number(selectedStatement) : undefined),
        api.getStatements()
      ]);
      setPayments(pmts);
      setStatements(stmts);
      if (stmts.length > 0 && !formData.statement_id) {
        setFormData(prev => ({ ...prev, statement_id: stmts[0].id }));
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordPayment({
        statement_id: Number(formData.statement_id),
        payment_date: formData.payment_date,
        payment_reference: formData.payment_reference,
        payment_method: formData.payment_method,
        amount: parseFloat(formData.amount),
        notes: formData.notes
      });
      setIsModalOpen(false);
      setFormData({
        statement_id: statements[0]?.id || 1,
        payment_date: new Date().toISOString().split('T')[0],
        payment_reference: '',
        payment_method: 'Online Transfer',
        amount: '',
        notes: ''
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this payment record? Statement balances will be adjusted.')) {
      try {
        await api.deletePayment(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Delete failed');
      }
    }
  };

  const formatPKR = (val: number) => {
    return `Rs. ${Number(val || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const totalPaidSum = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Payments & Settlements Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit history of all bank settlements, cheque vouchers, and online transfers against UBL statements
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Payment</span>
          </button>
        )}
      </div>

      {/* Filter Bar & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Total Settlements Recorded
            </span>
            <h4 className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5 tabular-nums">
              {formatPKR(totalPaidSum)}
            </h4>
          </div>
          <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Banknote className="w-6 h-6" />
          </div>

        </div>

        <div className="md:col-span-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full max-w-sm">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Statement:</span>
            <select
              value={selectedStatement}
              onChange={(e) => setSelectedStatement(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">All Statements</option>
              {statements.map(s => (
                <option key={s.id} value={s.id}>
                  {s.statement_number} ({s.statement_date})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No payments recorded yet for current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Statement ID</th>
                  <th className="py-3 px-4">Reference / FT #</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right font-extrabold">Amount Paid</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Notes</th>
                  {canManage && <th className="py-3 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500">{p.payment_date}</td>
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                      Statement #{p.statement_id}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {p.payment_reference}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">
                      {formatPKR(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{p.recorded_by}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[200px] truncate">{p.notes || '-'}</td>
                    {canManage && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Bank Payment Settlement"
        subtitle="Post a credit card payment to update outstanding statement balance"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Statement *
            </label>
            <select
              required
              value={formData.statement_id}
              onChange={(e) => setFormData({ ...formData, statement_id: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statements.map(s => (
                <option key={s.id} value={s.id}>
                  {s.statement_number} (Outstanding: {formatPKR(s.outstanding_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              required
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bank Payment Reference / Voucher # *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. UBL-FT-994827104"
              value={formData.payment_reference}
              onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Online Transfer">Online Funds Transfer</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="Direct Debit">Direct Debit</option>
                <option value="Cash Deposit">Cash Deposit at Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount (PKR) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-900 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              Post Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
