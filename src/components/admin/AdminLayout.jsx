import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CheckSquare, TrendingUp,
  CreditCard, FileText, ShieldAlert, Clock,
  Settings, LogOut, X, Menu, ChevronDown
} from 'lucide-react';
import useAppStore, { ADMIN_PERMISSIONS } from '../../store/useAppStore';

const ALL_NAV = [
  { to:'/admin',                   icon:LayoutDashboard, label:'Overview',          key:'all',              end:true },
  { to:'/admin/clients',           icon:Users,           label:'Client Management', key:'clients' },
  { to:'/admin/approvals',         icon:CheckSquare,     label:'Approvals Queue',   key:'approvals' },
  { to:'/admin/plans',             icon:TrendingUp,      label:'Investment Plans',   key:'plans' },
  { to:'/admin/transactions',      icon:CreditCard,      label:'Transaction Ledger', key:'transactions' },
  { to:'/admin/loans',             icon:Users,           label:'Staff Loans',        key:'loans' },
  { to:'/admin/risk',              icon:ShieldAlert,     label:'Risk & Compliance',  key:'kyc' },
  { to:'/admin/audit',             icon:Clock,           label:'Audit Trail',        key:'audit_trail' },
  { to:'/admin/reports',           icon:FileText,        label:'Reports',            key:'reports' },
  { to:'/admin/users',             icon:Settings,        label:'User Management',    key:'all' },
];

const ROLE_LABELS = {
  super_admin: 'Super Admin', operations: 'Head of Operations',
  compliance: 'Compliance', finance: 'Finance Manager',
  audit: 'Audit Officer', investment: 'Investment Manager',
};
const ROLE_COLORS = {
  super_admin:'#ef4444', operations:'#3b82f6', compliance:'#8b5cf6',
  finance:'#22c55e', audit:'#f97316', investment:'#e8b84b',
};

export default function AdminLayout() {
  const { user, sidebarOpen, toggleSidebar, closeSidebar, logout } = useAppStore();
  const navigate = useNavigate();
  const perms = ADMIN_PERMISSIONS[user?.adminRole] || [];
  const hasAccess = (key) => perms.includes('all') || perms.includes(key) || perms.includes(key+'_readonly');
  const visibleNav = ALL_NAV.filter(n => hasAccess(n.key));

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {sidebarOpen && (
        <div onClick={closeSidebar} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:40 }} />
      )}

      {/* Sidebar */}
      <aside className={`adm-sidebar ${sidebarOpen?'sidebar-open':''}`} style={{
        width:230, minHeight:'100vh', background:'#0a1628',
        display:'flex', flexDirection:'column',
        position:'fixed', left:0, top:0, bottom:0, zIndex:50,
        transition:'transform 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16, color:'var(--gold)', letterSpacing:'0.12em' }}>PRODIGY</div>
              <div style={{ fontSize:8, letterSpacing:'0.18em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', marginTop:1 }}>ADMIN CONSOLE</div>
            </div>
            <button onClick={closeSidebar} className="adm-close-btn" style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',display:'none' }}><X size={16}/></button>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: ROLE_COLORS[user?.adminRole]||'#ccc', flexShrink:0 }} />
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
              {ROLE_LABELS[user?.adminRole] || 'Administrator'}
            </span>
          </div>
          <div style={{ fontSize:12, fontWeight:600, color:'white', marginTop:4 }}>{user?.name}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          {visibleNav.map(({ to, icon:Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={closeSidebar} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8,
              textDecoration:'none',
              background: isActive ? 'rgba(232,184,75,0.15)' : 'transparent',
              color: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
              fontFamily:'DM Sans,sans-serif', fontSize:11.5, fontWeight: isActive ? 700 : 400,
              letterSpacing:'0.03em', transition:'all 0.2s',
              borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
            })}>
              <Icon size={14} strokeWidth={1.8} />{label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => { logout(); navigate('/'); }} style={{
            display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8,
            width:'100%', background:'none', border:'none', cursor:'pointer',
            color:'rgba(255,255,255,0.35)', fontSize:11.5, fontFamily:'DM Sans,sans-serif',
            letterSpacing:'0.03em', transition:'color 0.2s',
          }}
            onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.35)'}
          ><LogOut size={14} strokeWidth={1.8} /> Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="adm-content">
        {/* Top bar */}
        <header style={{
          height:56, background:'white', borderBottom:'1px solid var(--gray-200)',
          display:'flex', alignItems:'center', padding:'0 28px', gap:16,
          position:'sticky', top:0, zIndex:30,
        }}>
          <button onClick={toggleSidebar} className="adm-menu-btn" style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:'var(--navy)' }}>
            <Menu size={20}/>
          </button>

          <div style={{ flex:1 }}>
            <span style={{ fontSize:11, color:'var(--gray-400)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
              Prodigy Admin Console · {ROLE_LABELS[user?.adminRole] || 'Administrator'}
            </span>
          </div>

          {/* Pending badge */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'6px 12px', cursor:'pointer' }}
            onClick={() => navigate('/admin/approvals')}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)', animation:'pulse 2s infinite' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'var(--red)' }}>4 Pending Approvals</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--gray-50)', border:'1px solid var(--gray-200)', borderRadius:8, padding:'6px 12px' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:ROLE_COLORS[user?.adminRole]||'#ccc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white', fontFamily:'Syne,sans-serif' }}>
              {(user?.name||'A').charAt(0)}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--navy)' }}>{user?.name}</div>
              <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.06em', textTransform:'uppercase' }}>{ROLE_LABELS[user?.adminRole]}</div>
            </div>
          </div>
        </header>

        <main style={{ flex:1, padding:'28px 32px', background:'#f4f6fa', minHeight:'calc(100vh - 56px)', overflowY:'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .adm-sidebar { transform: translateX(0); }
        .adm-content { flex:1; margin-left:230px; display:flex; flex-direction:column; min-height:100vh; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media(max-width:768px) {
          .adm-sidebar { transform: translateX(-100%) !important; width:230px !important; }
          .adm-sidebar.sidebar-open { transform: translateX(0) !important; }
          .adm-close-btn { display: flex !important; align-items: center; }
          .adm-content { margin-left: 0 !important; }
          .adm-menu-btn { display: flex !important; }
          main { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  );
}
