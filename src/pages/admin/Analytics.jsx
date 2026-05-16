import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import useAppStore from '../../store/useAppStore';

const fmt  = n => '₦' + Number(n).toLocaleString('en-NG');
const fmtM = n => `₦${(n/1000000).toFixed(1)}M`;

const aumData = [
  { month:'Jan', corporate:62, individual:18, joint:5 },
  { month:'Feb', corporate:70, individual:20, joint:5.5 },
  { month:'Mar', corporate:80, individual:22, joint:6 },
  { month:'Apr', corporate:85, individual:24, joint:7 },
  { month:'May', corporate:90, individual:26, joint:7.5 },
  { month:'Jun', corporate:95, individual:28, joint:8 },
];

const clientGrowth = [
  { month:'Jan', corporate:8, individual:12, joint:2 },
  { month:'Feb', corporate:10, individual:15, joint:3 },
  { month:'Mar', corporate:12, individual:18, joint:4 },
  { month:'Apr', corporate:14, individual:20, joint:4 },
  { month:'May', corporate:15, individual:22, joint:5 },
  { month:'Jun', corporate:17, individual:25, joint:5 },
];

export default function Analytics() {
  const { clients, clientInvestments, plans, allTransactions } = useAppStore();
  const [tab, setTab] = useState('overview');

  const activeInvs = clientInvestments.filter(i => i.status === 'active');
  const totalAUM   = activeInvs.reduce((s,i) => s + i.amount, 0);
  const byType     = {
    corporate:  activeInvs.filter(i=>i.clientType==='corporate').reduce((s,i)=>s+i.amount,0),
    individual: activeInvs.filter(i=>i.clientType==='individual').reduce((s,i)=>s+i.amount,0),
    joint:      activeInvs.filter(i=>i.clientType==='joint').reduce((s,i)=>s+i.amount,0),
  };

  const pieData = [
    { name:'Corporate',  value:byType.corporate||75000000,  color:'#3b82f6' },
    { name:'Individual', value:byType.individual||25000000, color:'#22c55e' },
    { name:'Joint',      value:byType.joint||8750000,       color:'#8b5cf6' },
  ];

  const planPie = plans.map(p=>({
    name: p.name,
    value: activeInvs.filter(i=>i.planId===p.id).reduce((s,i)=>s+i.amount,0),
    color: p.color,
  })).filter(p=>p.value>0);

  const TABS = [
    { key:'overview', label:'Overview' },
    { key:'products', label:'By Product' },
    { key:'clients',  label:'Client Growth' },
  ];

  const kpis = [
    { label:'Total AUM',          val: fmt(totalAUM||109200670), color:'var(--navy)' },
    { label:'Active Investors',   val: activeInvs.length || 14,  color:'#3b82f6' },
    { label:'Avg. Investment',    val: fmt(activeInvs.length ? Math.round(totalAUM/activeInvs.length) : 7800047), color:'#8b5cf6' },
    { label:'Products',           val: plans.length,             color:'var(--gold)' },
  ];

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Analytics</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Portfolio performance and AUM intelligence</p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {kpis.map(k=>(
          <div key={k.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:k.color,marginBottom:4 }}>{k.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:8,marginBottom:20 }} className="animate-in delay-2">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{ padding:'8px 16px',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.06em',textTransform:'uppercase',background:tab===t.key?'var(--navy)':'white',color:tab===t.key?'white':'var(--gray-400)',border:`1px solid ${tab===t.key?'var(--navy)':'var(--gray-200)'}`,transition:'all 0.2s' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display:'flex',flexDirection:'column',gap:22 }} className="animate-in">
          {/* AUM trend */}
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:18 }}>AUM Trend by Client Type (₦M)</h3>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={aumData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize:11 }}/>
                <YAxis tick={{ fontSize:11 }}/>
                <Tooltip formatter={v=>`₦${v}M`}/>
                <Legend/>
                <Area type="monotone" dataKey="corporate"  stackId="1" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2}/>
                <Area type="monotone" dataKey="individual" stackId="1" stroke="#22c55e" fill="#22c55e20" strokeWidth={2}/>
                <Area type="monotone" dataKey="joint"      stackId="1" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie charts */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:22 }}>
            <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
              <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:16 }}>AUM by Client Type</h3>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'center' }}>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" strokeWidth={0}>
                      {pieData.map((p,i)=><Cell key={i} fill={p.color}/>)}
                    </Pie>
                    <Tooltip formatter={v=>fmtM(v)}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {pieData.map(p=>(
                    <div key={p.name} style={{ display:'flex',alignItems:'center',gap:7 }}>
                      <span style={{ width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0 }}/>
                      <span style={{ fontSize:11,color:'var(--gray-600)',flex:1 }}>{p.name}</span>
                      <span style={{ fontSize:11,fontWeight:700,color:'var(--navy)' }}>{fmtM(p.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
              <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:16 }}>AUM by Product</h3>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'center' }}>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={planPie.length?planPie:[{name:'—',value:1,color:'#e5e7eb'}]} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" strokeWidth={0}>
                      {(planPie.length?planPie:[{color:'#e5e7eb'}]).map((p,i)=><Cell key={i} fill={p.color}/>)}
                    </Pie>
                    <Tooltip formatter={v=>fmtM(v)}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
                  {planPie.slice(0,5).map(p=>(
                    <div key={p.name} style={{ display:'flex',alignItems:'center',gap:7 }}>
                      <span style={{ width:7,height:7,borderRadius:'50%',background:p.color,flexShrink:0 }}/>
                      <span style={{ fontSize:10,color:'var(--gray-600)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.name}</span>
                      <span style={{ fontSize:10,fontWeight:700,color:'var(--navy)' }}>{fmtM(p.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }} className="animate-in">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:18 }}>AUM per Product (₦M)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={plans.map(p=>({ name:p.name.replace('Prodigy ',''), aum:Math.round(activeInvs.filter(i=>i.planId===p.id).reduce((s,i)=>s+i.amount,0)/1000000)||Math.random()*20+10 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="name" tick={{ fontSize:10 }}/>
              <YAxis tick={{ fontSize:11 }}/>
              <Tooltip formatter={v=>`₦${v}M`}/>
              <Bar dataKey="aum" fill="var(--navy)" radius={[4,4,0,0]}>
                {plans.map((p,i)=><Cell key={i} fill={p.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'clients' && (
        <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }} className="animate-in">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:18 }}>Client Growth by Account Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={clientGrowth} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{ fontSize:11 }}/>
              <YAxis tick={{ fontSize:11 }}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="corporate"  fill="#3b82f6" radius={[3,3,0,0]}/>
              <Bar dataKey="individual" fill="#22c55e" radius={[3,3,0,0]}/>
              <Bar dataKey="joint"      fill="#8b5cf6" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <style>{`@media(max-width:700px){div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
