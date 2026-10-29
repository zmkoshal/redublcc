import React, { useState, useEffect } from 'react';
import {
  Plus,
  CreditCard,
  Calendar,
  FileText,
  ArrowRight,
  Download,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { Statement, StatementStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

interface StatementsViewProps {
  onSelectStatementDetail: (statementId: number) => void;
}

export const StatementsView: React.FC<StatementsViewProps> = ({ onSelectStatementDetail }) => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    statement_number: '',
    statement_date: new Date().toISOString().split('T')[0],
    payment_due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_start_date: '',
    period_end_date: '',
    opening_balance: 0,
    status: 'Draft' as StatementStatus,
    notes: ''
  });

  const { hasPermission } = useAuth();
  const canEdit = hasPermission(['super_admin', 'finance_hof', 'it_entry']);
  const canDelete = hasPermission(['super_admin']);

  useEffect(() => {
    loadStatements();
  }, []);

  const loadStatements = async () => {
    setLoading(true);
    try {
      const data = await api.getStatements();
      setStatements(data);
    } catch (err) {
      console.error('Failed to load statements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStatement(formData);
      setIsCreateModalOpen(false);
      loadStatements();
    } catch (err: any) {
      alert(err.message || 'Error creating statement');
    }
  };

  const handleDelete = async (id: number, number: string) => {
    if (confirm(`Are you sure you want to delete statement ${number}? This will remove all associated transactions.`)) {
      try {
        await api.deleteStatement(id);
        loadStatements();
      } catch (err: any) {
        alert(err.message || 'Error deleting statement');
      }
    }
  };

  const formatPKR = (val: number) => {
    return `Rs. ${Number(val || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Credit Card Statements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage UBL corporate credit card billing periods and statement payments
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Statement</span>
          </button>
        )}
      </div>

      {/* Statements Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Loading statements...</p>
          </div>
        ) : statements.length === 0 ? (
          <div className="py-20 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Statements Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Create your first statement or import transactions from the Excel workbook.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Statement #</th>
                  <th className="py-3.5 px-4">Bank / Card</th>
                  <th className="py-3.5 px-4">Statement Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Outstanding</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {statements.map(stmt => (
                  <tr
                    key={stmt.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                      <button
                        onClick={() => onSelectStatementDetail(stmt.id)}
                        className="hover:underline flex items-center space-x-1"
                      >
                        <span>{stmt.statement_number}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">UBL</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                          *9821
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {stmt.statement_date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {stmt.payment_due_date}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatPKR(stmt.total_statement_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatPKR(stmt.amount_paid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold tabular-nums text-amber-600 dark:text-amber-400">
                      {formatPKR(stmt.outstanding_balance)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={stmt.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onSelectStatementDetail(stmt.id)}
                          title="View Statement & Subtotals"
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center space-x-1"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => api.downloadExcelReport('ubl_statement', stmt.id)}
                          title="Download Statement Excel"
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {canDelete && stmt.status !== 'Approved' && (
                          <button
                            onClick={() => handleDelete(stmt.id, stmt.statement_number)}
                            title="Delete Statement"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Statement Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Credit Card Statement"
        subtitle="Establish billing cycle dates and parameters for UBL corporate card"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Statement Reference / Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. UBL-CC-2026-10"
              value={formData.statement_number}
              onChange={(e) => setFormData({ ...formData, statement_number: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Statement Date *
              </label>
              <input
                type="date"
                required
                value={formData.statement_date}
                onChange={(e) => setFormData({ ...formData, statement_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.payment_due_date}
                onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Period Start Date
              </label>
              <input
                type="date"
                value={formData.period_start_date}
                onChange={(e) => setFormData({ ...formData, period_start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Period End Date
              </label>
              <input
                type="date"
                value={formData.period_end_date}
                onChange={(e) => setFormData({ ...formData, period_end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Opening Balance (PKR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.opening_balance}
              onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Description
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Monthly cloud computing & marketing expenses"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Create Statement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
