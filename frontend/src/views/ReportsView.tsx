import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Eye,
  FileText,
  Filter,
  CheckCircle,
  BarChart3,
  Calendar,
  Building
} from 'lucide-react';
import { api } from '../services/api';
import { Statement } from '../types';

export const ReportsView: React.FC = () => {
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('ubl_statement');
  const [selectedStatement, setSelectedStatement] = useState<string>('');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      loadReportPreview(selectedReport, selectedStatement);
    }
  }, [selectedReport, selectedStatement]);

  const loadMetadata = async () => {
    setLoading(true);
    try {
      const [reps, stmts] = await Promise.all([api.getReportsList(), api.getStatements()]);
      setReportsList(reps);
      setStatements(stmts);
    } catch (err) {
      console.error('Failed to load reports metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReportPreview = async (reportType: string, stmtIdStr: string) => {
    setLoading(true);
    try {
      const stmtId = stmtIdStr ? Number(stmtIdStr) : undefined;
      const data = await api.getReportPreview(reportType, stmtId);
      setPreviewData(data);
    } catch (err) {
      console.error('Failed to load report preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    const stmtId = selectedStatement ? Number(selectedStatement) : undefined;
    setDownloadingExcel(true);
    try {
      await api.downloadExcelReport(selectedReport, stmtId);
    } catch (err: any) {
      console.error('Excel download error:', err);
      alert(err.message || 'Failed to download Excel report');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    const stmtId = selectedStatement ? Number(selectedStatement) : undefined;
    setDownloadingPdf(true);
    try {
      await api.downloadPdfReport(selectedReport, stmtId);
    } catch (err: any) {
      console.error('PDF download error:', err);
      alert(err.message || 'Failed to download PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatCell = (val: any) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      return new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val);
    }
    return String(val);
  };

  const currentReportObj = reportsList.find(r => r.id === selectedReport);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Financial Reporting & Exports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download professional openpyxl formatted Excel sheets and ReportLab PDF statements for audit and management review
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadExcel}
            disabled={downloadingExcel}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            {downloadingExcel ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>{downloadingExcel ? 'Downloading Excel...' : 'Download Excel'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all"
          >
            {downloadingPdf ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>{downloadingPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Report Selection Grid & Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Reports Navigation Sidebar (1 Col) */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-2">
            Available Reports (10)
          </h4>
          <div className="space-y-1">
            {reportsList.map(rep => {
              const active = selectedReport === rep.id;
              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReport(rep.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="line-clamp-1">{rep.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Preview Panel (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {currentReportObj?.name || 'Financial Report'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentReportObj?.description || 'Real-time database generated report'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Statement:</span>
              <select
                value={selectedStatement}
                onChange={(e) => setSelectedStatement(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">All Periods</option>
                {statements.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.statement_number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabular Preview */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Generating preview data...</p>
              </div>
            ) : (!previewData || !previewData.rows || previewData.rows.length === 0) ? (
              <div className="py-16 text-center text-xs text-slate-500">
                No data available for the selected statement filter.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1F4E79] text-white font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      {previewData.headers.map((h: string, idx: number) => (
                        <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {previewData.rows.map((row: any[], rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">
                          {rIdx + 1}
                        </td>
                        {row.map((cell: any, cIdx: number) => (
                          <td
                            key={cIdx}
                            className={`py-2.5 px-3 whitespace-nowrap ${
                              typeof cell === 'number'
                                ? 'text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {formatCell(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
