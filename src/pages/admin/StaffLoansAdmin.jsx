import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../../components/shared/StatusBadge';

const loans = [
  { id:'LOAN-001', employee:'Abiola Johnson', staffId:'PP-001', dept:'HR',      amount:150000,   tenor:'6 months',  status:'active',    company:'Prodigy Holdings Ltd', date:'Jan 10, 2024' },
  { id:'LOAN-002', employee:'Sarah Alabi',    staffId:'PP-002', dept:'Finance', amount:1000000,  tenor:'12 months', status:'active',    company:'Prodigy Holdings Ltd', date:'Feb 14, 2024' },
  { id:'LOAN-003', employee:'Emeka Okafor',   staffId:'PP-003', dept:'Tech',    amount:500000,   tenor:'6 months',  status:'settled',   company:'Prodigy Holdings Ltd', date:'Dec 01, 2023' },
  { id:'LOAN-004', employee:'Grace Idowu',    staffId:'PP-004', dept:'Ops',     amount:125000,   tenor:'3 months',  status:'terminated',company:'Prodigy Holdings Ltd', date:'Nov 15, 2023' },
];

const fmt = n => '₦' + Number(n).toLocaleString();

export default function StaffLoansAdmin() {
  const [data, setData] = useState(loans);
  const approve = id => setData(d => d.map(l => l.id===id?{...l,status:'active'}:l));
  const reject  = id => setData(d => d.map(l => l.id===id?{...l,status:'terminated'}:l));

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Staff Loans</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>All corporate staff loan applications</p>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Active Loans',    val:data.filter(l=>l.status==='active').length,    color:'var(--green)' },
          { label:'Total Disbursed', val:fmt(data.reduce((s,l)=>s+l.amount,0)),        color:'var(--navy)' },
          { label:'Settled',         val:data.filter(l=>l.status==='settled').length,   color:'#3b82f6' },
          { label:'Terminated',      val:data.filter(l=>l.status==='terminated').length,color:'var(--red)' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:s.color,marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f4f6fa' }}>
                {['Employee','Company','Dept','Amount','Tenor','Date','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'11px 16px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(l=>(
                <tr key={l.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ fontWeight:700,fontSize:13,color:'var(--navy)' }}>{l.employee}</div>
                    <div style={{ fontSize:11,color:'var(--gray-400)' }}>{l.staffId}</div>
                  </td>
                  <td style={{ padding:'13px 16px',fontSize:12,color:'var(--gray-600)' }}>{l.company}</td>
                  <td style={{ padding:'13px 16px' }}><span style={{ fontSize:10,background:'var(--navy)',color:'white',padding:'2px 8px',borderRadius:4,fontWeight:700 }}>{l.dept}</span></td>
                  <td style={{ padding:'13px 16px',fontSize:13,fontWeight:600,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(l.amount)}</td>
                  <td style={{ padding:'13px 16px',fontSize:12,color:'var(--gray-600)' }}>{l.tenor}</td>
                  <td style={{ padding:'13px 16px',fontSize:12,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{l.date}</td>
                  <td style={{ padding:'13px 16px' }}><StatusBadge status={l.status}/></td>
                  <td style={{ padding:'13px 16px' }}>
                    {l.status === 'active' && (
                      <div style={{ display:'flex',gap:6 }}>
                        <button onClick={()=>approve(l.id)} style={{ background:'rgba(34,197,94,0.1)',border:'none',borderRadius:6,padding:'5px',cursor:'pointer',display:'flex',alignItems:'center' }}><CheckCircle size={13} color="var(--green)"/></button>
                        <button onClick={()=>reject(l.id)} style={{ background:'rgba(239,68,68,0.1)',border:'none',borderRadius:6,padding:'5px',cursor:'pointer',display:'flex',alignItems:'center' }}><XCircle size={13} color="var(--red)"/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
