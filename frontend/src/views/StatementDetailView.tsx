import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  Building,
  Layers,
  UserCheck,
  ShieldCheck,
  Plus,
  RefreshCw,
  Calculator,
  Search,
  ArrowDownUp,
  Check,
  AlertCircle,
  Sparkles,
  Sliders,
  Upload,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { AllocationCategory } from '../types';
import { useAuth } from '../context/AuthContext';

interface StatementDetailViewProps {
  statementId: number;
  onBack: () => void;
  onAddTransaction: (statementId: number) => void;
}

export const StatementDetailView: React.FC<StatementDetailViewProps> = ({
  statementId,
  onBack,
  onAddTransaction
}) => {
  const [groupedData, setGroupedData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [allocations, setAllocations] = useState<AllocationCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { hasPermission } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    merchant_name: '',
    description: '',
    allocation_id: 1,
    usd_amount: '',
    exchange_rate: '',
    pkr_amount: '',
    advance_tax: '0.00',
    sales_tax_withheld: '0.00',
    other_taxes: '0.00',
    notes: ''
  });

  // Automated Pakistan Tax Engine & Statement Verification State
  const [taxRuleType, setTaxRuleType] = useState<string>('fbr_236y_filer');
  const [isAutoTax, setIsAutoTax] = useState<boolean>(true);
  const [showTaxMatcher, setShowTaxMatcher] = useState<boolean>(false);
  const [topTaxInput, setTopTaxInput] = useState<string>('');
  const [bottomTotalInput, setBottomTotalInput] = useState<string>('');

  // Statement Import Wizard (PDF & Excel) State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const canApprove = hasPermission(['super_admin', 'finance_hof']);
  const canEdit = hasPermission(['super_admin', 'finance_hof', 'it_entry']);

  useEffect(() => {
    loadData();
  }, [statementId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gRes, sRes, aRes] = await Promise.all([
        api.getStatementGrouped(statementId),
        api.getStatementSummary(statementId),
        api.getAllocations()
      ]);
      setGroupedData(gRes);
      setSummaryData(sRes);
      setAllocations(aRes);
      if (aRes.length > 0 && !formData.allocation_id) {
        setFormData(prev => ({ ...prev, allocation_id: aRes[0].id }));
      }
    } catch (err) {
      console.error('Failed to load statement details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pakistan Statutory Tax Calculation Engine (FBR S.236Y, PRA 16%, SRB 15%, Legacy Excel)
  const calculateTaxesForPkr = (pkr: number, rule: string, merchant: string = '') => {
    let adv = 0;
    let st = 0;
    const lower = merchant.toLowerCase();

    let effectiveRule = rule;
    if (effectiveRule === 'fbr_236y_filer' || effectiveRule === 'excel_legacy_formula') {
      if (lower.includes('godaddy') || lower.includes('elevenlabs') || lower.includes('domain') || lower.includes('hosting')) {
        effectiveRule = 'pra_it_16';
      } else if (lower.includes('sms') || lower.includes('fed') || lower.includes('bank charge')) {
        effectiveRule = 'zero';
      }
    }

    if (pkr > 0) {
      if (effectiveRule === 'fbr_236y_filer') {
        // FBR Section 236Y (5% for Active Taxpayer / Filer)
        adv = Math.round(pkr * 0.05 * 100) / 100;
        st = 0;
      } else if (effectiveRule === 'fbr_236y_non_filer') {
        // FBR Section 236Y (10% for Non-Filer under 10th Schedule)
        adv = Math.round(pkr * 0.10 * 100) / 100;
        st = 0;
      } else if (effectiveRule === 'pra_it_16') {
        // Punjab Sales Tax on IT / Cloud Services (16% - GoDaddy, ElevenLabs)
        adv = 0;
        st = Math.round(pkr * 0.16 * 100) / 100;
      } else if (effectiveRule === 'srb_st_15') {
        // Sindh Sales Tax on Services (15%)
        adv = 0;
        st = Math.round(pkr * 0.15 * 100) / 100;
      } else if (effectiveRule === 'st_withheld_5') {
        // Provincial Sales Tax Withholding (5%)
        adv = 0;
        st = Math.round(pkr * 0.05 * 100) / 100;
      } else if (effectiveRule === 'fbr_5_plus_st_5') {
        // Combined 5% Advance Tax + 5% Sales Tax Withholding
        adv = Math.round(pkr * 0.05 * 100) / 100;
        st = Math.round(pkr * 0.05 * 100) / 100;
      } else if (effectiveRule === 'excel_legacy_formula') {
        // Excel Row 6 legacy formula: =ROUND((E*99.5194341117841%*0.48056588821596%), 0)
        adv = Math.round(pkr * 0.995194341117841 * 0.0048056588821596);
        if (lower.includes('mid-journey') || lower.includes('midjourney') || lower.includes('grok')) {
          st = adv;
        } else if (lower.includes('pfdc') || lower.includes('google drive')) {
          st = Math.round(pkr * 0.05 * 100) / 100;
        } else {
          st = 0;
        }
      } else if (effectiveRule === 'zero') {
        adv = 0;
        st = 0;
      }
    }

    return {
      advance_tax: adv > 0 ? adv.toFixed(2) : '0.00',
      sales_tax_withheld: st > 0 ? st.toFixed(2) : '0.00'
    };
  };

  const handleUsdOrRateChange = (usdStr: string, rateStr: string, currentPkr: string) => {
    const usd = parseFloat(usdStr) || 0;
    const rate = parseFloat(rateStr) || 0;
    let newPkr = currentPkr;
    if (usd > 0 && rate > 0) {
      newPkr = (usd * rate).toFixed(2);
    }
    
    let taxUpdates = {};
    if (isAutoTax && parseFloat(newPkr) > 0 && taxRuleType !== 'custom') {
      taxUpdates = calculateTaxesForPkr(parseFloat(newPkr), taxRuleType, formData.merchant_name);
    }

    setFormData(prev => ({
      ...prev,
      usd_amount: usdStr,
      exchange_rate: rateStr,
      pkr_amount: newPkr,
      ...taxUpdates
    }));
  };

  const handlePkrChange = (pkrStr: string) => {
    const pkr = parseFloat(pkrStr) || 0;
    const usd = parseFloat(formData.usd_amount) || 0;
    let newRate = formData.exchange_rate;
    if (usd > 0 && pkr > 0) {
      newRate = (pkr / usd).toFixed(4);
    }

    let taxUpdates = {};
    if (isAutoTax && pkr > 0 && taxRuleType !== 'custom') {
      taxUpdates = calculateTaxesForPkr(pkr, taxRuleType, formData.merchant_name);
    }

    setFormData(prev => ({
      ...prev,
      pkr_amount: pkrStr,
      exchange_rate: newRate,
      ...taxUpdates
    }));
  };

  const handleMerchantChange = (merchant: string) => {
    let rule = taxRuleType;
    const lower = merchant.toLowerCase();
    if (lower.includes('godaddy') || lower.includes('elevenlabs') || lower.includes('domain') || lower.includes('hosting')) {
      rule = 'pra_it_16';
      setTaxRuleType('pra_it_16');
    } else if (lower.includes('sms') || lower.includes('fed') || lower.includes('bank charge')) {
      rule = 'zero';
      setTaxRuleType('zero');
    }

    const pkr = parseFloat(formData.pkr_amount) || 0;
    let taxUpdates = {};
    if (isAutoTax && pkr > 0 && rule !== 'custom') {
      taxUpdates = calculateTaxesForPkr(pkr, rule, merchant);
    }

    setFormData(prev => ({
      ...prev,
      merchant_name: merchant,
      ...taxUpdates
    }));
  };

  const handleTaxRuleChange = (newRule: string) => {
    setTaxRuleType(newRule);
    const pkr = parseFloat(formData.pkr_amount) || 0;
    if (newRule !== 'custom' && pkr > 0) {
      const taxes = calculateTaxesForPkr(pkr, newRule, formData.merchant_name);
      setFormData(prev => ({
        ...prev,
        ...taxes
      }));
    }
  };

  // Reverse Calculator: User enters the Total Statement Debit (Bottom) & it auto-splits Base PKR + Taxes under Pakistan rules
  const handleReverseSplitFromTotal = (totalStr: string) => {
    const total = parseFloat(totalStr) || 0;
    if (total <= 0) return;

    let pkr = 0;
    let adv = 0;
    let st = 0;

    if (taxRuleType === 'fbr_236y_filer') {
      // 5% Advance Tax: Base = Total / 1.05
      pkr = Math.round((total / 1.05) * 100) / 100;
      adv = Math.round((total - pkr) * 100) / 100;
    } else if (taxRuleType === 'fbr_236y_non_filer') {
      // 10% Advance Tax: Base = Total / 1.10
      pkr = Math.round((total / 1.10) * 100) / 100;
      adv = Math.round((total - pkr) * 100) / 100;
    } else if (taxRuleType === 'pra_it_16') {
      // 16% PRA Sales Tax: Base = Total / 1.16
      pkr = Math.round((total / 1.16) * 100) / 100;
      st = Math.round((total - pkr) * 100) / 100;
    } else if (taxRuleType === 'srb_st_15') {
      // 15% SRB Sales Tax: Base = Total / 1.15
      pkr = Math.round((total / 1.15) * 100) / 100;
      st = Math.round((total - pkr) * 100) / 100;
    } else if (taxRuleType === 'st_withheld_5') {
      // 5% Sales Tax: Base = Total / 1.05
      pkr = Math.round((total / 1.05) * 100) / 100;
      st = Math.round((total - pkr) * 100) / 100;
    } else if (taxRuleType === 'fbr_5_plus_st_5') {
      // 5% Adv + 5% ST: Base = Total / 1.10
      pkr = Math.round((total / 1.10) * 100) / 100;
      adv = Math.round((pkr * 0.05) * 100) / 100;
      st = Math.round((total - pkr - adv) * 100) / 100;
    } else if (taxRuleType === 'excel_legacy_formula') {
      const lower = formData.merchant_name.toLowerCase();
      const isDual = lower.includes('mid-journey') || lower.includes('midjourney') || lower.includes('grok');
      const factor = isDual ? 1.00957 : 1.00478;
      pkr = Math.round((total / factor) * 100) / 100;
      const taxes = calculateTaxesForPkr(pkr, 'excel_legacy_formula', formData.merchant_name);
      adv = parseFloat(taxes.advance_tax) || 0;
      st = parseFloat(taxes.sales_tax_withheld) || 0;
    } else {
      pkr = total;
    }

    const usd = parseFloat(formData.usd_amount) || 0;
    let rate = formData.exchange_rate;
    if (usd > 0 && pkr > 0) {
      rate = (pkr / usd).toFixed(4);
    }

    setFormData(prev => ({
      ...prev,
      pkr_amount: pkr.toFixed(2),
      exchange_rate: rate,
      advance_tax: adv.toFixed(2),
      sales_tax_withheld: st.toFixed(2)
    }));
  };

  const handleAddEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createTransaction({
        statement_id: statementId,
        transaction_date: formData.transaction_date,
        merchant_name: formData.merchant_name.trim(),
        description: formData.description.trim() || formData.merchant_name.trim(),
        allocation_id: Number(formData.allocation_id),
        usd_amount: formData.usd_amount ? parseFloat(formData.usd_amount) : null,
        exchange_rate: formData.exchange_rate ? parseFloat(formData.exchange_rate) : null,
        pkr_amount: parseFloat(formData.pkr_amount) || 0,
        advance_tax: parseFloat(formData.advance_tax) || 0,
        sales_tax_withheld: parseFloat(formData.sales_tax_withheld) || 0,
        other_taxes: parseFloat(formData.other_taxes) || 0,
        notes: formData.notes,
        approval_status: 'Approved'
      });
      setIsAddModalOpen(false);
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        merchant_name: '',
        description: '',
        allocation_id: allocations[0]?.id || 1,
        usd_amount: '',
        exchange_rate: '',
        pkr_amount: '',
        advance_tax: '0.00',
        sales_tax_withheld: '0.00',
        other_taxes: '0.00',
        notes: ''
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunPreview = async () => {
    setIsImporting(true);
    try {
      let formDataUpload = undefined;
      if (importFile) {
        formDataUpload = new FormData();
        formDataUpload.append('file', importFile);
        if (pdfPassword) {
          formDataUpload.append('password', pdfPassword);
        }
      }
      const preview = await api.previewExcelImport(formDataUpload);
      setImportPreview(preview);
    } catch (err: any) {
      alert(err.message || 'Error parsing statement file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !importPreview.rows || importPreview.rows.length === 0) return;
    setIsImporting(true);
    try {
      await api.confirmExcelImport(statementId, importPreview.rows);
      setIsImportModalOpen(false);
      setImportPreview(null);
      setImportFile(null);
      loadData();
      alert('Statement successfully populated with imported entries and formulas!');
    } catch (err: any) {
      alert(err.message || 'Import confirmation failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.updateStatementStatus(statementId, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const formatPKR = (val: number) => {
    return `Rs. ${Number(val || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatUSD = (val?: number) => {
    if (!val) return '-';
    return `USD ${Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  if (loading || !groupedData) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-2 font-medium">Loading grouped statement workbook layout...</p>
      </div>
    );
  }

  const { statement, groups, grand_total } = groupedData;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {statement.statement_number}
              </h2>
              <Badge status={statement.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Statement Date: <b>{statement.statement_date}</b> &nbsp;|&nbsp; Due Date: <b>{statement.payment_due_date}</b>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canApprove && statement.status !== 'Approved' && (
            <button
              onClick={() => handleStatusChange('Approved')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approve Statement</span>
            </button>
          )}

          {canEdit && (
            <>
              <button
                onClick={() => {
                  setIsImportModalOpen(true);
                  setImportPreview(null);
                  setPdfPassword('');
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Import Statement (PDF / Excel)</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Entry (Auto Formula)</span>
              </button>
            </>
          )}

          <button
            onClick={() => api.downloadExcelReport('ubl_statement', statementId)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => api.downloadPdfReport('ubl_statement', statementId)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Corporate Excel Replication Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Statement Title Header matching Excel Row 1 */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 text-center">
          <h3 className="text-base font-extrabold uppercase tracking-wider text-blue-400">
            UBL CREDIT CARD STATEMENT FOR PAYMENT
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">
            RED PUBLICIS | Statement Date: {statement.statement_date} &nbsp; Payment Due Date: {statement.payment_due_date}
          </p>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1F4E79] text-white font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Party / Merchant Name</th>
                <th className="py-3 px-4 text-right">Online (USD)</th>
                <th className="py-3 px-4 text-right">Exchange Rate</th>
                <th className="py-3 px-4 text-right">Rs. (PKR)</th>
                <th className="py-3 px-4 text-right">Adv Tax</th>
                <th className="py-3 px-4 text-right">Sales Tax Withheld</th>
                <th className="py-3 px-4 text-right font-extrabold">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {groups.map((group: any, gIndex: number) => {
                const cat = group.category;
                const sub = group.subtotal;
                return (
                  <React.Fragment key={cat.id || gIndex}>
                    {/* Allocation Group Header */}
                    <tr className="bg-blue-50/70 dark:bg-blue-950/40 border-t-2 border-blue-200 dark:border-blue-900">
                      <td colSpan={9} className="py-2.5 px-4">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                          <span className="font-extrabold text-blue-900 dark:text-blue-200 uppercase tracking-wide text-xs">
                            {cat.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                            {group.transactions.length} items
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Group Transactions */}
                    {group.transactions.map((t: any, tIndex: number) => (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                          {tIndex + 1}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          <div>
                            <span>{t.merchant_name}</span>
                            {t.description && t.description !== t.merchant_name && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                          {formatUSD(t.usd_amount)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-300 tabular-nums font-mono text-[11px]">
                          {t.exchange_rate ? Number(t.exchange_rate).toFixed(2) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                          {formatPKR(t.pkr_amount)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-purple-700 dark:text-purple-300 tabular-nums">
                          {formatPKR(t.advance_tax)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-teal-700 dark:text-teal-300 tabular-nums">
                          {formatPKR(t.sales_tax_withheld)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatPKR(t.total_amount)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge status={t.approval_status} />
                        </td>
                      </tr>
                    ))}

                    {/* Group Subtotal Row */}
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 font-bold border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      <td colSpan={4} className="py-2.5 px-4 text-right uppercase text-[11px] text-slate-600 dark:text-slate-400">
                        SUBTOTAL ({cat.code || cat.name}):
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {formatPKR(sub.pkr_amount)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-purple-700 dark:text-purple-300 tabular-nums">
                        {formatPKR(sub.advance_tax)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-teal-700 dark:text-teal-300 tabular-nums">
                        {formatPKR(sub.sales_tax_withheld)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-extrabold text-blue-700 dark:text-blue-400 tabular-nums text-sm">
                        {formatPKR(sub.total_amount)}
                      </td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* Grand Total Row */}
              <tr className="bg-blue-100 dark:bg-blue-950 font-black text-slate-900 dark:text-white border-t-2 border-b-2 border-blue-400 text-sm">
                <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider">
                  GRAND TOTAL:
                </td>
                <td className="py-3.5 px-4 text-right tabular-nums">
                  {formatPKR(grand_total.pkr_amount)}
                </td>
                <td className="py-3.5 px-4 text-right text-purple-800 dark:text-purple-300 tabular-nums">
                  {formatPKR(grand_total.advance_tax)}
                </td>
                <td className="py-3.5 px-4 text-right text-teal-800 dark:text-teal-300 tabular-nums">
                  {formatPKR(grand_total.sales_tax_withheld)}
                </td>
                <td className="py-3.5 px-4 text-right font-black text-blue-900 dark:text-blue-300 tabular-nums text-base">
                  {formatPKR(grand_total.total_amount)}
                </td>
                <td></td>
              </tr>

              {/* Amount Paid Row */}
              <tr className="bg-white dark:bg-slate-900 font-bold text-xs text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <td colSpan={7} className="py-2.5 px-4 text-right uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  AMOUNT PAID:
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  -{formatPKR(grand_total.amount_paid)}
                </td>
                <td></td>
              </tr>

              {/* Outstanding Balance Row */}
              <tr className="bg-amber-50 dark:bg-amber-950/40 font-black text-amber-900 dark:text-amber-200 text-sm border-b-2 border-amber-300 dark:border-amber-700">
                <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider">
                  OUTSTANDING BALANCE:
                </td>
                <td className="py-3 px-4 text-right font-black tabular-nums text-base">
                  {formatPKR(grand_total.outstanding_balance)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Corporate Signatures Block (Row 81 of workbook) */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">PREPARED BY</p>
            <div className="h-10 border-b border-slate-300 dark:border-slate-600 my-2"></div>
            <p className="text-[11px] font-semibold text-slate-500">IT / Data Entry Specialist</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">VERIFIED BY</p>
            <div className="h-10 border-b border-slate-300 dark:border-slate-600 my-2"></div>
            <p className="text-[11px] font-semibold text-slate-500">Admin & HR Manager</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">APPROVED BY</p>
            <div className="h-10 border-b border-slate-300 dark:border-slate-600 my-2"></div>
            <p className="text-[11px] font-semibold text-slate-500">HEAD OF FINANCE</p>
          </div>
        </div>
      </div>

      {/* SUMMARY SECTION (Replicating Rows 84-90 of the workbook) */}
      {summaryData && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="bg-[#2F5597] text-white px-5 py-3 flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider">
              FINANCIAL ALLOCATION SUMMARY
            </h4>
            <span className="text-[11px] text-blue-200">
              Auto-reconciled from database records
            </span>
          </div>
          <div className="p-5">
            <div className="max-w-xl mx-auto rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Detail</th>
                    <th className="py-2.5 px-4 text-center">Items</th>
                    <th className="py-2.5 px-4 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {summaryData.summary_rows.map((row: any) => (
                    <tr key={row.category_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-500">
                        {row.transaction_count}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-slate-900 dark:text-white font-bold">
                        {formatPKR(row.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                    <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider">
                      G.TOTAL:
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-blue-600 dark:text-blue-400 font-black text-sm">
                      {formatPKR(summaryData.grand_total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Direct Add Entry with Auto-Applied Excel Formulas Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Statement Entry (Auto-Applying Formulas)"
        subtitle="Automatic Exchange Rate, FBR 236Y advance tax, sales tax, and =SUM(E:G) total calculation"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddEntrySubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Charge Allocation Category *
              </label>
              <select
                required
                value={formData.allocation_id}
                onChange={(e) => setFormData({ ...formData, allocation_id: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allocations.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Party / Merchant Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mid-Journey, GoDaddy, Google, Amazon"
                value={formData.merchant_name}
                onChange={(e) => handleMerchantChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description / Line Item
              </label>
              <input
                type="text"
                placeholder="Optional memo or description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Currency Calculations */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Foreign Currency & Base Conversion
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Foreign Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10.00"
                  value={formData.usd_amount}
                  onChange={(e) => handleUsdOrRateChange(e.target.value, formData.exchange_rate, formData.pkr_amount)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Exchange Rate (PKR/USD)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="e.g. 292.4430"
                  value={formData.exchange_rate}
                  onChange={(e) => handleUsdOrRateChange(formData.usd_amount, e.target.value, formData.pkr_amount)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Pakistani Rupee (PKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.pkr_amount}
                  onChange={(e) => handlePkrChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs font-bold text-blue-900 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Automated Tax Rule Controls */}
          <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Tax Calculation Rule
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                  {isAutoTax ? 'Auto-Applied' : 'Manual'}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={isAutoTax}
                    onChange={(e) => setIsAutoTax(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Auto-Compute on Keystroke</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowTaxMatcher(!showTaxMatcher)}
                  className="inline-flex items-center space-x-1 text-purple-700 dark:text-purple-300 hover:text-purple-900 font-bold underline text-[11px]"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{showTaxMatcher ? 'Hide Matcher' : 'Statement Matcher'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tax Rate / Formula Standard (Pakistan):
                </label>
                <select
                  value={taxRuleType}
                  onChange={(e) => handleTaxRuleChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs font-bold text-purple-900 dark:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="fbr_236y_filer">🇵🇰 FBR Section 236Y (5.0% - Active Filer / ATL)</option>
                  <option value="fbr_236y_non_filer">⚠️ FBR Section 236Y (10.0% - Non-Filer Surcharge)</option>
                  <option value="pra_it_16">💻 PRA Punjab IT &amp; Cloud (16.0% ST - GoDaddy/ElevenLabs)</option>
                  <option value="srb_st_15">🏛️ SRB Sindh Digital Services (15.0% ST)</option>
                  <option value="st_withheld_5">📑 Provincial ST Withholding (5.0%)</option>
                  <option value="fbr_5_plus_st_5">⚖️ FBR 236Y (5% Adv Tax) + Provincial ST (5% Withheld)</option>
                  <option value="excel_legacy_formula">📊 Legacy Excel Formula (~0.48% - Row 6 Reconcile)</option>
                  <option value="zero">🧾 Bank Charges / FED / Local Exempt (0% Tax)</option>
                  <option value="custom">✏️ Custom Manual Override</option>
                </select>
              </div>

              <div className="flex items-end pb-0.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {taxRuleType === 'fbr_236y_filer' && 'Income Tax Ordinance 2001, Section 236Y: 5% statutory advance income tax for Active Taxpayers (ATL / Filers) on foreign card spend.'}
                  {taxRuleType === 'fbr_236y_non_filer' && 'Tenth Schedule to ITO 2001: 100% higher rate (10%) advance tax on persons not appearing on Active Taxpayers List.'}
                  {taxRuleType === 'pra_it_16' && 'Punjab Sales Tax on Services Act 2012: 16% sales tax on IT services, software licenses, domain renewals, and cloud hosting.'}
                  {taxRuleType === 'srb_st_15' && 'Sindh Sales Tax on Services Act 2011: 15% standard provincial sales tax on digital advertising and cloud services.'}
                  {taxRuleType === 'st_withheld_5' && 'Sales Tax Special Procedure (Withholding) Rules: 5% standard sales tax deduction by corporate withholding agents.'}
                  {taxRuleType === 'fbr_5_plus_st_5' && 'Combined 5% FBR Section 236Y advance tax + 5% provincial sales tax withheld.'}
                  {taxRuleType === 'excel_legacy_formula' && 'Historical Excel sheet row 6 formula: =ROUND(PKR * 99.52% * 0.48%) for reconciling prior billing cycles.'}
                  {taxRuleType === 'zero' && '0% tax applied (e.g. UBL SMS alert fee PKR 250, FED PKR 40, or non-taxable local transactions).'}
                  {taxRuleType === 'custom' && 'Manual override mode: enter any custom tax amounts directly in the boxes below.'}
                </p>
              </div>
            </div>

            {/* Bank Statement Tax Matcher Widget */}
            {showTaxMatcher && (
              <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 space-y-3 animate-in fade-in-50">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center space-x-1.5">
                    <ArrowDownUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Statement Matcher (Tax on Top &bull; Entry on Bottom)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Pakistan Bank Statement Auto-Verification
                  </span>
                </div>

                {/* Live Pakistan Tax Comparative Options Matrix */}
                {parseFloat(formData.pkr_amount) > 0 && (
                  <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 dark:text-purple-200">
                      <span>Pakistan Tax Rules Comparison for PKR {formData.pkr_amount}:</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Click any option to apply</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* FBR Filer 5% */}
                      <button
                        type="button"
                        onClick={() => handleTaxRuleChange('fbr_236y_filer')}
                        className={`p-2 rounded-lg text-left transition-all border ${
                          taxRuleType === 'fbr_236y_filer'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="text-[10px] font-bold opacity-80">FBR 236Y Filer (5%)</div>
                        <div className="text-xs font-extrabold mt-0.5">
                          PKR {(parseFloat(formData.pkr_amount) * 0.05).toFixed(2)}
                        </div>
                        <div className="text-[9px] opacity-75 mt-0.5">
                          Total: {(parseFloat(formData.pkr_amount) * 1.05).toFixed(2)}
                        </div>
                      </button>

                      {/* FBR Non-Filer 10% */}
                      <button
                        type="button"
                        onClick={() => handleTaxRuleChange('fbr_236y_non_filer')}
                        className={`p-2 rounded-lg text-left transition-all border ${
                          taxRuleType === 'fbr_236y_non_filer'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="text-[10px] font-bold opacity-80">FBR Non-Filer (10%)</div>
                        <div className="text-xs font-extrabold mt-0.5">
                          PKR {(parseFloat(formData.pkr_amount) * 0.10).toFixed(2)}
                        </div>
                        <div className="text-[9px] opacity-75 mt-0.5">
                          Total: {(parseFloat(formData.pkr_amount) * 1.10).toFixed(2)}
                        </div>
                      </button>

                      {/* PRA 16% */}
                      <button
                        type="button"
                        onClick={() => handleTaxRuleChange('pra_it_16')}
                        className={`p-2 rounded-lg text-left transition-all border ${
                          taxRuleType === 'pra_it_16'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="text-[10px] font-bold opacity-80">PRA Punjab IT (16%)</div>
                        <div className="text-xs font-extrabold mt-0.5">
                          PKR {(parseFloat(formData.pkr_amount) * 0.16).toFixed(2)}
                        </div>
                        <div className="text-[9px] opacity-75 mt-0.5">
                          Total: {(parseFloat(formData.pkr_amount) * 1.16).toFixed(2)}
                        </div>
                      </button>

                      {/* Legacy Formula ~0.48% */}
                      <button
                        type="button"
                        onClick={() => handleTaxRuleChange('excel_legacy_formula')}
                        className={`p-2 rounded-lg text-left transition-all border ${
                          taxRuleType === 'excel_legacy_formula'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="text-[10px] font-bold opacity-80">Legacy Sheet (~0.48%)</div>
                        <div className="text-xs font-extrabold mt-0.5">
                          PKR {Math.round(parseFloat(formData.pkr_amount) * 0.995194341117841 * 0.0048056588821596).toFixed(2)}
                        </div>
                        <div className="text-[9px] opacity-75 mt-0.5">
                          Row 6 Reconcile
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Mode 1: Check Top Tax against Entry */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      1. Tax from Top of Statement:
                    </label>
                    <div className="flex space-x-1.5">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 146.22 or 14.00"
                        value={topTaxInput}
                        onChange={(e) => setTopTaxInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                      />
                      {topTaxInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, advance_tax: parseFloat(topTaxInput).toFixed(2) }));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold whitespace-nowrap"
                          title="Adopt exact top tax into Adv Tax field"
                        >
                          Adopt
                        </button>
                      )}
                    </div>
                    {topTaxInput && (
                      <div className="text-[11px] font-medium pt-0.5">
                        {Math.abs(parseFloat(topTaxInput) - (parseFloat(formData.advance_tax) || 0)) < 0.5 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5 inline" />
                            <span>Exact Match with Calculated Adv Tax!</span>
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            {parseFloat(formData.pkr_amount) > 0 && Math.abs(parseFloat(topTaxInput) - parseFloat(formData.pkr_amount) * 0.05) < 1 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                                🇵🇰 Matches FBR 236Y Active Filer (5%)!
                              </span>
                            )}
                            {parseFloat(formData.pkr_amount) > 0 && Math.abs(parseFloat(topTaxInput) - parseFloat(formData.pkr_amount) * 0.10) < 1 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                                ⚠️ Matches FBR 236Y Non-Filer (10%)!
                              </span>
                            )}
                            {parseFloat(formData.pkr_amount) > 0 && Math.abs(parseFloat(topTaxInput) - parseFloat(formData.pkr_amount) * 0.16) < 1 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                                💻 Matches PRA Punjab IT 16% Sales Tax!
                              </span>
                            )}
                            {parseFloat(formData.pkr_amount) > 0 && Math.abs(parseFloat(topTaxInput) - Math.round(parseFloat(formData.pkr_amount) * 0.995194 * 0.004805)) < 1 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                                📊 Matches Legacy Excel Formula (~0.48%)!
                              </span>
                            )}
                            <span className="text-amber-600 dark:text-amber-400 block text-[10px]">
                              Diff: PKR {Math.abs(parseFloat(topTaxInput) - (parseFloat(formData.advance_tax) || 0)).toFixed(2)} vs current ({formData.advance_tax})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mode 2: Reverse Split from Total Bill at Bottom */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      2. Total Bill from Bottom of Statement:
                    </label>
                    <div className="flex space-x-1.5">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2952.43 or 125651.20"
                        value={bottomTotalInput}
                        onChange={(e) => setBottomTotalInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => handleReverseSplitFromTotal(bottomTotalInput)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold whitespace-nowrap"
                      >
                        Auto-Split
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Auto-extracts Base PKR, Adv Tax &amp; Sales Tax under {taxRuleType}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Taxes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Advance Tax (FBR 236Y)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.advance_tax}
                onChange={(e) => setFormData({ ...formData, advance_tax: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sales Tax Withheld
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.sales_tax_withheld}
                onChange={(e) => setFormData({ ...formData, sales_tax_withheld: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                FED / Bank Charges
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.other_taxes}
                onChange={(e) => setFormData({ ...formData, other_taxes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Excel Formula Auto-Applied Real-Time Total Banner */}
          {(() => {
            const pkrVal = parseFloat(formData.pkr_amount) || 0;
            const advVal = parseFloat(formData.advance_tax) || 0;
            const stVal = parseFloat(formData.sales_tax_withheld) || 0;
            const othVal = parseFloat(formData.other_taxes) || 0;
            const totalVal = (pkrVal + advVal + stVal + othVal).toFixed(2);
            return (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-blue-950/50 dark:via-indigo-950/40 dark:to-emerald-950/40 border border-blue-200 dark:border-blue-800/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-blue-900 dark:text-blue-200">
                      Excel Formula Auto-Applied:
                    </span>
                    <code className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300">
                      =SUM(E{'{row}'}:G{'{row}'})
                    </code>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Total Amount:</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                      PKR {Number(totalVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-mono">
                  Rs. {pkrVal.toFixed(2)} + Adv Tax {advVal.toFixed(2)} + Sales Tax {stVal.toFixed(2)} {othVal > 0 ? `+ Other ${othVal.toFixed(2)} ` : ''}= PKR {totalVal}
                </p>
              </div>
            );
          })()}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Reference
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
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              <span>{submitting ? 'Applying Formulas...' : 'Add Entry & Apply Formulas'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Statement Import Wizard Modal (PDF & Excel) */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={`Import into Statement: ${statement?.statement_number || ''}`}
        subtitle="Automatic bank statement PDF text parser, Excel workbook grouping, FBR 236Y advance tax, and subtotal formulas"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FileText className="w-9 h-9 text-rose-500" />
              <FileSpreadsheet className="w-9 h-9 text-emerald-600" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Upload Bank Credit Card Statement (PDF or Excel .xlsx)
            </h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 mb-3">
              Supports official bank statements (UBL, etc.). Automatically extracts transactions, foreign currency (USD), computes exchange rates, applies FBR 236Y advance tax, and allocates expenses to RED, KKOP, PFDC, or Executive accounts.
            </p>
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400"
                />
                <button
                  onClick={handleRunPreview}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isImporting ? 'Analyzing...' : 'Parse & Apply Formulas'}
                </button>
              </div>

              {importFile?.name.toLowerCase().endsWith('.pdf') && (
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 text-[11px]">PDF Password (optional):</span>
                  <input
                    type="password"
                    placeholder="Enter password if statement is locked"
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Import Preview Results */}
          {importPreview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div>
                  <h5 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                    Ready to Import: {importPreview.total_rows_found} Transactions Detected
                  </h5>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {importPreview.subtotal_rows_skipped} subtotal / formula rows safely skipped. Total Amount: {formatPKR(importPreview.totals.total_amount)}
                  </p>
                </div>
                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  {isImporting ? 'Importing...' : 'Confirm & Save Records'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-[10px] uppercase text-slate-600 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Merchant</th>
                      <th className="py-2 px-3">Allocation</th>
                      <th className="py-2 px-3 text-right">USD</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">PKR Amount</th>
                      <th className="py-2 px-3 text-right">Adv Tax</th>
                      <th className="py-2 px-3 text-right">Total PKR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {importPreview.rows.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 text-slate-400">{r.row_number}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {r.merchant_name}
                        </td>
                        <td className="py-1.5 px-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                            {r.allocation_name.replace('CHARGE TO ', '')}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right tabular-nums">{formatUSD(r.usd_amount)}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums">{r.exchange_rate ? Number(r.exchange_rate).toFixed(2) : '-'}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums">{formatPKR(r.pkr_amount)}</td>
                        <td className="py-1.5 px-3 text-right text-purple-600 tabular-nums">{formatPKR(r.advance_tax)}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-blue-600 tabular-nums">{formatPKR(r.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
