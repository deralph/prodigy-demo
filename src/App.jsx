import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './store/useAppStore';
import { getTokens, authApi, clearTokens } from './services/api';
import LoadingOverlay from './components/ui/LoadingOverlay';

import OnboardingLogin from './pages/onboarding/OnboardingLogin';
import MagicLogin      from './pages/onboarding/MagicLogin';
import Landing  from './pages/Landing';
import AuditPortal from './pages/AuditPortal';

import CorporateLayout from './components/corporate/CorporateLayout';
import Treasury    from './pages/corporate/Treasury';
import Wallet      from './pages/corporate/Wallet';
import StaffLoans  from './pages/corporate/StaffLoans';
import Audit       from './pages/corporate/Audit';
import KYC         from './pages/corporate/KYC';
import Reports     from './pages/corporate/Reports';
import RiskStrategy from './pages/corporate/RiskStrategy';

import IndividualLayout  from './components/individual/IndividualLayout';
import AssetPortfolio    from './pages/individual/AssetPortfolio';
import CashAccount       from './pages/individual/CashAccount';
import SecurityVault     from './pages/individual/SecurityVault';
import ActivityLog       from './pages/individual/ActivityLog';

import JointLayout     from './components/joint/JointLayout';
import JointPortfolio  from './pages/joint/JointPortfolio';
import JointCash       from './pages/joint/JointCash';
import AccessControl   from './pages/joint/AccessControl';
import JointStatements from './pages/joint/JointStatements';
import SharedLegacy    from './pages/joint/SharedLegacy';

import AdminLayout           from './components/admin/AdminLayout';
import AdminOverview         from './pages/admin/AdminOverview';
import ClientManagement      from './pages/admin/ClientManagement';
import ApprovalHub           from './pages/admin/ApprovalHub';
import InvestmentPlans       from './pages/admin/InvestmentPlans';
import TransactionLedger     from './pages/admin/TransactionLedger';
import WithdrawalsQueue      from './pages/admin/WithdrawalsQueue';
import StaffLoansAdmin       from './pages/admin/StaffLoansAdmin';
import RiskCompliance        from './pages/admin/RiskCompliance';
import AuditTrail            from './pages/admin/AuditTrail';
import AdminReports          from './pages/admin/AdminReports';
import UserManagement        from './pages/admin/UserManagement';
import PreTermination        from './pages/admin/PreTermination';
import ProductSetup          from './pages/admin/ProductSetup';
import InterestAccruals      from './pages/admin/InterestAccruals';
import FinanceQueue          from './pages/admin/FinanceQueue';
import Analytics             from './pages/admin/Analytics';
import ClientInvestments     from './pages/admin/ClientInvestments';

import Products       from './pages/shared/Products';
import ProductDetail  from './pages/shared/ProductDetail';
import Ledger         from './pages/shared/Ledger';
import ProfilePage    from './pages/shared/ProfilePage';

/* ── Role-based protected route ─────────────────────────── */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

/* ── Session restore on page load ───────────────────────── */
function SessionRestore() {
  const { isAuthenticated, login, fetchApiData } = useAppStore();
  useEffect(() => {
    const tokens = getTokens();
    if (!tokens?.accessToken) return;

    if (isAuthenticated) {
      // Store was pre-populated from localStorage — just trigger data load
      fetchApiData();
      return;
    }

    // Fallback: no cached user — fetch from backend
    authApi.getMe()
      .then(me => {
        if (me) {
          const c = me.client || {};
          login({
            ...me,
            name:           c.name           || me.adminUser?.name  || me.name  || me.email,
            clientId:       c.clientRef       || me.adminUser?.adminRef || me.clientId,
            role:           me.role,
            adminRole:      (me.adminUser?.role ?? me.adminRole ?? null)?.toLowerCase() ?? null,
            clientType:     c.type            ?? null,
            phone:          c.phone           ?? me.phone    ?? null,
            rcNumber:       c.rcNumber        ?? null,
            taxId:          c.taxId           ?? null,
            secondaryName:  c.secondaryName   ?? null,
            secondaryEmail: c.secondaryEmail  ?? null,
            mandateType:    c.mandateType      ?? null,
            client:         c,
          });
        }
      })
      .catch(() => { clearTokens(); localStorage.removeItem('prodigy_user'); });
  }, []);
  return null;
}

/* ── Data fetcher: loads API data when authenticated ─────── */
function DataFetcher() {
  const { isAuthenticated, fetchApiData } = useAppStore();
  useEffect(() => {
    if (isAuthenticated) {
      fetchApiData();
    }
  }, [isAuthenticated, fetchApiData]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LoadingOverlay />
      <SessionRestore />
      <DataFetcher />
      <Routes>
        {/* Public */}
        <Route path="/"            element={<Landing />} />
        <Route path="/login"       element={<OnboardingLogin />} />
        <Route path="/magic-login" element={<MagicLogin />} />
        <Route path="/audit-portal" element={<AuditPortal />} />

        {/* Corporate */}
        <Route path="/corporate" element={<ProtectedRoute allowedRoles={['corporate']}><CorporateLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="treasury" replace />} />
          <Route path="treasury"    element={<Treasury />} />
          <Route path="wallet"      element={<Wallet />} />
          <Route path="staff-loans" element={<StaffLoans />} />
          <Route path="audit"       element={<Audit />} />
          <Route path="kyc"         element={<KYC />} />
          <Route path="reports"     element={<Reports />} />
          <Route path="risk"        element={<RiskStrategy />} />
          <Route path="ledger"         element={<Ledger />} />
          <Route path="products"         element={<Products />} />
          <Route path="products/:id"     element={<ProductDetail />} />
          <Route path="profile"          element={<ProfilePage />} />
        </Route>

        {/* Individual */}
        <Route path="/individual" element={<ProtectedRoute allowedRoles={['individual']}><IndividualLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="portfolio" replace />} />
          <Route path="portfolio" element={<AssetPortfolio />} />
          <Route path="cash"      element={<CashAccount />} />
          <Route path="vault"     element={<SecurityVault />} />
          <Route path="activity"  element={<ActivityLog />} />
          <Route path="ledger"        element={<Ledger />} />
          <Route path="products"        element={<Products />} />
          <Route path="products/:id"    element={<ProductDetail />} />
          <Route path="profile"         element={<ProfilePage />} />
        </Route>

        {/* Joint */}
        <Route path="/joint" element={<ProtectedRoute allowedRoles={['joint']}><JointLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="portfolio" replace />} />
          <Route path="portfolio"   element={<JointPortfolio />} />
          <Route path="cash"        element={<JointCash />} />
          <Route path="access"      element={<AccessControl />} />
          <Route path="statements"  element={<JointStatements />} />
          <Route path="overview"    element={<SharedLegacy />} />
          <Route path="ledger"        element={<Ledger />} />
          <Route path="products"        element={<Products />} />
          <Route path="products/:id"    element={<ProductDetail />} />
          <Route path="profile"         element={<ProfilePage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index                     element={<AdminOverview />} />
          <Route path="clients"            element={<ClientManagement />} />
          <Route path="approvals"          element={<ApprovalHub />} />
          <Route path="plans"              element={<InvestmentPlans />} />
          <Route path="transactions"       element={<TransactionLedger />} />
          <Route path="withdrawals"        element={<WithdrawalsQueue />} />
          <Route path="loans"              element={<StaffLoansAdmin />} />
          <Route path="risk"               element={<RiskCompliance />} />
          <Route path="audit"              element={<AuditTrail />} />
          <Route path="reports"            element={<AdminReports />} />
          <Route path="users"              element={<UserManagement />} />
          <Route path="pretermination"     element={<PreTermination />} />
          <Route path="products"           element={<ProductSetup />} />
          <Route path="accruals"           element={<InterestAccruals />} />
          <Route path="finance-queue"      element={<FinanceQueue />} />
          <Route path="analytics"          element={<Analytics />} />
          <Route path="client-investments" element={<ClientInvestments />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
