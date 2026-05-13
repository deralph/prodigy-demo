import React from 'react';
import { TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function JointPortfolio() {
  return (
    <div>
      <PageHeader title="Asset Portfolio" subtitle="Infrastructure Access: Premium Tier" />
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'24px 28px',marginBottom:24 }} className="animate-in delay-1">
        <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:5 }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block' }} /> Asset Growth Monitor
        </p>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div>
            <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(24px,4vw,36px)',color:'white',letterSpacing:'-0.01em',marginBottom:6 }}>₦25,450,673.60</h2>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',gap:5 }}>
              <TrendingUp size={12} color="var(--green)" /><span style={{ color:'var(--green)',fontWeight:600 }}>23.4% Aggregate Performance</span>
            </p>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button style={{ background:'white',color:'var(--navy)',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,border:'none',borderRadius:8,padding:'10px 20px',cursor:'pointer' }}>INVEST</button>
            <button className="btn-gold" style={{ fontSize:12,padding:'10px 20px' }}>WITHDRAW</button>
          </div>
        </div>
      </div>
      <div className="card animate-in delay-2">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Shared Allocation</h3>
          <span style={{ background:'rgba(34,197,94,0.1)',color:'var(--green)',fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:6,letterSpacing:'0.08em' }}>ROI ANALYSIS: ACTIVE ▾</span>
        </div>
        <p style={{ fontSize:12,color:'var(--gray-400)',fontStyle:'italic' }}>Joint allocation data loading from shared mandate...</p>
      </div>
    </div>
  );
}
