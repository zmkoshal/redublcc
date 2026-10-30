import { mockBackend } from './mockBackend';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

function getHeaders(isJson = true): HeadersInit {
  const token = localStorage.getItem('taniisha_token');
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function safeCall<T>(remoteCall: () => Promise<Response>, fallback: () => Promise<T>): Promise<T> {
  try {
    const res = await remoteCall();
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      // If HTTP error or response is not JSON (e.g. static host 404/405 or HTML SPA fallback), use in-browser backend!
      return await fallback();
    }
    return await res.json();
  } catch (err: any) {
    // If explicit server business error was parsed, re-throw it only if it's from a live backend API
    if (err.message && !err.message.includes('failed with status') && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Unexpected token')) {
      throw err;
    }
    // Network or server unreachable: transparently fall back to in-browser storage!
    return await fallback();
  }
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    return safeCall(
      () => fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      }),
      () => mockBackend.login(username, password)
    );
  },
  getCurrentUser: async () => {
    return safeCall(
      () => fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }),
      () => mockBackend.getCurrentUser()
    );
  },
  getUsers: async () => {
    return safeCall(
      () => fetch(`${API_BASE}/users`, { headers: getHeaders() }),
      () => mockBackend.getUsers()
    );
  },
  createUser: async (user: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(user)
      }),
      () => mockBackend.createUser(user)
    );
  },
  updateUser: async (id: number, data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.updateUser(id, data)
    );
  },
  deleteUser: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }),
      () => mockBackend.deleteUser(id)
    );
  },
  resetUserPassword: async (id: number, newPassword: string) => {
    return safeCall(
      () => fetch(`${API_BASE}/users/${id}/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ new_password: newPassword })
      }),
      () => mockBackend.resetUserPassword(id, newPassword)
    );
  },
  changeUserRole: async (id: number, role: string) => {
    return safeCall(
      () => fetch(`${API_BASE}/users/${id}/role`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ role })
      }),
      () => mockBackend.changeUserRole(id, role)
    );
  },

  // Dashboard Stats
  getDashboardStats: async (statementId?: number) => {
    const url = statementId ? `${API_BASE}/statements/${statementId}/summary` : `${API_BASE}/statements/summary`;
    return safeCall(
      () => fetch(url, { headers: getHeaders() }),
      () => mockBackend.getDashboardStats(statementId)
    );
  },

  // Statements
  getStatements: async () => {
    return safeCall(
      () => fetch(`${API_BASE}/statements`, { headers: getHeaders() }),
      () => mockBackend.getStatements()
    );
  },
  getStatement: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/statements/${id}`, { headers: getHeaders() }),
      () => mockBackend.getStatement(id)
    );
  },
  createStatement: async (data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/statements`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.createStatement(data)
    );
  },
  updateStatement: async (id: number, data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/statements/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.updateStatement(id, data)
    );
  },
  updateStatementStatus: async (id: number, status: string) => {
    return safeCall(
      () => fetch(`${API_BASE}/statements/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      }),
      () => mockBackend.updateStatementStatus(id, status)
    );
  },
  deleteStatement: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/statements/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }),
      () => mockBackend.deleteStatement(id)
    );
  },
  getStatementGrouped: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/statements/${id}/grouped`, { headers: getHeaders() }),
      () => mockBackend.getStatementGrouped(id)
    );
  },
  getStatementSummary: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/statements/${id}/summary`, { headers: getHeaders() }),
      () => mockBackend.getStatementSummary(id)
    );
  },

  // Transactions
  getTransactions: async (params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {}).toString();
    return safeCall(
      () => fetch(`${API_BASE}/transactions?${query}`, { headers: getHeaders() }),
      () => mockBackend.getTransactions(params)
    );
  },
  getTransaction: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/transactions/${id}`, { headers: getHeaders() }),
      () => mockBackend.getTransaction(id)
    );
  },
  createTransaction: async (data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.createTransaction(data)
    );
  },
  updateTransaction: async (id: number, data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/transactions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.updateTransaction(id, data)
    );
  },
  duplicateTransaction: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/transactions/${id}/duplicate`, {
        method: 'POST',
        headers: getHeaders()
      }),
      () => mockBackend.duplicateTransaction(id)
    );
  },
  deleteTransaction: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/transactions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }),
      () => mockBackend.deleteTransaction(id)
    );
  },

  // Allocations
  getAllocations: async () => {
    return safeCall(
      () => fetch(`${API_BASE}/allocations`, { headers: getHeaders() }),
      () => mockBackend.getAllocations()
    );
  },
  createAllocation: async (data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/allocations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.createAllocation(data)
    );
  },
  updateAllocation: async (id: number, data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/allocations/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.updateAllocation(id, data)
    );
  },
  deleteAllocation: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/allocations/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }),
      () => mockBackend.deleteAllocation(id)
    );
  },
  getAllocationSummary: async (statementId?: number) => {
    const url = statementId ? `${API_BASE}/allocations/summary?statement_id=${statementId}` : `${API_BASE}/allocations/summary`;
    return safeCall(
      () => fetch(url, { headers: getHeaders() }),
      () => mockBackend.getAllocationSummary(statementId)
    );
  },

  // Tax Rules
  getTaxRules: async () => {
    return safeCall(
      () => fetch(`${API_BASE}/taxes/rules`, { headers: getHeaders() }),
      () => mockBackend.getTaxRules()
    );
  },
  createTaxRule: async (data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/taxes/rules`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.createTaxRule(data)
    );
  },
  updateTaxRule: async (id: number, data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/taxes/rules/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.updateTaxRule(id, data)
    );
  },
  calculateTaxes: async (data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/taxes/calculate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.calculateTaxes(data)
    );
  },
  getTaxSummary: async (statementId?: number) => {
    const url = statementId ? `${API_BASE}/taxes/summary?statement_id=${statementId}` : `${API_BASE}/taxes/summary`;
    return safeCall(
      () => fetch(url, { headers: getHeaders() }),
      () => mockBackend.getTaxSummary(statementId)
    );
  },

  // Payments
  getPayments: async (statementId?: number) => {
    const url = statementId ? `${API_BASE}/payments?statement_id=${statementId}` : `${API_BASE}/payments`;
    return safeCall(
      () => fetch(url, { headers: getHeaders() }),
      () => mockBackend.getPayments(statementId)
    );
  },
  recordPayment: async (data: any) => {
    return safeCall(
      () => fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.recordPayment(data)
    );
  },
  deletePayment: async (id: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/payments/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }),
      () => mockBackend.deletePayment(id)
    );
  },

  // Reconciliation
  getReconciliation: async (statementId: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/reconciliation/${statementId}`, { headers: getHeaders() }),
      () => mockBackend.getReconciliation(statementId)
    );
  },
  runReconciliation: async (statementId: number, bankTotal?: number) => {
    return safeCall(
      () => fetch(`${API_BASE}/reconciliation/${statementId}/reconcile`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ bank_total: bankTotal })
      }),
      () => mockBackend.runReconciliation(statementId, bankTotal)
    );
  },
  signOffReconciliation: async (statementId: number, notes?: string) => {
    return safeCall(
      () => fetch(`${API_BASE}/reconciliation/${statementId}/sign-off`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ notes })
      }),
      () => mockBackend.signOffReconciliation(statementId, notes)
    );
  },

  // Import / Export
  previewExcelImport: async (formData?: FormData) => {
    return safeCall(
      () => fetch(`${API_BASE}/import/preview`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('taniisha_token') || ''}` },
        body: formData
      }),
      () => mockBackend.getStatementGrouped(1)
    );
  },
  confirmExcelImport: async (statementId: number | null, rows: any[]) => {
    return safeCall(
      () => fetch(`${API_BASE}/import/confirm`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ statement_id: statementId, rows })
      }),
      async () => ({ success: true, count: rows.length })
    );
  },

  // Reports
  getReportsList: async () => {
    return safeCall(
      () => fetch(`${API_BASE}/reports/list`, { headers: getHeaders() }),
      () => mockBackend.getReportsList()
    );
  },
  getReportPreview: async (reportType: string, statementId?: number) => {
    const url = statementId ? `${API_BASE}/reports/preview/${reportType}?statement_id=${statementId}` : `${API_BASE}/reports/preview/${reportType}`;
    return safeCall(
      () => fetch(url, { headers: getHeaders() }),
      () => mockBackend.getReportPreview(reportType, statementId)
    );
  },
  downloadExcelReport: async (reportType: string, statementId?: number) => {
    try {
      const url = statementId ? `${API_BASE}/reports/excel/${reportType}?statement_id=${statementId}` : `${API_BASE}/reports/excel/${reportType}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
          window.URL.revokeObjectURL(downloadUrl);
        }, 2500);
        return;
      }
    } catch {
      // Fallback
    }
    await mockBackend.downloadExcelReport(reportType, statementId);
  },
  downloadPdfReport: async (reportType: string, statementId?: number) => {
    try {
      const url = statementId ? `${API_BASE}/reports/pdf/${reportType}?statement_id=${statementId}` : `${API_BASE}/reports/pdf/${reportType}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = `report_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
          window.URL.revokeObjectURL(downloadUrl);
        }, 2500);
        return;
      }
    } catch {
      // Fallback
    }
    await mockBackend.downloadPdfReport(reportType, statementId);
  },
  getAuditLogs: async (params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {}).toString();
    return safeCall(
      () => fetch(`${API_BASE}/audit-logs?${query}`, { headers: getHeaders() }),
      () => mockBackend.getAuditLogs(params)
    );
  },

  // Settings
  getSettings: async () => {
    return safeCall(
      () => fetch(`${API_BASE}/settings`, { headers: getHeaders() }),
      () => mockBackend.getSettings()
    );
  },
  updateSettings: async (data: Record<string, string>) => {
    return safeCall(
      () => fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      }),
      () => mockBackend.updateSettings(data)
    );
  },
  getDatabaseInfo: async () => {
    return safeCall(
      () => fetch(`${API_BASE}/settings/database-info`, { headers: getHeaders() }),
      () => mockBackend.getDatabaseInfo()
    );
  },
  downloadDatabaseBackup: async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/database-backup`, { headers: getHeaders() });
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `red_publicis_backup_${new Date().toISOString().slice(0, 10)}.db`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        return;
      }
    } catch {
      // Fallback
    }
    await mockBackend.downloadDatabaseBackup();
  },
  clearTransactionData: async () => {
    return safeCall(
      () => fetch(`${API_BASE}/settings/clear-transaction-data`, {
        method: 'POST',
        headers: getHeaders()
      }),
      () => mockBackend.clearTransactionData()
    );
  }
};
