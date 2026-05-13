import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="dashboard-content">
        <TopBar />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
      <style>{`
        .dashboard-content {
          flex: 1;
          margin-left: 220px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          transition: margin-left 0.3s;
        }
        .dashboard-main {
          flex: 1;
          padding: 28px 32px;
          background: var(--gray-50);
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .dashboard-content { margin-left: 0 !important; }
          .dashboard-main { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  );
}
