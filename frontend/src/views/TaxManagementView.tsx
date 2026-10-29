import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  ShieldCheck,
  Calculator,
  Edit2,
  Trash2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { TaxRule } from '../types';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const TaxManagementView: React.FC = () => {
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    tax_type: 'ADVANCE_TAX',
    calc_type: 'PERCENTAGE',
    default_rate: '5.0',
    rounding_method: 'ROUND_HALF_UP',
    description: '',
    is_active: true
  });

  // Interactive Tax Sandbox State
  const [testUsd, setTestUsd] = useState<string>('100.00');
  const [testRate, setTestRate] = useState<string>('280.00');
  const [testPkr, setTestPkr] = useState<string>('28000.00');
  const [testResult, setTestResult] = useState<any>(null);

  const { hasPermission } = useAuth();
  const canEdit = hasPermission(['super_admin', 'finance_hof']);

  useEffect(() => {
    loadData();
    runTestCalculation('100.00', '280.00', '28000.00');
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rules, summary] = await Promise.all([api.getTaxRules(), api.getTaxSummary()]);
      setTaxRules(rules);
      setTaxSummary(summary);
    } catch (err) {
      console.error('Failed to load tax rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const runTestCalculation = async (usd: string, rate: string, pkr: string) => {
    try {
      const res = await api.calculateTaxes({
        usd_amount: parseFloat(usd) || 0,
        exchange_rate: parseFloat(rate) || 0,
        pkr_amount: parseFloat(pkr) || 0,
        manual_overrides: {
          advance_tax: (parseFloat(pkr) || 0) * 0.05,
          sales_tax_withheld: 0,
          fed_amount: 40,
          bank_charges: 250
        }
      });
      setTestResult(res);
    } catch (err) {
      console.error('Calculation error:', err);
    }
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData({
      rule_name: '',
      tax_type: 'ADVANCE_TAX',
      calc_type: 'PERCENTAGE',
      default_rate: '5.0',
      rounding_method: 'ROUND_HALF_UP',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rule: TaxRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      tax_type: rule.tax_type,
      calc_type: rule.calc_type,
      default_rate: String(rule.default_rate),
      rounding_method: rule.rounding_method,
      description: rule.description || '',
      is_active: rule.is_active
    });
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        rule_name: formData.rule_name,
        tax_type: formData.tax_type,
        calc_type: formData.calc_type,
        default_rate: parseFloat(formData.default_rate) || 0,
        rounding_method: formData.rounding_method,
        description: formData.description,
        is_active: formData.is_active
      };
      if (editingRule) {
        await api.updateTaxRule(editingRule.id, payload);
      } else {
        await api.createTaxRule(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving rule');
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
            Tax Rules & Withholding Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure FBR Section 236Y advance tax rates, provincial withholding, FED, and banking charges
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tax Rule</span>
          </button>
        )}
      </div>

      {/* Tax Summary KPIs */}
      {taxSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Total Advance Tax (Sec 236Y)
            </span>
            <h4 className="text-2xl font-black text-purple-950 dark:text-purple-100 mt-1 tabular-nums">
              {formatPKR(taxSummary.total_advance_tax)}
            </h4>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
              FBR Foreign transaction withholding
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              Total Sales Tax Withheld
            </span>
            <h4 className="text-2xl font-black text-teal-950 dark:text-teal-100 mt-1 tabular-nums">
              {formatPKR(taxSummary.total_sales_tax_withheld)}
            </h4>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5 font-medium">
              Provincial sales tax compliance
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              FED & Other Statutory Taxes
            </span>
            <h4 className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-1 tabular-nums">
              {formatPKR(taxSummary.total_fed + taxSummary.total_other_taxes)}
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
              Excise & additional tax components
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Grand Total All Taxes & Fees
            </span>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
              {formatPKR(taxSummary.grand_total_taxes)}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Cumulative withholding obligation
            </p>
          </div>
        </div>
      )}

      {/* Rules Table & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Table (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Active Configurable Tax Rules
            </h3>
            <span className="text-xs text-slate-500">{taxRules.length} rules active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Rule Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Rate / Amount</th>
                  <th className="py-2.5 px-3">Rounding</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  {canEdit && <th className="py-2.5 px-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {taxRules.map(rule => (
                  <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">{rule.rule_name}</span>
                      {rule.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{rule.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {rule.tax_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                      {rule.calc_type === 'PERCENTAGE' ? `${rule.default_rate}%` : `PKR ${rule.default_rate}`}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {rule.rounding_method}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rule.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Tax Simulator Sandbox (1 Col) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Calculator className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tax Calculator Sandbox</h3>
              <p className="text-[11px] text-slate-500">Test currency conversions and withholding formulas</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                USD Foreign Amount
              </label>
              <input
                type="number"
                value={testUsd}
                onChange={(e) => {
                  setTestUsd(e.target.value);
                  const pkr = (parseFloat(e.target.value) || 0) * (parseFloat(testRate) || 0);
                  setTestPkr(pkr.toFixed(2));
                  runTestCalculation(e.target.value, testRate, pkr.toFixed(2));
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Exchange Rate (PKR / USD)
              </label>
              <input
                type="number"
                value={testRate}
                onChange={(e) => {
                  setTestRate(e.target.value);
                  const pkr = (parseFloat(testUsd) || 0) * (parseFloat(e.target.value) || 0);
                  setTestPkr(pkr.toFixed(2));
                  runTestCalculation(testUsd, e.target.value, pkr.toFixed(2));
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Base PKR Amount
              </label>
              <input
                type="number"
                value={testPkr}
                onChange={(e) => {
                  setTestPkr(e.target.value);
                  runTestCalculation(testUsd, testRate, e.target.value);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-xs font-bold text-blue-900 dark:text-blue-100 focus:outline-none"
              />
            </div>
          </div>

          {testResult && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>Advance Tax (5%):</span>
                <span className="font-bold tabular-nums">{formatPKR(testResult.advance_tax)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>FED (Statutory):</span>
                <span className="font-bold tabular-nums">{formatPKR(testResult.fed_amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>Bank Fees:</span>
                <span className="font-bold tabular-nums">{formatPKR(testResult.bank_charges)}</span>
              </div>
              <div className="pt-2 border-t border-blue-200 dark:border-blue-800 flex justify-between font-black text-xs text-blue-950 dark:text-blue-200">
                <span>Estimated Total:</span>
                <span className="text-sm tabular-nums">{formatPKR(testResult.total_amount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Create Tax Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit Tax Rule' : 'Create Tax Rule'}
        subtitle="Manage statutory withholding rates and formulas"
        maxWidth="md"
      >
        <form onSubmit={handleSaveRule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FBR Section 236Y Advance Tax"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tax Category *
              </label>
              <select
                value={formData.tax_type}
                onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ADVANCE_TAX">Advance Tax (Sec 236Y)</option>
                <option value="SALES_TAX_WITHHELD">Sales Tax Withheld</option>
                <option value="ADDITIONAL_ST">Additional Sales Tax</option>
                <option value="FED">Federal Excise Duty (FED)</option>
                <option value="BANK_CHARGES">Bank Charges / Fees</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Calculation Mode *
              </label>
              <select
                value={formData.calc_type}
                onChange={(e) => setFormData({ ...formData, calc_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (PKR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Default Rate / Amount *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.default_rate}
                onChange={(e) => setFormData({ ...formData, default_rate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Rounding Rule
              </label>
              <select
                value={formData.rounding_method}
                onChange={(e) => setFormData({ ...formData, rounding_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ROUND_HALF_UP">Round to Nearest Integer</option>
                <option value="EXACT">Exact (2 decimal places)</option>
                <option value="ROUND_UP">Always Round Up</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Statutory Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
