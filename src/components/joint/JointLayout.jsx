import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Wallet, Users, Lock, FileText, LogOut, X, Menu, Package, BookOpen, User } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import ContactButton from '../ContactButton';

const navItems = [
  { to:'/joint/portfolio',   icon:BarChart3, label:'Asset Portfolio' },
  { to:'/joint/cash',        icon:Wallet,    label:'Cash Account' },
  { to:'/joint/access',      icon:Lock,      label:'Access Control' },
  { to:'/joint/statements',  icon:FileText,  label:'Joint Statements' },
  { to:'/joint/ledger',      icon:BookOpen,  label:'Ledger' },
  { to:'/joint/products',    icon:Package,   label:'Products' },
  { to:'/joint/profile',      icon:User,      label:'My Profile' },
];

export default function JointLayout() {
  const { sidebarOpen, toggleSidebar, closeSidebar, logout, user } = useAppStore();
  const navigate = useNavigate();
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {sidebarOpen && <div onClick={closeSidebar} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:40,display:'none' }} className="mob-overlay" />}
      <aside className={`jnt-sidebar ${sidebarOpen?'sidebar-open':''}`} style={{ width:220,minHeight:'100vh',background:'var(--navy)',display:'flex',flexDirection:'column',position:'fixed',left:0,top:0,bottom:0,zIndex:50,transition:'transform 0.3s ease' }}>
        <div style={{ padding:'24px 20px 18px',borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:17,color:'var(--gold)',letterSpacing:'0.1em' }}>PRODIGY</div>
              <div style={{ fontSize:8,letterSpacing:'0.18em',color:'rgba(255,255,255,0.35)',textTransform:'uppercase' }}>WEALTH MANAGEMENT</div>
            </div>
            <button onClick={closeSidebar} className="sidebar-close" style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',display:'none' }}><X size={16}/></button>
          </div>
        </div>
        <nav style={{ flex:1,padding:'14px 12px',display:'flex',flexDirection:'column',gap:3 }}>
          {navItems.map(({to,icon:Icon,label})=>(
            <NavLink key={to} to={to} onClick={closeSidebar} style={({isActive})=>({
              display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,
              textDecoration:'none',background:isActive?'var(--gold)':'transparent',
              color:isActive?'var(--navy)':'rgba(255,255,255,0.55)',
              fontFamily:'DM Sans,sans-serif',fontSize:11,fontWeight:isActive?700:400,
              letterSpacing:'0.04em',textTransform:'uppercase',transition:'all 0.2s',
            })}><Icon size={13} strokeWidth={1.8}/>{label}</NavLink>
          ))}
        </nav>
        {/* Joint user badge */}
        <div style={{ padding:'14px 16px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:'var(--navy)',flexShrink:0 }}>
            {(user?.name||'A').charAt(0)}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:10,fontWeight:700,color:'white',fontFamily:'Syne,sans-serif',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{user?.name||'Awobajo Lanre Daniel'}</div>
            <div style={{ fontSize:9,color:'var(--gold)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Joint Verified</div>
          </div>
          <button onClick={()=>{logout();navigate('/');}} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}
          ><LogOut size={14}/></button>
        </div>
      </aside>

      <div className="jnt-content">
        <header style={{ height:52,background:'white',borderBottom:'1px solid var(--gray-200)',display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 28px',gap:12,position:'sticky',top:0,zIndex:30 }}>
          <button onClick={toggleSidebar} className="menu-toggle" style={{ display:'none',background:'none',border:'none',cursor:'pointer',color:'var(--navy)',marginRight:'auto' }}><Menu size={20}/></button>
          <div style={{ display:'flex',alignItems:'center',gap:8,background:'var(--gray-50)',border:'1px solid var(--gray-200)',borderRadius:8,padding:'5px 10px' }}>
            <div style={{ width:20,height:20,borderRadius:4,background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontSize:10,color:'var(--gold)',fontFamily:'Syne,sans-serif',fontWeight:800 }}>P</span>
            </div>
            <div>
              <div style={{ fontSize:8,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Client Access ID</div>
              <div style={{ fontSize:11,fontWeight:700,color:'var(--navy)',fontFamily:'Syne,sans-serif' }}>{user?.clientId||'JNT-2764'}</div>
            </div>
          </div>
        </header>
        <main style={{ flex:1,padding:'28px 32px',background:'var(--gray-50)',overflowY:'auto',minHeight:'calc(100vh - 52px)' }}>
          <Outlet />
        </main>
      </div>
      <style>{`
        .jnt-sidebar{transform:translateX(0);}
        .jnt-content{flex:1;margin-left:220px;display:flex;flex-direction:column;min-height:100vh;}
        @media(max-width:768px){
          .jnt-sidebar{transform:translateX(-100%)!important;width:220px!important;}
          .jnt-sidebar.sidebar-open{transform:translateX(0)!important;}
          .sidebar-close{display:flex!important;align-items:center;}
          .mob-overlay{display:block!important;}
          .jnt-content{margin-left:0!important;}
          .menu-toggle{display:flex!important;}
          main{padding:20px 16px!important;}
        }
      `}</style>
      <ContactButton/>
    </div>
  );
}
