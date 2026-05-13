import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Users, ShieldCheck,
  Globe, FileText, LogOut, X
} from 'lucide-react';
import useAppStore from '../store/useAppStore';

const navItems = [
  { to: '/dashboard/treasury', icon: LayoutDashboard, label: 'Treasury Dash' },
  { to: '/dashboard/wallet', icon: Wallet, label: 'Fund Wallet' },
  { to: '/dashboard/staff-loans', icon: Users, label: 'Staff Loan Hub' },
  { to: '/dashboard/audit', icon: ShieldCheck, label: 'Audit & Mandate' },
  { to: '/dashboard/kyc', icon: Globe, label: 'KYC & Registry' },
  { to: '/dashboard/reports', icon: FileText, label: 'Report Center' },
];

export default function Sidebar() {
  const { sidebarOpen, closeSidebar, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeSidebar();
  };

  return (
    <>
      {/* Mobile overlay — always in DOM, visibility controlled by CSS + opacity */}
      <div
        onClick={closeSidebar}
        className={`mobile-overlay ${sidebarOpen ? 'overlay-visible' : ''}`}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
          display: 'none',          /* hidden on desktop */
          pointerEvents: sidebarOpen ? 'all' : 'none',
        }}
      />

      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        style={{
          width: 220,
          minHeight: '100vh',
          background: 'var(--navy)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          /* NO inline transform — let CSS handle it per breakpoint */
          transition: 'transform 0.3s ease',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18,
                color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase'
              }}>PRODIGY</div>
              <div style={{
                fontSize: 8, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', marginTop: 2
              }}>CORPORATE SYSTEM</div>
            </div>
            <button
              onClick={closeSidebar}
              className="sidebar-close"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                textDecoration: 'none',
                background: isActive ? 'var(--gold)' : 'transparent',
                color: isActive ? 'var(--navy)' : 'rgba(255,255,255,0.55)',
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                fontWeight: isActive ? 700 : 400,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                transition: 'all 0.2s',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.querySelector('*')?.closest('.active')) {
                  // reset handled by NavLink style fn
                }
              }}
            >
              <Icon size={14} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: 12,
              fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.04em',
              textTransform: 'uppercase', transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <LogOut size={14} strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      </aside>

      <style>{`
        /* Desktop: sidebar always visible, no transform needed */
        .sidebar { transform: translateX(0); }

        .sidebar-close { display: none; }
        .mobile-overlay { display: none !important; }

        @media (max-width: 768px) {
          /* Hide sidebar off-screen by default on mobile */
          .sidebar {
            transform: translateX(-100%) !important;
            width: 220px !important;
          }
          /* Slide in when open */
          .sidebar.sidebar-open {
            transform: translateX(0) !important;
          }
          /* Show close button inside sidebar */
          .sidebar-close {
            display: flex !important;
            align-items: center;
          }
          /* Show overlay when sidebar is open */
          .mobile-overlay.overlay-visible {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
