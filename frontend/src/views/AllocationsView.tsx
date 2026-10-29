import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  Building2,
  User,
  Layers,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { api } from '../services/api';
import { AllocationCategory } from '../types';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const AllocationsView: React.FC = () => {
  const [allocationsSummary, setAllocationsSummary] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDrillDown, setActiveDrillDown] = useState<any | null>(null);

  // Manage Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<AllocationCategory | null>(null);
  const [catForm, setCatForm] = useState({
    code: '',
    name: '',
    entity_type: 'Company' as 'Company' | 'Individual' | 'Client' | 'Other',
    description: '',
    display_order: 10
  });

  const { hasPermission } = useAuth();
  const canManage = hasPermission(['super_admin', 'finance_hof']);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await api.getAllocationSummary();
      setAllocationsSummary(data.categories || []);
      setGrandTotal(data.grand_total || 0);
    } catch (err) {
      console.error('Failed to load allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setCatForm({
      code: '',
      name: '',
      entity_type: 'Company',
      description: '',
      display_order: 10
    });
    setIsCategoryModalOpen(true);
  };

  const openEditModal = (cat: AllocationCategory) => {
    setEditingCategory(cat);
    setCatForm({
      code: cat.code,
      name: cat.name,
      entity_type: cat.entity_type,
      description: cat.description || '',
      display_order: cat.display_order
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateAllocation(editingCategory.id, catForm);
      } else {
        await api.createAllocation(catForm);
      }
      setIsCategoryModalOpen(false);
      loadSummary();
    } catch (err: any) {
      alert(err.message || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (cat: AllocationCategory) => {
    if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      try {
        await api.deleteAllocation(cat.id);
        loadSummary();
      } catch (err: any) {
        alert(err.message || 'Cannot delete category in use');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Expense Allocation Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configurable corporate entities, clients, and individual cost centers with full drill-down reconciliation
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Allocation Entity</span>
          </button>
        )}
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {allocationsSummary.map((item: any) => {
          const cat = item.category;
          const share = grandTotal > 0 ? ((item.total_amount / grandTotal) * 100).toFixed(1) : '0';
          const isSelected = activeDrillDown?.category?.id === cat.id;

          const getIcon = () => {
            if (cat.entity_type === 'Individual') return User;
            if (cat.entity_type === 'Client') return Layers;
            return Building2;
          };
          const Icon = getIcon();

          return (
            <div
              key={cat.id || 'unallocated'}
              className={`rounded-2xl p-5 border transition-all duration-200 shadow-sm ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {cat.name}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {cat.entity_type} &bull; Code: {cat.code}
                    </span>
                  </div>
                </div>

                {canManage && cat.id && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Amounts and Share */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Total Incurred:
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {formatPKR(item.total_amount)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{item.transaction_count} Transactions</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{share}% of Total</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, Number(share)))}%` }}
                  ></div>
                </div>

                {/* Drill-down Toggle Button */}
                <button
                  onClick={() => setActiveDrillDown(isSelected ? null : item)}
                  className="mt-4 w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Close Drill-down' : 'View Transactions'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drill-down Transaction Table */}
      {activeDrillDown && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-lg overflow-hidden animate-in fade-in-50 duration-200">
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-blue-200" />
              <h3 className="text-sm font-bold tracking-tight">
                Underlying Transactions for: {activeDrillDown.category.name}
              </h3>
            </div>
            <button
              onClick={() => setActiveDrillDown(null)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-blue-100"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Merchant / Line Item</th>
                  <th className="py-2.5 px-4 text-right">USD Amount</th>
                  <th className="py-2.5 px-4 text-right">Rate</th>
                  <th className="py-2.5 px-4 text-right">Base PKR</th>
                  <th className="py-2.5 px-4 text-right">Adv Tax</th>
                  <th className="py-2.5 px-4 text-right font-extrabold">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {activeDrillDown.transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-500">{t.transaction_date}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {t.merchant_name}
                      {t.description && <span className="block text-[10px] text-slate-400">{t.description}</span>}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{t.usd_amount ? `USD ${Number(t.usd_amount).toFixed(2)}` : '-'}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{t.exchange_rate ? Number(t.exchange_rate).toFixed(2) : '-'}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{formatPKR(t.pkr_amount)}</td>
                    <td className="py-2.5 px-4 text-right text-purple-600 tabular-nums">{formatPKR(t.advance_tax)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-blue-600 tabular-nums">{formatPKR(t.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Allocation Entity' : 'Create Allocation Entity'}
        subtitle="Manage cost centers, subsidiaries, clients, and individual director accounts"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category Code * (e.g. RED, KKOP, PFDC)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. KOOP"
              value={catForm.code}
              onChange={(e) => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Display Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CHARGE TO KOOP / KKOP"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Entity Type *
            </label>
            <select
              value={catForm.entity_type}
              onChange={(e) => setCatForm({ ...catForm, entity_type: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Company">Company / Subsidiary</option>
              <option value="Client">Client Project</option>
              <option value="Individual">Individual Director / Personal</option>
              <option value="Other">Other / Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              placeholder="e.g. Primary cloud infrastructure and SaaS tooling costs"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Save Entity
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
