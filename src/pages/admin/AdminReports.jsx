import React, { useState } from 'react';
import { Download, FileBarChart, FileText, FileCheck, CreditCard, Eye, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import useAppStore from '../../store/useAppStore';

const pieData = [
  { name:'Corporate', value:75000000, color:'#3b82f6' },
  { name:'Individual', value:25450670, color:'#22c55e' },
  { name:'Joint', value:8750000, color:'#8b5cf6' },
];
const barData = [
  { month:'Jan', aum:80 }, { month:'Feb', aum:92 }, { month:'Mar', aum:105 },
  { month:'Apr', aum:109 }, { month:'May', aum:0 }, { month:'Jun', aum:0 },
];

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

export default function AdminReports() {
  const { plans, clientInvestments, allTransactions } = useAppStore();
  const [viewProduct, setViewProduct] = useState(null);

  const productStats = plans.map(p => {
    const invs = clientInvestments.filter(i => i.planId === p.id);
    const txns = allTransactions.filter(t => t.planId === p.id && t.status === 'successful');
    return {
      ...p,
      investorCount: [...new Set(invs.map(i=>i.clientId))].length,
      totalInvested: invs.reduce((s,i)=>s+i.amount,0),
      activeCount: invs.filter(i=>i.status==='active').length,
      txnVolume: txns.reduce((s,t)=>s+t.amount,0),
      investments: invs,
    };
  }).filter(p => p.totalInvested > 0);

  const exportProduct = (p) => {
    const rows = p.investments.map(i => `"${i.client}","${i.plan}","${i.amount}","${i.tenor}","${i.valueDate}","${i.maturityDate}","${i.roi}%","${i.tax}%","${i.status}"`).join('\n');
    const blob = new Blob(['Client,Product,Amount,Tenor,Value Date,Maturity,ROI,Tax,Status\n'+rows],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`${p.name.replace(/\s/g,'_')}_report.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Report Center</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Reports per product — track investments, ratings & best sellers</p>
      </div>

      {/* Charts row */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:22,marginBottom:22 }}>
        <div style={{ background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid var(--gray-200)' }} className="animate-in delay-1">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:16 }}>AUM by Client Type</h3>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'center' }}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={0}>
                  {pieData.map((_,i)=><Cell key={i} fill={pieData[i].color}/>)}
                </Pie>
                <Tooltip formatter={v=>`₦${(v/1000000).toFixed(1)}M`}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {pieData.map(p=>(
                <div key={p.name} style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0 }}/>
                  <span style={{ fontSize:11,color:'var(--gray-600)',flex:1 }}>{p.name}</span>
                  <span style={{ fontSize:11,fontWeight:700,color:'var(--navy)' }}>₦{(p.value/1000000).toFixed(1)}M</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid var(--gray-200)' }} className="animate-in delay-2">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:16 }}>AUM Growth (₦M)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{ fontSize:11 }}/>
              <YAxis tick={{ fontSize:11 }}/>
              <Tooltip formatter={v=>`₦${v}M`}/>
              <Bar dataKey="aum" fill="var(--navy)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-product report cards */}
      <div style={{ marginBottom:10 }} className="animate-in delay-3">
        <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:16 }}>Reports by Investment Product</h3>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16 }}>
          {productStats.map(p=>(
            <div key={p.id} style={{ background:'white',borderRadius:14,border:`1px solid var(--gray-200)`,overflow:'hidden',transition:'all 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 4px 20px ${p.color}22`}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
            >
              <div style={{ height:5,background:p.color }}/>
              <div style={{ padding:'18px 20px' }}>
                <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14 }}>
                  <div>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)',marginBottom:3 }}>{p.name}</div>
                    <div style={{ fontSize:11,color:p.color,fontWeight:700 }}>{p.roi}</div>
                  </div>
                  <div style={{ fontSize:10,fontWeight:700,color:p.color,background:`${p.color}15`,padding:'4px 9px',borderRadius:6,letterSpacing:'0.06em' }}>
                    {p.lockIn}
                  </div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14 }}>
                  {[
                    ['Investors', p.investorCount],
                    ['Active',    p.activeCount],
                    ['Total AUM', fmt(p.totalInvested)],
                    ['Tax Rate',  `${p.taxRate}%`],
                  ].map(([l,v])=>(
                    <div key={l} style={{ background:'var(--gray-50)',borderRadius:8,padding:'9px 11px' }}>
                      <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:3 }}>{l}</div>
                      <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  <button onClick={()=>setViewProduct(p)} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'9px',background:`${p.color}12`,border:`1px solid ${p.color}30`,borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,color:p.color,fontFamily:'Syne,sans-serif' }}>
                    <Eye size={12}/> VIEW
                  </button>
                  <button onClick={()=>exportProduct(p)} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'9px',background:'white',border:'1px solid var(--gray-200)',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--gray-600)',fontFamily:'Syne,sans-serif' }}>
                    <Download size={12}/> EXPORT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standard reports */}
      <div style={{ background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid var(--gray-200)',marginTop:22 }} className="animate-in delay-4">
        <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:16 }}>Standard Reports</h3>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12 }}>
          {[
            { icon:FileBarChart, title:'Consolidated Portfolio',   desc:'Full capital deployment records', color:'#3b82f6' },
            { icon:FileText,     title:'Subscriptions Ledger',    desc:'All initial investments',          color:'#22c55e' },
            { icon:FileCheck,    title:'Redemption Analytics',    desc:'Full exit cycle documentation',    color:'#f97316' },
            { icon:CreditCard,   title:'Tax Compliance Ledger',   desc:'Tax documentation per client',     color:'#8b5cf6' },
            { icon:FileText,     title:'Client Onboarding',       desc:'All clients & KYC status',         color:'#ec4899' },
            { icon:FileBarChart, title:'Risk Assessment',         desc:'Portfolio risk categorization',     color:'#e8b84b' },
          ].map(r=>(
            <div key={r.title} style={{ border:'1px solid var(--gray-200)',borderRadius:10,padding:'14px',cursor:'pointer',transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=r.color;e.currentTarget.style.background=`${r.color}06`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--gray-200)';e.currentTarget.style.background='transparent';}}
            >
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9 }}>
                <r.icon size={16} color={r.color}/>
                <Download size={12} color="var(--gray-400)"/>
              </div>
              <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)',marginBottom:3,lineHeight:1.4 }}>{r.title}</div>
              <div style={{ fontSize:10,color:'var(--gray-400)',lineHeight:1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Product View Modal */}
      {viewProduct && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setViewProduct(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:720,maxHeight:'85vh',overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',display:'flex',flexDirection:'column' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'18px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
              <div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white' }}>{viewProduct.name}</div>
                <div style={{ fontSize:11,color:viewProduct.color,marginTop:2 }}>{viewProduct.roi} · {viewProduct.lockIn}</div>
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={()=>exportProduct(viewProduct)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:`${viewProduct.color}22`,border:`1px solid ${viewProduct.color}44`,borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:viewProduct.color }}>
                  <Download size={12}/> Export
                </button>
                <button onClick={()=>setViewProduct(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
              </div>
            </div>
            <div style={{ padding:'20px 24px',overflowY:'auto',flex:1 }}>
              {viewProduct.investments.length === 0 ? (
                <p style={{ color:'var(--gray-400)',textAlign:'center',padding:'40px 0' }}>No investment bookings yet for this product</p>
              ) : (
                <table style={{ width:'100%',borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'#f4f6fa' }}>
                    {['Client','Amount','Tenor','Value Date','Maturity','ROI','Tax','Status'].map(h=>(
                      <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {viewProduct.investments.map(i=>(
                      <tr key={i.id} style={{ borderTop:'1px solid var(--gray-100)' }}>
                        <td style={{ padding:'11px 14px',fontSize:12,fontWeight:600,color:'var(--navy)' }}>{i.client}</td>
                        <td style={{ padding:'11px 14px',fontSize:12,fontWeight:700,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(i.amount)}</td>
                        <td style={{ padding:'11px 14px',fontSize:11,color:'var(--gray-600)' }}>{i.tenor}</td>
                        <td style={{ padding:'11px 14px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{i.valueDate}</td>
                        <td style={{ padding:'11px 14px',fontSize:11,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{i.maturityDate}</td>
                        <td style={{ padding:'11px 14px',fontSize:11,color:'var(--green)',fontWeight:600 }}>{i.roi}%</td>
                        <td style={{ padding:'11px 14px',fontSize:11,color:'var(--gray-600)' }}>{i.tax}%</td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'capitalize',color:i.status==='active'?'var(--green)':i.status==='matured'?'#3b82f6':i.status==='pre_term'?'var(--gold)':'var(--gray-400)',background:i.status==='active'?'rgba(34,197,94,0.1)':i.status==='matured'?'rgba(59,130,246,0.1)':i.status==='pre_term'?'rgba(232,184,75,0.12)':'var(--gray-100)',padding:'3px 8px',borderRadius:4 }}>{i.status.replace('_',' ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@media(max-width:700px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}} @keyframes modalIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
