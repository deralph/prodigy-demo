import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Users, ShieldCheck, Globe, FileText, TrendingUp, LogOut, X, Menu, Package, BookOpen } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const navItems = [
  { to:'/corporate/treasury',    icon:LayoutDashboard, label:'Treasury Dash' },
  { to:'/corporate/wallet',      icon:Wallet,          label:'Fund Wallet' },
  { to:'/corporate/staff-loans', icon:Users,           label:'Staff Loan Hub' },
  { to:'/corporate/audit',       icon:ShieldCheck,     label:'Audit & Mandate' },
  { to:'/corporate/kyc',         icon:Globe,           label:'KYC & Registry' },
  { to:'/corporate/reports',     icon:FileText,        label:'Report Center' },
  { to:'/corporate/risk',        icon:TrendingUp,      label:'Risk Strategy' },
  { to:'/corporate/ledger',      icon:BookOpen,        label:'Ledger' },
  { to:'/corporate/products',    icon:Package,         label:'Products' },
];

export default function CorporateSidebar() {
  const { sidebarOpen, closeSidebar, logout } = useAppStore();
  const navigate = useNavigate();
  return (
    <>
      {sidebarOpen && <div onClick={closeSidebar} className="mobile-overlay overlay-visible" style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:40,display:'none' }} />}
      <aside className={`sidebar ${sidebarOpen?'sidebar-open':''}`} style={{ width:220,minHeight:'100vh',background:'var(--navy)',display:'flex',flexDirection:'column',position:'fixed',left:0,top:0,bottom:0,zIndex:50,transition:'transform 0.3s ease',flexShrink:0 }}>
        <div style={{ padding:'24px 20px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:17,color:'var(--gold)',letterSpacing:'0.12em' }}>PRODIGY</div>
              <div style={{ fontSize:8,letterSpacing:'0.18em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',marginTop:1 }}>CORPORATE SYSTEM</div>
            </div>
            <button onClick={closeSidebar} className="sidebar-close" style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer' }}><X size={16} /></button>
          </div>
        </div>
        <nav style={{ flex:1,padding:'14px 12px',display:'flex',flexDirection:'column',gap:3 }}>
          {navItems.map(({ to, icon:Icon, label }) => (
            <NavLink key={to} to={to} onClick={closeSidebar} style={({ isActive }) => ({
              display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,
              textDecoration:'none',background:isActive?'var(--gold)':'transparent',
              color:isActive?'var(--navy)':'rgba(255,255,255,0.55)',
              fontFamily:'DM Sans,sans-serif',fontSize:11,fontWeight:isActive?700:400,
              letterSpacing:'0.04em',textTransform:'uppercase',transition:'all 0.2s',
            })}>
              <Icon size={13} strokeWidth={1.8} />{label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding:'14px 12px',borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => { logout(); navigate('/'); }} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,width:'100%',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:11,fontFamily:'DM Sans,sans-serif',letterSpacing:'0.04em',textTransform:'uppercase',transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}
          ><LogOut size={13} strokeWidth={1.8} />Sign Out</button>
        </div>
      </aside>
      <style>{`
        .sidebar{transform:translateX(0);}
        .sidebar-close{display:none;}
        @media(max-width:768px){
          .sidebar{transform:translateX(-100%)!important;width:220px!important;}
          .sidebar.sidebar-open{transform:translateX(0)!important;}
          .sidebar-close{display:flex!important;align-items:center;}
          .mobile-overlay.overlay-visible{display:block!important;}
        }
      `}</style>
    </>
  );
}
