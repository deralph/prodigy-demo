import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';

const dot = s => s==='verified'||s==='approved'?'var(--green)':s==='pending'?'var(--gold)':s==='flagged'||s==='rejected'?'var(--red)':'var(--gray-300)';

export default function RiskCompliance() {
  const { clients } = useAppStore();
  const kycItems = clients.map(c => ({
    client: c.name,
    type: c.type || c.accountType || 'individual',
    overall: c.kyc || c.kycStatus || 'pending',
  }));
  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Risk & Compliance</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>KYC status board and compliance monitoring</p>
      </div>
      {/* Summary */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:24 }} className="animate-in delay-1">
        {[
          { label:'Fully Verified', count:kycItems.filter(k=>k.overall==='approved'||k.overall==='verified').length, Icon:CheckCircle,   color:'var(--green)' },
          { label:'Pending Review', count:kycItems.filter(k=>k.overall==='pending').length,                          Icon:AlertTriangle, color:'var(--gold)' },
          { label:'Flagged/AML',    count:kycItems.filter(k=>k.overall==='flagged'||k.overall==='rejected').length,   Icon:XCircle,       color:'var(--red)' },
          { label:'Total Clients',  count:kycItems.length,                                                            Icon:ShieldAlert,   color:'#3b82f6' },
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
              {kycItems.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={ShieldAlert} compact title="No clients yet" message="Clients will appear here once accounts are created." /></td></tr>
              ) : kycItems.map(k=>(
                <tr key={k.client} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'13px 16px',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{k.client}</td>
                  <td style={{ padding:'13px 16px' }}><span style={{ fontSize:10,fontWeight:700,color:'#3b82f6',background:'rgba(59,130,246,0.1)',padding:'2px 7px',borderRadius:4,textTransform:'uppercase' }}>{k.type}</span></td>
                  <td colSpan={4} style={{ padding:'13px 16px',fontSize:11,color:'var(--gray-400)' }}>KYC docs tracked via backend</td>
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
