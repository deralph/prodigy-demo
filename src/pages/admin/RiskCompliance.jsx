import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const kycItems = [
  { client:'Prodigy Holdings Ltd', type:'corporate', cac:'verified', tax:'verified', scuml:'verified', utility:'verified', overall:'approved' },
  { client:'John Doe',             type:'individual', cac:'verified', tax:'verified', scuml:'N/A',      utility:'verified', overall:'approved' },
  { client:'Awobajo Lanre Daniel', type:'joint',      cac:'verified', tax:'verified', scuml:'N/A',      utility:'verified', overall:'approved' },
  { client:'Sunshine Ventures Ltd',type:'corporate', cac:'pending',  tax:'pending',  scuml:'pending',  utility:'pending',  overall:'pending' },
  { client:'Amaka Okonkwo',        type:'individual', cac:'pending',  tax:'N/A',      scuml:'N/A',      utility:'pending',  overall:'pending' },
  { client:'Heritage Global Inv.', type:'corporate', cac:'verified', tax:'flagged',  scuml:'verified', utility:'verified', overall:'flagged' },
];

const dot = s => s==='verified'?'var(--green)':s==='pending'?'var(--gold)':s==='flagged'?'var(--red)':'var(--gray-300)';

export default function RiskCompliance() {
  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Risk & Compliance</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>KYC status board and compliance monitoring</p>
      </div>
      {/* Summary */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:24 }} className="animate-in delay-1">
        {[
          { label:'Fully Verified', count:kycItems.filter(k=>k.overall==='approved').length,  Icon:CheckCircle,   color:'var(--green)' },
          { label:'Pending Review', count:kycItems.filter(k=>k.overall==='pending').length,   Icon:AlertTriangle, color:'var(--gold)' },
          { label:'Flagged/AML',    count:kycItems.filter(k=>k.overall==='flagged').length,   Icon:XCircle,       color:'var(--red)' },
          { label:'Total Clients',  count:kycItems.length,                                    Icon:ShieldAlert,   color:'#3b82f6' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)',display:'flex',alignItems:'center',gap:12 }}>
            <s.Icon size={22} color={s.color} strokeWidth={1.8}/>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:s.color }}>{s.count}</div>
              <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* KYC Board */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
        <div style={{ padding:'16px 22px',borderBottom:'1px solid var(--gray-100)' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>KYC Compliance Board</h3>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f4f6fa' }}>
                {['Client','Type','CAC','Tax ID','SCUML','Utility','Overall'].map(h=>(
                  <th key={h} style={{ padding:'10px 16px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kycItems.map(k=>(
                <tr key={k.client} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'13px 16px',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{k.client}</td>
                  <td style={{ padding:'13px 16px' }}><span style={{ fontSize:10,fontWeight:700,color:'#3b82f6',background:'rgba(59,130,246,0.1)',padding:'2px 7px',borderRadius:4,textTransform:'uppercase' }}>{k.type}</span></td>
                  {[k.cac,k.tax,k.scuml,k.utility].map((v,i)=>(
                    <td key={i} style={{ padding:'13px 16px' }}>
                      <span style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,color:dot(v) }}>
                        <span style={{ width:7,height:7,borderRadius:'50%',background:dot(v),display:'inline-block' }}/>{v}
                      </span>
                    </td>
                  ))}
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:dot(k.overall),background:`${dot(k.overall)}18`,padding:'3px 8px',borderRadius:4 }}>{k.overall}</span>
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
