import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Shield,
  RefreshCw,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { Modal } from '../components/common/Modal';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterEntity]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (filterAction) params.action = filterAction;
      if (filterEntity) params.entity_type = filterEntity;
      const data = await api.getAuditLogs(params);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (act: string) => {
    switch (act) {
      case 'CREATE':
      case 'EXCEL_IMPORT':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'UPDATE':
      case 'STATUS_CHANGE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
      case 'RECONCILIATION_SIGN_OFF':
      case 'RECONCILE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Security & Financial Audit Trail
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable log of all financial modifications, user authorizations, sign-offs, and deleted/updated values
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
        <div className="min-w-[160px]">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="PAYMENT">PAYMENT</option>
            <option value="RECONCILE">RECONCILE</option>
            <option value="RECONCILIATION_SIGN_OFF">RECONCILIATION_SIGN_OFF</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="EXCEL_IMPORT">EXCEL_IMPORT</option>
          </select>
        </div>

        <div className="min-w-[160px]">
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">All Entities</option>
            <option value="Statement">Statement</option>
            <option value="Transaction">Transaction</option>
            <option value="Payment">Payment</option>
            <option value="AllocationCategory">AllocationCategory</option>
            <option value="TaxRule">TaxRule</option>
            <option value="User">User</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Fetching audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No audit records found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details / Notes</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-center">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {log.user_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[280px] truncate">
                      {log.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(log.old_values || log.new_values) ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-xs font-bold transition-all"
                        >
                          View Diff
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diff Inspector Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Record Value Diff"
        subtitle={`Action: ${selectedLog?.action} on ${selectedLog?.entity_type} #${selectedLog?.entity_id}`}
        maxWidth="3xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <b>Recorded By:</b> {selectedLog.user_name} &nbsp;|&nbsp;
              <b>Timestamp:</b> {selectedLog.timestamp} &nbsp;|&nbsp;
              <b>IP:</b> {selectedLog.ip_address}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-bold text-rose-600 mb-1">Previous Values (Before Change)</h5>
                <pre className="p-3 rounded-xl bg-slate-950 text-rose-300 font-mono text-[11px] max-h-72 overflow-auto border border-rose-900/40">
                  {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : '(None - New Record)'}
                </pre>
              </div>

              <div>
                <h5 className="text-xs font-bold text-emerald-600 mb-1">Updated Values (After Change)</h5>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[11px] max-h-72 overflow-auto border border-emerald-900/40">
                  {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : '(Deleted)'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
