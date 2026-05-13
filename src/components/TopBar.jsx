import React from 'react';
import { Menu, Building2 } from 'lucide-react';
import useAppStore from '../store/useAppStore';

export default function TopBar() {
  const { toggleSidebar } = useAppStore();

  return (
    <header style={{
      height: 56,
      background: 'white',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 32px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        style={{
          display: 'none', background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--navy)', marginRight: 'auto',
        }}
        className="menu-toggle"
      >
        <Menu size={20} />
      </button>

      {/* Entity badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
        borderRadius: 8, padding: '6px 12px',
      }}>
        <Building2 size={14} color="var(--green)" />
        <div>
          <div style={{ fontSize: 8, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Entity Identity
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em' }}>
            VERIFIED CORP
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .menu-toggle { display: flex !important; }
          header { padding: 0 16px !important; }
        }
      `}</style>
    </header>
  );
}
