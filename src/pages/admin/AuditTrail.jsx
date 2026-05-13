import React, { useState } from 'react';
import { Clock } from 'lucide-react';

const auditLog = [
  { id:'AUD-001', admin:'Super Administrator', action:'Approved KYC',          target:'Prodigy Holdings Ltd', time:'Apr 22, 2024 09:14', category:'kyc' },
  { id:'AUD-002', admin:'Compliance Officer',  action:'Flagged AML Alert',     target:'Heritage Global Inv.', time:'Apr 21, 2024 15:32', category:'compliance' },
  { id:'AUD-003', admin:'Finance Manager',     action:'Processed Redemption',  target:'₦2,000,000 — Corp Fund',time:'Apr 20, 2024 11:00', category:'finance' },
  { id:'AUD-004', admin:'Investment Manager',  action:'Updated Plan ROI',      target:'Prodigy Apex → 20%',  time:'Apr 19, 2024 14:22', category:'investment' },
  { id:'AUD-005', admin:'Head of Operations',  action:'Approved Subscription', target:'John Doe — Genesis',  time:'Apr 18, 2024 10:45', category:'operations' },
  { id:'AUD-006', admin:'Audit Officer',       action:'Generated Report',      target:'Q1 2024 Portfolio',   time:'Apr 15, 2024 16:00', category:'audit' },
  { id:'AUD-007', admin:'Super Administrator', action:'Created Admin Account', target:'investment@prodigy.ng',time:'Apr 10, 2024 09:00', category:'system' },
  { id:'AUD-008', admin:'Compliance Officer',  action:'Reviewed Document',     target:'Sunshine Ventures CAC',time:'Apr 08, 2024 12:30', category:'kyc' },
];

const catColor = { kyc:'#8b5cf6', compliance:'#ef4444', finance:'#22c55e', investment:'#e8b84b', operations:'#3b82f6', audit:'#f97316', system:'#0d1b35' };

export default function AuditTrail() {
  const [catFilter, setCatFilter] = useState('all');
  const filtered = catFilter==='all' ? auditLog : auditLog.filter(a=>a.category===catFilter);

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Audit Trail</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Complete activity log across all admins and users</p>
      </div>

      <div style={{ display:'flex',gap:8,marginBottom:18,flexWrap:'wrap' }} className="animate-in delay-1">
        {['all','kyc','compliance','finance','investment','operations','audit','system'].map(f=>(
          <button key={f} onClick={()=>setCatFilter(f)} style={{
            padding:'7px 14px',borderRadius:8,border:'none',cursor:'pointer',
            fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',
            background: catFilter===f ? (catColor[f]||'var(--navy)') : 'white',
            color: catFilter===f ? 'white' : 'var(--gray-400)',
            border: `1px solid ${catFilter===f?(catColor[f]||'var(--navy)'):'var(--gray-200)'}`,
            transition:'all 0.2s',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
        {filtered.map((a,i)=>(
          <div key={a.id} style={{ padding:'16px 22px',borderBottom:i<filtered.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14,transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <div style={{ width:8,height:8,borderRadius:'50%',background:catColor[a.category]||'var(--gray-400)',flexShrink:0 }} />
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3 }}>
                <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{a.action}</span>
                <span style={{ fontSize:9,fontWeight:700,color:catColor[a.category],background:`${catColor[a.category]}18`,padding:'2px 6px',borderRadius:3,letterSpacing:'0.08em',textTransform:'uppercase' }}>{a.category}</span>
              </div>
              <div style={{ fontSize:12,color:'var(--gray-600)',marginBottom:2 }}>{a.target}</div>
              <div style={{ fontSize:11,color:'var(--gray-400)' }}>By: <strong style={{ color:'var(--navy)' }}>{a.admin}</strong></div>
            </div>
            <div style={{ fontSize:11,color:'var(--gray-400)',flexShrink:0,textAlign:'right',display:'flex',alignItems:'center',gap:4 }}>
              <Clock size={11}/>{a.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
