import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Server,
  Database,
  Save,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  CreditCard,
  Trash2,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SettingsView: React.FC = () => {
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [dbInfo, setDbInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [clearingData, setClearingData] = useState<boolean>(false);
  const [downloadingBackup, setDownloadingBackup] = useState<boolean>(false);

  const { hasPermission } = useAuth();
  const canEdit = hasPermission(['super_admin']);

  const handleClearAllData = async () => {
    if (!window.confirm("Are you sure you want to delete all statements, transactions, payments, and reconciliation records? This cannot be undone.")) {
      return;
    }
    setClearingData(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/settings/clear-transaction-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert("All statements, transactions, payments, and reconciliation records have been cleared. The database is clean for fresh entries.");
        window.location.reload();
      } else {
        alert("Failed to clear data.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred while clearing data.");
    } finally {
      setClearingData(false);
    }
  };


  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [data, dbData] = await Promise.all([
        api.getSettings(),
        api.getDatabaseInfo().catch(() => null)
      ]);
      setSettingsList(data);
      if (dbData) setDbInfo(dbData);
      const dict: Record<string, string> = {};
      data.forEach((s: any) => {
        dict[s.key] = s.value;
      });
      setConfigValues(dict);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      await api.downloadDatabaseBackup();
    } catch (err: any) {
      alert(err.message || 'Failed to download database backup');
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(configValues);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadSettings();
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          System & Enterprise Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Corporate entity identification, database environment, currency configuration, and network parameters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Settings (2 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organization & Bank Info</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company Legal Title
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={configValues['company_name'] || 'RED PUBLICIS (COMMUNICATION ARTS)'}
                onChange={(e) => setConfigValues({ ...configValues, company_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Issuing Bank
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={configValues['default_bank'] || 'UBL'}
                  onChange={(e) => setConfigValues({ ...configValues, default_bank: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Base Reporting Currency
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={configValues['default_currency'] || 'PKR'}
                  onChange={(e) => setConfigValues({ ...configValues, default_currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                FBR Section 236Y Statutory Advance Tax (%)
              </label>
              <input
                type="number"
                step="0.01"
                disabled={!canEdit}
                value={configValues['fbr_section_236y_rate'] || '5.0'}
                onChange={(e) => setConfigValues({ ...configValues, fbr_section_236y_rate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center justify-between">
              {savedSuccess ? (
                <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Settings updated successfully!</span>
                </span>
              ) : <span></span>}

              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save System Settings</span>
              </button>
            </div>
          )}
        </form>

        {/* Server & Deployment Info (1 Col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Database className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Database & Backend Configuration
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-semibold text-emerald-600">
                  {dbInfo?.engine || 'SQLite'} ({dbInfo?.database_file || 'red_publicis.db'})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500">Status:</span>
                <span className="inline-flex items-center space-x-1 font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{dbInfo?.status || 'Connected & Operational'}</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500">Database Size:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {dbInfo?.database_size_kb ? `${dbInfo.database_size_kb} KB` : 'Active'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500">Concurrency Mode:</span>
                <span className="font-semibold text-blue-600">WAL (Write-Ahead Logging)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500">API Gateway:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">http://127.0.0.1:5000</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Numeric Precision:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">NUMERIC(15,2) Exact</span>
              </div>
            </div>

            {canEdit && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={downloadingBackup}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>{downloadingBackup ? 'Downloading Backup...' : 'Download Database Backup (.db)'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-blue-50/70 dark:bg-blue-950/30">
            <h5 className="text-xs font-extrabold text-blue-900 dark:text-blue-200 mb-1">
              Audit & Compliance Guarantee
            </h5>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
              Every balance update, transaction creation, duplicate, tax recalculation, and payment modification is logged in the permanent audit trail with old vs new JSON snapshots.
            </p>
          </div>

          {canEdit && (
            <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
                <Trash2 className="w-4 h-4" />
                <h5 className="text-xs font-bold uppercase tracking-wider">
                  Database Transaction Purge
                </h5>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Delete all statements, transactions, and settlement payments to reset the system for fresh entry. System users, credit cards, categories, and tax rules will remain intact.
              </p>
              <button
                type="button"
                onClick={handleClearAllData}
                disabled={clearingData}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearingData ? 'Clearing Data...' : 'Purge All Statement & Transaction Data'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
