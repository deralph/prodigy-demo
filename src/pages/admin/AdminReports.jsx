import React from 'react';
import { Download, FileBarChart, FileText, FileCheck, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const pieData = [
  { name:'Corporate', value:75000000, color:'#3b82f6' },
  { name:'Individual', value:25450670, color:'#22c55e' },
  { name:'Joint', value:8750000, color:'#8b5cf6' },
];
const barData = [
  { month:'Jan', aum:80 }, { month:'Feb', aum:92 }, { month:'Mar', aum:105 },
  { month:'Apr', aum:109 }, { month:'May', aum:0 }, { month:'Jun', aum:0 },
];

export default function AdminReports() {
  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Reports & Analytics</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Portfolio intelligence and performance analytics</p>
      </div>

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

      <div style={{ background:'white',borderRadius:14,padding:'20px 22px',border:'1px solid var(--gray-200)' }} className="animate-in delay-3">
        <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:20 }}>Standard Corporate Reports</h3>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14 }}>
          {[
            { icon:FileBarChart, title:'Consolidated Portfolio Summary',  desc:'Complete portfolio capital deployment records', color:'#3b82f6' },
            { icon:FileText,     title:'Initial Subscriptions Ledger',    desc:'Complete initial capital deployment records',  color:'#22c55e' },
            { icon:FileCheck,    title:'Redemption & Exit Analytics',     desc:'Full exit cycle documentation',               color:'#f97316' },
            { icon:CreditCard,   title:'Tax Compliance & Credit Ledger',  desc:'Tax compliance documentation',                color:'#8b5cf6' },
            { icon:FileText,     title:'Client Onboarding Report',        desc:'All onboarded clients and KYC status',        color:'#ec4899' },
            { icon:FileBarChart, title:'Risk Assessment Summary',         desc:'Portfolio risk categorization report',         color:'#e8b84b' },
          ].map(r=>(
            <div key={r.title} style={{ border:'1px solid var(--gray-200)',borderRadius:10,padding:'16px',cursor:'pointer',transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=r.color;e.currentTarget.style.background=`${r.color}06`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--gray-200)';e.currentTarget.style.background='transparent';}}
            >
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                <r.icon size={18} color={r.color}/>
                <Download size={13} color="var(--gray-400)"/>
              </div>
              <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)',marginBottom:4,lineHeight:1.4 }}>{r.title}</div>
              <div style={{ fontSize:10,color:'var(--gray-400)',lineHeight:1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:700px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
