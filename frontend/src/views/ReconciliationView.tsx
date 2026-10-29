import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  Banknote,
  CreditCard
} from 'lucide-react';

import { api } from '../services/api';
import { Statement, ReconciliationRecord } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const ReconciliationView: React.FC = () => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);
  const [reconRecord, setReconRecord] = useState<ReconciliationRecord | null>(null);
  const [statementDetail, setStatementDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sign Off Modal
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState<boolean>(false);
  const [signOffNotes, setSignOffNotes] = useState<string>('Reconciliation verified with UBL credit card statement.');

  // Quick Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
    payment_method: 'Online Transfer',
    amount: '',
    notes: ''
  });

  const { hasPermission } = useAuth();
  const canReconcile = hasPermission(['super_admin', 'finance_hof']);

  useEffect(() => {
    loadStatements();
  }, []);

  useEffect(() => {
    if (selectedStatementId) {
      loadStatementReconciliation(selectedStatementId);
    }
  }, [selectedStatementId]);

  const loadStatements = async () => {
    setLoading(true);
    try {
      const data = await api.getStatements();
      setStatements(data);
      if (data.length > 0) {
        setSelectedStatementId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load statements:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatementReconciliation = async (stmtId: number) => {
    try {
      const [recon, detail] = await Promise.all([
        api.getReconciliation(stmtId),
        api.getStatement(stmtId)
      ]);
      setReconRecord(recon);
      setStatementDetail(detail);
    } catch (err) {
      console.error('Failed to load reconciliation record:', err);
    }
  };

  const handleRunReconciliation = async () => {
    if (!selectedStatementId) return;
    try {
      const updated = await api.runReconciliation(selectedStatementId);
      setReconRecord(updated);
      await loadStatementReconciliation(selectedStatementId);
      alert('Reconciliation analysis executed successfully!');
    } catch (err: any) {
      alert(err.message || 'Reconciliation failed');
    }
  };

  const handleSignOff = async () => {
    if (!selectedStatementId) return;
    try {
      await api.signOffReconciliation(selectedStatementId, signOffNotes);
      setIsSignOffModalOpen(false);
      await loadStatementReconciliation(selectedStatementId);
      alert('Statement reconciliation officially signed off and approved!');
    } catch (err: any) {
      alert(err.message || 'Sign-off failed');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatementId) return;
    try {
      await api.recordPayment({
        statement_id: selectedStatementId,
        payment_date: paymentForm.payment_date,
        payment_reference: paymentForm.payment_reference,
        payment_method: paymentForm.payment_method,
        amount: parseFloat(paymentForm.amount),
        notes: paymentForm.notes
      });
      setIsPaymentModalOpen(false);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        payment_reference: '',
        payment_method: 'Online Transfer',
        amount: '',
        notes: ''
      });
      await loadStatementReconciliation(selectedStatementId);
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Statement Reconciliation & Settlement
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit comparison of bank statement totals against internal books, duplicate tracking, and payments
          </p>
        </div>

        {/* Statement Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedStatementId || ''}
            onChange={(e) => setSelectedStatementId(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statements.map(s => (
              <option key={s.id} value={s.id}>
                {s.statement_number} ({s.statement_date})
              </option>
            ))}
          </select>

          {canReconcile && (
            <button
              onClick={handleRunReconciliation}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-blue-600" />
              <span>Run Check</span>
            </button>
          )}
        </div>
      </div>

      {statementDetail && reconRecord && (
        <>
          {/* Status & Summary Hero Card */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${
                  reconRecord.status === 'Reconciled' || reconRecord.status === 'Matched'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                }`}>
                  <FileCheck className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Reconciliation Status: {reconRecord.status}
                    </h3>
                    <Badge status={statementDetail.status} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Statement Ref: <b>{statementDetail.statement_number}</b> &nbsp;|&nbsp;
                    Billing Due Date: <b>{statementDetail.payment_due_date}</b>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>

                {canReconcile && reconRecord.status !== 'Reconciled' && (
                  <button
                    onClick={() => setIsSignOffModalOpen(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve & Sign Off</span>
                  </button>
                )}
              </div>
            </div>

            {/* Reconciliation Comparison Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Bank Statement Total
                </span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                  {formatPKR(reconRecord.bank_total)}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">As per verified UBL bill</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  System Recorded Total
                </span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                  {formatPKR(reconRecord.system_total)}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{statementDetail.transactions?.length || 0} line items</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Reconciliation Difference
                </span>
                <h4 className={`text-xl font-black mt-1 tabular-nums ${
                  Math.abs(reconRecord.difference) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {formatPKR(reconRecord.difference)}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {Math.abs(reconRecord.difference) < 0.01 ? 'Zero variance (Balanced)' : 'Variance detected'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Remaining Outstanding
                </span>
                <h4 className="text-xl font-black text-amber-900 dark:text-amber-100 mt-1 tabular-nums">
                  {formatPKR(statementDetail.outstanding_balance)}
                </h4>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                  Paid: {formatPKR(statementDetail.amount_paid)}
                </p>
              </div>
            </div>
          </div>

          {/* Payments History Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Payments & Partial Settlements Recorded
                </h3>
                <p className="text-[11px] text-slate-500">Direct settlement history against this statement</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
              >
                + Add Payment
              </button>
            </div>

            {(!statementDetail.payments || statementDetail.payments.length === 0) ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No payments recorded yet for this statement.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Payment Date</th>
                      <th className="py-2.5 px-4">Reference #</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4 text-right">Amount (PKR)</th>
                      <th className="py-2.5 px-4">Recorded By</th>
                      <th className="py-2.5 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {statementDetail.payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 text-slate-500">{p.payment_date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">{p.payment_reference}</td>
                        <td className="py-3 px-4">{p.payment_method}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatPKR(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{p.recorded_by}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{p.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Credit Card Payment"
        subtitle="Apply partial or full payment settlement to UBL statement"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              required
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Reference / Cheque # *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. UBL-FT-994827104 or Cheque # 88219"
              value={paymentForm.payment_reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Online Transfer">Online Funds Transfer</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="Direct Debit">Direct Debit</option>
                <option value="Cash Deposit">Cash Deposit at Branch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount Paid (PKR) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-900 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Remarks
            </label>
            <textarea
              rows={2}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              Save Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Sign Off Modal */}
      <Modal
        isOpen={isSignOffModalOpen}
        onClose={() => setIsSignOffModalOpen(false)}
        title="Formally Sign Off Statement Reconciliation"
        subtitle="Finance authorization lock for financial statement period"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            By signing off, this statement is marked as officially reconciled and verified against UBL credit card bank records.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Verification Notes / Approval Memo
            </label>
            <textarea
              rows={3}
              value={signOffNotes}
              onChange={(e) => setSignOffNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsSignOffModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOff}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all"
            >
              Confirm Sign-off
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
