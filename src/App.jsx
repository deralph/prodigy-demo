import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './store/useAppStore';

// Onboarding
import OnboardingLogin from './pages/onboarding/OnboardingLogin';

// Landing + old auth pages
import Landing  from './pages/Landing';
import Login    from './pages/Login';
import Register from './pages/Register';

// Corporate layout + pages
import CorporateLayout from './components/corporate/CorporateLayout';
import Treasury    from './pages/corporate/Treasury';
import Wallet      from './pages/corporate/Wallet';
import StaffLoans  from './pages/corporate/StaffLoans';
import Audit       from './pages/corporate/Audit';
import KYC         from './pages/corporate/KYC';
import Reports     from './pages/corporate/Reports';
import RiskStrategy from './pages/corporate/RiskStrategy';

// Individual layout + pages
import IndividualLayout  from './components/individual/IndividualLayout';
import AssetPortfolio    from './pages/individual/AssetPortfolio';
import CashAccount       from './pages/individual/CashAccount';
import PersonalGoals     from './pages/individual/PersonalGoals';
import SecurityVault     from './pages/individual/SecurityVault';
import ActivityLog       from './pages/individual/ActivityLog';

// Joint layout + pages
import JointLayout     from './components/joint/JointLayout';
import JointPortfolio  from './pages/joint/JointPortfolio';
import JointCash       from './pages/joint/JointCash';
import SharedLegacy    from './pages/joint/SharedLegacy';
import AccessControl   from './pages/joint/AccessControl';
import JointStatements from './pages/joint/JointStatements';

// Admin layout + pages
import AdminLayout        from './components/admin/AdminLayout';
import AdminOverview      from './pages/admin/AdminOverview';
import ClientManagement   from './pages/admin/ClientManagement';
import ApprovalsQueue     from './pages/admin/ApprovalsQueue';
import InvestmentPlans    from './pages/admin/InvestmentPlans';
import TransactionLedger  from './pages/admin/TransactionLedger';
import StaffLoansAdmin    from './pages/admin/StaffLoansAdmin';
import RiskCompliance     from './pages/admin/RiskCompliance';
import AuditTrail         from './pages/admin/AuditTrail';
import AdminReports       from './pages/admin/AdminReports';
import UserManagement     from './pages/admin/UserManagement';

/* ── Role-based protected route ─────────────────────────── */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<OnboardingLogin />} />
        <Route path="/register" element={<Register />} />

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
        </Route>

        {/* Individual */}
        <Route path="/individual" element={<ProtectedRoute allowedRoles={['individual']}><IndividualLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="portfolio" replace />} />
          <Route path="portfolio" element={<AssetPortfolio />} />
          <Route path="cash"      element={<CashAccount />} />
          <Route path="goals"     element={<PersonalGoals />} />
          <Route path="vault"     element={<SecurityVault />} />
          <Route path="activity"  element={<ActivityLog />} />
        </Route>

        {/* Joint */}
        <Route path="/joint" element={<ProtectedRoute allowedRoles={['joint']}><JointLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="portfolio" replace />} />
          <Route path="portfolio"   element={<JointPortfolio />} />
          <Route path="cash"        element={<JointCash />} />
          <Route path="legacy"      element={<SharedLegacy />} />
          <Route path="access"      element={<AccessControl />} />
          <Route path="statements"  element={<JointStatements />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="clients"      element={<ClientManagement />} />
          <Route path="approvals"    element={<ApprovalsQueue />} />
          <Route path="plans"        element={<InvestmentPlans />} />
          <Route path="transactions" element={<TransactionLedger />} />
          <Route path="loans"        element={<StaffLoansAdmin />} />
          <Route path="risk"         element={<RiskCompliance />} />
          <Route path="audit"        element={<AuditTrail />} />
          <Route path="reports"      element={<AdminReports />} />
          <Route path="users"        element={<UserManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
