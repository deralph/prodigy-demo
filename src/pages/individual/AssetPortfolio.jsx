import React, { useState } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const allocations = [
  { name:'Prodigy Apex',       rate:'18% ROI',    risk:'LOW',     riskC:'#22c55e', balance:'₦50,000,000',   weight:'26.6%', dot:'#22c55e' },
  { name:'Prodigy Flex-Tenure',rate:'15-25% ROI', risk:'LOW',     riskC:'#22c55e', balance:'₦12,500,000',   weight:'6.7%',  dot:'#f97316' },
  { name:'Prodigy Genesis',    rate:'30% ROI',    risk:'MEDIUM',  riskC:'#f97316', balance:'₦100,000,000',  weight:'53.2%', dot:'#ec4899' },
  { name:'Prodigy Liquidity',  rate:'17% ROI',    risk:'LOW',     riskC:'#22c55e', balance:'₦25,450,670',   weight:'13.5%', dot:'#0d1b35' },
];

export default function AssetPortfolio() {
  const [roiOpen, setRoiOpen] = useState(false);
  return (
    <div>
      <PageHeader title="Asset Portfolio" subtitle="Infrastructure Access: Premium Tier" />
      {/* Growth Monitor */}
      <div style={{ background:'var(--navy)', borderRadius:14, padding:'24px 28px', marginBottom:24, position:'relative', overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-30,right:-30,width:140,height:140,borderRadius:'50%',background:'rgba(232,184,75,0.06)',pointerEvents:'none' }} />
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div>
            <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:5 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:'pulse 2s infinite' }} /> Asset Growth Monitor
            </p>
            <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,4vw,38px)',color:'white',letterSpacing:'-0.01em',marginBottom:6 }}>₦25,450,670.24</h2>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',gap:5 }}>
              <TrendingUp size={12} color="var(--green)" />
              <span style={{ color:'var(--green)',fontWeight:600 }}>23.4% Aggregate Performance</span>
            </p>
          </div>
          <div style={{ display:'flex',gap:10,alignItems:'center' }}>
            <button style={{ background:'white',color:'var(--navy)',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,border:'none',borderRadius:8,padding:'10px 20px',cursor:'pointer' }}>INVEST</button>
            <button className="btn-gold" style={{ fontSize:12,padding:'10px 20px' }}>WITHDRAW</button>
          </div>
        </div>
      </div>

      {/* Allocation table */}
      <div className="card animate-in delay-2" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 22px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Private Allocation</h3>
          <button onClick={() => setRoiOpen(!roiOpen)} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(34,197,94,0.1)',color:'var(--green)',border:'none',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.08em' }}>
            ROI Analysis: ACTIVE <ChevronDown size={12} style={{ transform:roiOpen?'rotate(180deg)':'none',transition:'transform 0.2s' }} />
          </button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--gray-50)' }}>
                {['Instrument','Rate','Risk','Current Balance','Weight'].map(h=>(
                  <th key={h} style={{ padding:'10px 18px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allocations.map(a => (
                <tr key={a.name} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--gray-50)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <span style={{ width:8,height:8,borderRadius:'50%',background:a.dot,display:'inline-block' }} />
                      <span style={{ fontSize:13,fontWeight:600,color:'var(--navy)' }}>{a.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'14px 18px' }}><span style={{ fontSize:12,fontWeight:700,color:'var(--green)' }}>{a.rate}</span></td>
                  <td style={{ padding:'14px 18px' }}><span style={{ fontSize:10,fontWeight:700,color:a.riskC,background:`${a.riskC}18`,padding:'3px 8px',borderRadius:4,letterSpacing:'0.06em' }}>{a.risk}</span></td>
                  <td style={{ padding:'14px 18px',fontSize:13,color:'var(--navy)',fontWeight:500 }}>{a.balance}</td>
                  <td style={{ padding:'14px 18px',fontSize:13,color:'var(--gray-600)' }}>{a.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
