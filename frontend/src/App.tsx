import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './views/DashboardView';
import { StatementsView } from './views/StatementsView';
import { StatementDetailView } from './views/StatementDetailView';
import { TransactionsView } from './views/TransactionsView';
import { AllocationsView } from './views/AllocationsView';
import { TaxManagementView } from './views/TaxManagementView';
import { ReconciliationView } from './views/ReconciliationView';
import { PaymentsView } from './views/PaymentsView';
import { ReportsView } from './views/ReportsView';
import { UsersView } from './views/UsersView';
import { SettingsView } from './views/SettingsView';
import { AuditLogsView } from './views/AuditLogsView';
import { api } from './services/api';
import { Statement } from './types';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './views/LoginPage';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);
  const [activeDetailStatementId, setActiveDetailStatementId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [statements, setStatements] = useState<Statement[]>([]);

  useEffect(() => {
    loadStatements();
  }, []);

  const loadStatements = async () => {
    try {
      const data = await api.getStatements();
      setStatements(data);
    } catch (err) {
      console.error('Failed to load statements in App:', err);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Financial Executive Dashboard';
      case 'statements':
        return 'Credit Card Statements';
      case 'statement_detail':
        return 'Statement Details & Subtotals';
      case 'transactions':
        return 'Transactions & Expenses';
      case 'allocations':
        return 'Corporate Expense Allocations';
      case 'taxes':
        return 'Tax Rates & Withholding Management';
      case 'reconciliation':
        return 'Statement Reconciliation & Payments';
      case 'payments':
        return 'Payments & Settlements History';
      case 'reports':
        return 'Financial Reports & Downloads';
      case 'users':
        return 'User Management & Role Permissions (RBAC)';
      case 'settings':
        return 'System & Network Settings';
      case 'audit':
        return 'Audit Logs & Change History';
      default:
        return 'Dashboard';
    }
  };

  const handleSelectStatementDetail = (id: number) => {
    setActiveDetailStatementId(id);
    setCurrentView('statement_detail');
  };

  const handleAddTransactionFromDetail = (stmtId: number) => {
    setSelectedStatementId(stmtId);
    setCurrentView('transactions');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loading Red Publicis Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentViewTitle={getViewTitle()}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          statements={statements}
          selectedStatementId={selectedStatementId}
          onSelectStatement={setSelectedStatementId}
          onRefresh={loadStatements}
        />

        {/* Dynamic View Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="max-w-7xl mx-auto pb-12">
            {currentView === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentView}
                selectedStatementId={selectedStatementId}
              />
            )}
            {currentView === 'statements' && (
              <StatementsView
                onSelectStatementDetail={handleSelectStatementDetail}
              />
            )}
            {currentView === 'statement_detail' && activeDetailStatementId && (
              <StatementDetailView
                statementId={activeDetailStatementId}
                onBack={() => setCurrentView('statements')}
                onAddTransaction={handleAddTransactionFromDetail}
              />
            )}
            {currentView === 'transactions' && (
              <TransactionsView
                initialStatementId={selectedStatementId}
              />
            )}
            {currentView === 'allocations' && <AllocationsView />}
            {currentView === 'taxes' && <TaxManagementView />}
            {currentView === 'reconciliation' && <ReconciliationView />}
            {currentView === 'payments' && <PaymentsView />}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'users' && <UsersView />}
            {currentView === 'settings' && <SettingsView />}
            {currentView === 'audit' && <AuditLogsView />}
          </div>
        </main>
      </div>
    </div>
  );
};
