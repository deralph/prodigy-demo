import React from 'react';
import { Outlet } from 'react-router-dom';
import CorporateSidebar from './CorporateSidebar';
import { Building2, Menu } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import ContactButton from '../ContactButton';

export default function CorporateLayout() {
  const { toggleSidebar, user } = useAppStore();
  return (
    <div style={{ display:'flex',minHeight:'100vh' }}>
      <CorporateSidebar />
      <div className="dashboard-content">
        <header style={{ height:56,background:'white',borderBottom:'1px solid var(--gray-200)',display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 32px',gap:16,position:'sticky',top:0,zIndex:30 }}>
          <button onClick={toggleSidebar} className="menu-toggle" style={{ display:'none',background:'none',border:'none',cursor:'pointer',color:'var(--navy)',marginRight:'auto' }}><Menu size={20}/></button>
          <div style={{ display:'flex',alignItems:'center',gap:8,background:'var(--gray-50)',border:'1px solid var(--gray-200)',borderRadius:8,padding:'6px 12px' }}>
            <Building2 size={13} color="var(--green)" />
            <div>
              <div style={{ fontSize:8,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Entity Identity</div>
              <div style={{ fontSize:11,fontWeight:700,color:'var(--navy)',fontFamily:'Syne,sans-serif',letterSpacing:'0.06em' }}>VERIFIED CORP</div>
            </div>
          </div>
        </header>
        <main className="dashboard-main"><Outlet /></main>
      </div>
      <style>{`
        .dashboard-content{flex:1;margin-left:220px;display:flex;flex-direction:column;min-height:100vh;transition:margin-left 0.3s;}
        .dashboard-main{flex:1;padding:28px 32px;background:var(--gray-50);overflow-y:auto;}
        @media(max-width:768px){.dashboard-content{margin-left:0!important;}.dashboard-main{padding:20px 16px!important;}.menu-toggle{display:flex!important;}}
      `}</style>
      <ContactButton/>
    </div>
  );
}
