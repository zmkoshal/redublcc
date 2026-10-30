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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse<{ token: string; user: any }>(res);
  },
  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse<{ user: any }>(res);
  },
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  createUser: async (user: any) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    return handleResponse<any>(res);
  },
  updateUser: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  deleteUser: async (id: number) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },
  resetUserPassword: async (id: number, newPassword: string) => {
    const res = await fetch(`${API_BASE}/users/${id}/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ new_password: newPassword })
    });
    return handleResponse<any>(res);
  },
  changeUserRole: async (id: number, role: string) => {
    const res = await fetch(`${API_BASE}/users/${id}/role`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });
    return handleResponse<any>(res);
  },

  // Dashboard
  getDashboardStats: async (statementId?: number) => {
    const url = statementId ? `${API_BASE}/dashboard/stats?statement_id=${statementId}` : `${API_BASE}/dashboard/stats`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  // Statements
  getStatements: async () => {
    const res = await fetch(`${API_BASE}/statements`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  getStatement: async (id: number) => {
    const res = await fetch(`${API_BASE}/statements/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  createStatement: async (data: any) => {
    const res = await fetch(`${API_BASE}/statements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  updateStatement: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/statements/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  updateStatementStatus: async (id: number, status: string) => {
    const res = await fetch(`${API_BASE}/statements/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse<any>(res);
  },
  deleteStatement: async (id: number) => {
    const res = await fetch(`${API_BASE}/statements/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },
  getStatementGrouped: async (id: number) => {
    const res = await fetch(`${API_BASE}/statements/${id}/grouped`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  getStatementSummary: async (id: number) => {
    const res = await fetch(`${API_BASE}/statements/${id}/summary`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  // Transactions
  getTransactions: async (params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetch(`${API_BASE}/transactions?${query}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  getTransaction: async (id: number) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  createTransaction: async (data: any) => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  updateTransaction: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  duplicateTransaction: async (id: number) => {
    const res = await fetch(`${API_BASE}/transactions/${id}/duplicate`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },
  deleteTransaction: async (id: number) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },

  // Allocations
  getAllocations: async () => {
    const res = await fetch(`${API_BASE}/allocations`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  createAllocation: async (data: any) => {
    const res = await fetch(`${API_BASE}/allocations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  updateAllocation: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/allocations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  deleteAllocation: async (id: number) => {
    const res = await fetch(`${API_BASE}/allocations/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },
  getAllocationSummary: async (statementId?: number) => {
    const url = statementId ? `${API_BASE}/allocations/summary?statement_id=${statementId}` : `${API_BASE}/allocations/summary`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  // Taxes
  getTaxRules: async () => {
    const res = await fetch(`${API_BASE}/taxes/rules`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  createTaxRule: async (data: any) => {
    const res = await fetch(`${API_BASE}/taxes/rules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  updateTaxRule: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/taxes/rules/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  calculateTaxes: async (data: any) => {
    const res = await fetch(`${API_BASE}/taxes/calculate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  getTaxSummary: async (statementId?: number) => {
    const url = statementId ? `${API_BASE}/taxes/summary?statement_id=${statementId}` : `${API_BASE}/taxes/summary`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  // Payments
  getPayments: async (statementId?: number) => {
    const url = statementId ? `${API_BASE}/payments?statement_id=${statementId}` : `${API_BASE}/payments`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  recordPayment: async (data: any) => {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  deletePayment: async (id: number) => {
    const res = await fetch(`${API_BASE}/payments/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  },

  // Reconciliation
  getReconciliation: async (statementId: number) => {
    const res = await fetch(`${API_BASE}/reconciliation/${statementId}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  runReconciliation: async (statementId: number, bankTotal?: number) => {
    const res = await fetch(`${API_BASE}/reconciliation/${statementId}/reconcile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bank_total: bankTotal })
    });
    return handleResponse<any>(res);
  },
  signOffReconciliation: async (statementId: number, notes?: string) => {
    const res = await fetch(`${API_BASE}/reconciliation/${statementId}/sign-off`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ notes })
    });
    return handleResponse<any>(res);
  },

  // Import / Export Wizard
  previewExcelImport: async (formData?: FormData) => {
    const res = await fetch(`${API_BASE}/import/preview`, {
      method: 'POST',
      headers: getHeaders(false),
      body: formData
    });
    return handleResponse<any>(res);
  },
  confirmExcelImport: async (statementId: number | null, rows: any[]) => {
    const res = await fetch(`${API_BASE}/import/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ statement_id: statementId, rows })
    });
    return handleResponse<any>(res);
  },

  // Reports
  getReportsList: async () => {
    const res = await fetch(`${API_BASE}/reports/list`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  getReportPreview: async (reportType: string, statementId?: number) => {
    const url = statementId ? `${API_BASE}/reports/preview/${reportType}?statement_id=${statementId}` : `${API_BASE}/reports/preview/${reportType}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  downloadExcelReport: async (reportType: string, statementId?: number) => {
    const url = statementId ? `${API_BASE}/reports/excel/${reportType}?statement_id=${statementId}` : `${API_BASE}/reports/excel/${reportType}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to download Excel (${res.status})`);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const disposition = res.headers.get('content-disposition');
    let filename = `${reportType}.xlsx`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
  downloadPdfReport: async (reportType: string, statementId?: number) => {
    const url = statementId ? `${API_BASE}/reports/pdf/${reportType}?statement_id=${statementId}` : `${API_BASE}/reports/pdf/${reportType}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to download PDF (${res.status})`);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const disposition = res.headers.get('content-disposition');
    let filename = `${reportType}.pdf`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Audit Logs & Settings
  getAuditLogs: async (params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetch(`${API_BASE}/audit-logs?${query}`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },
  updateSettings: async (data: Record<string, string>) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<any>(res);
  },
  getDatabaseInfo: async () => {
    const res = await fetch(`${API_BASE}/settings/database-info`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
  downloadDatabaseBackup: async () => {
    const res = await fetch(`${API_BASE}/settings/database-backup`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to download database backup');
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `red_publicis_backup_${new Date().toISOString().slice(0, 10)}.db`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
  clearTransactionData: async () => {
    const res = await fetch(`${API_BASE}/settings/clear-transaction-data`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse<any>(res);
  }
};
