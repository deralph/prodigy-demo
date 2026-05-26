import React, { useState } from 'react';
import { ArrowLeft, Eye, Building2, Users, TrendingDown, CheckCircle, Download, Briefcase } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

const statusColor = { active:'active', settled:'verified', terminated:'suspended', pending:'pending' };

export default function StaffLoansAdmin() {
  const { corpLoanEntities } = useAppStore();
  const [selected, setSelected] = useState(null);
  const [detailLoan, setDetailLoan] = useState(null);

  const entity = selected ? corpLoanEntities.find(e => e.id === selected) : null;

  const allStaff = corpLoanEntities.flatMap(e => e.staff);
  const totalDisbursed = corpLoanEntities.reduce((s,e) => s + e.totalDisbursed, 0);
  const totalActive   = corpLoanEntities.reduce((s,e) => s + e.activeLoans, 0);

  const exportCSV = (rows, filename) => {
    const header = 'Employee,Staff ID,Dept,Amount,Repaid,Outstanding,Tenor,Date,Status';
    const body = rows.map(l => `"${l.employee}","${l.staffId}","${l.dept}",${l.amount},${l.repaid},${l.outstanding},"${l.tenor}","${l.date}","${l.status}"`).join('\n');
    const blob = new Blob([header+'\n'+body],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:24 }} className="animate-in">
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:4 }}>
          {entity && (
            <button onClick={()=>setSelected(null)} style={{ background:'var(--gray-100)',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'var(--navy)' }}>
              <ArrowLeft size={13}/> Back
            </button>
          )}
          <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>
            {entity ? entity.company : 'Corporate Staff Loans'}
          </h1>
        </div>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>
          {entity ? `Staff loan records · ${entity.staff.length} employees` : 'Loans grouped by corporate entity'}
        </p>
      </div>

      {!entity ? (
        <>
          {/* Summary stats */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
            {[
              { label:'Corporate Entities', val:corpLoanEntities.length,        color:'var(--navy)',  icon:Building2 },
              { label:'Total Disbursed',     val:fmt(totalDisbursed),            color:'#3b82f6',     icon:TrendingDown },
              { label:'Active Loans',        val:totalActive,                    color:'var(--green)',icon:CheckCircle },
              { label:'Total Staff',         val:allStaff.length,               color:'#8b5cf6',     icon:Users },
            ].map(s=>(
              <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                  <s.icon size={16} color={s.color}/>
                </div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:s.color,marginBottom:4 }}>{s.val}</div>
                <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Entity cards */}
          {corpLoanEntities.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No staff loan entities yet"
              message="Corporate staff loan programs will appear here once companies enroll their employees."
            />
          ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }} className="animate-in delay-2">
            {corpLoanEntities.map((ent,i)=>(
              <div key={ent.id} style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden',transition:'all 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(13,27,53,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
              >
                <div style={{ padding:'18px 22px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
                  <div style={{ width:44,height:44,borderRadius:12,background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Building2 size={20} color="var(--gold)"/>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'var(--navy)',marginBottom:2 }}>{ent.company}</div>
                    <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
                      <span style={{ fontSize:11,color:'var(--gray-400)' }}><strong style={{ color:'var(--navy)' }}>{ent.staff.length}</strong> staff with loans</span>
                      <span style={{ fontSize:11,color:'var(--gray-400)' }}><strong style={{ color:'#22c55e' }}>{ent.activeLoans}</strong> active</span>
                      <span style={{ fontSize:11,color:'var(--gray-400)' }}>Total: <strong style={{ color:'var(--navy)' }}>{fmt(ent.totalDisbursed)}</strong></span>
                    </div>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
                    <StatusBadge status={ent.status}/>
                    <button onClick={()=>setSelected(ent.id)} style={{
                      display:'flex',alignItems:'center',gap:6,padding:'9px 16px',
                      background:'var(--navy)',color:'white',border:'none',borderRadius:8,
                      cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.06em'
                    }}>
                      <Eye size={13}/> VIEW STAFF LOANS
                    </button>
                  </div>
                </div>
                {/* mini bar */}
                <div style={{ height:4,background:'var(--gray-100)' }}>
                  <div style={{ height:'100%',background:'var(--navy)',width:`${Math.min((ent.activeLoans/ent.totalStaff)*100,100)}%`,transition:'width 0.6s' }}/>
                </div>
              </div>
            ))}
          </div>
          )}
        </>
      ) : (
        <>
          {/* Entity summary */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
            {[
              { label:'Active Loans',    val:entity.staff.filter(l=>l.status==='active').length,    color:'var(--green)' },
              { label:'Total Disbursed', val:fmt(entity.totalDisbursed),                            color:'var(--navy)' },
              { label:'Outstanding',     val:fmt(entity.staff.reduce((s,l)=>s+l.outstanding,0)),    color:'var(--red)' },
              { label:'Settled',         val:entity.staff.filter(l=>l.status==='settled').length,   color:'#3b82f6' },
            ].map(s=>(
              <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:s.color,marginBottom:4 }}>{s.val}</div>
                <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Export button */}
          <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:14 }}>
            <button onClick={()=>exportCSV(entity.staff, `${entity.company.replace(/\s/g,'_')}_loans.csv`)} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 16px',background:'white',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:700,color:'#3b82f6',fontFamily:'Syne,sans-serif' }}>
              <Download size={13}/> Export CSV
            </button>
          </div>

          {/* Staff loan table */}
          <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f4f6fa' }}>
                    {['Employee','Staff ID','Dept','Loan Amount','Repaid','Outstanding','Tenor','Date','Status','Action'].map(h=>(
                      <th key={h} style={{ padding:'11px 16px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entity.staff.map(l=>(
                    <tr key={l.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ fontWeight:700,fontSize:13,color:'var(--navy)' }}>{l.employee}</div>
                      </td>
                      <td style={{ padding:'13px 16px',fontSize:11,fontFamily:'monospace',color:'var(--gray-500)' }}>{l.staffId}</td>
                      <td style={{ padding:'13px 16px' }}><span style={{ fontSize:10,background:'var(--navy)',color:'white',padding:'2px 8px',borderRadius:4,fontWeight:700 }}>{l.dept}</span></td>
                      <td style={{ padding:'13px 16px',fontSize:13,fontWeight:600,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(l.amount)}</td>
                      <td style={{ padding:'13px 16px',fontSize:12,color:'#22c55e',fontWeight:600,whiteSpace:'nowrap' }}>{fmt(l.repaid)}</td>
                      <td style={{ padding:'13px 16px',fontSize:12,color:l.outstanding>0?'var(--red)':'var(--gray-400)',fontWeight:600,whiteSpace:'nowrap' }}>{fmt(l.outstanding)}</td>
                      <td style={{ padding:'13px 16px',fontSize:12,color:'var(--gray-600)' }}>{l.tenor}</td>
                      <td style={{ padding:'13px 16px',fontSize:12,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{l.date}</td>
                      <td style={{ padding:'13px 16px' }}><StatusBadge status={l.status}/></td>
                      <td style={{ padding:'13px 16px' }}>
                        <button onClick={()=>setDetailLoan(l)} style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 10px',background:'rgba(59,130,246,0.08)',border:'none',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700,color:'#3b82f6' }}>
                          <Eye size={12}/> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Loan detail modal */}
      {detailLoan && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setDetailLoan(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:480,boxShadow:'0 32px 80px rgba(13,27,53,0.25)',overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Loan Details</h3>
              <button onClick={()=>setDetailLoan(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:18 }}>✕</button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {[
                ['Employee', detailLoan.employee],
                ['Staff ID', detailLoan.staffId],
                ['Department', detailLoan.dept],
                ['Loan Amount', fmt(detailLoan.amount)],
                ['Repaid', fmt(detailLoan.repaid)],
                ['Outstanding', fmt(detailLoan.outstanding)],
                ['Tenor', detailLoan.tenor],
                ['Date', detailLoan.date],
                ['Status', detailLoan.status],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)',textTransform:'capitalize' }}>{v}</span>
                </div>
              ))}
              {detailLoan.outstanding > 0 && (
                <div style={{ marginTop:16,background:'rgba(239,68,68,0.06)',borderRadius:10,padding:'12px 14px' }}>
                  <div style={{ fontSize:11,color:'var(--red)',fontWeight:600 }}>Recovery Progress</div>
                  <div style={{ marginTop:8,background:'var(--gray-100)',borderRadius:4,height:8,overflow:'hidden' }}>
                    <div style={{ height:'100%',background:'var(--green)',width:`${Math.round((detailLoan.repaid/detailLoan.amount)*100)}%`,transition:'width 0.6s' }}/>
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginTop:5 }}>
                    <span style={{ fontSize:10,color:'var(--gray-400)' }}>{Math.round((detailLoan.repaid/detailLoan.amount)*100)}% repaid</span>
                    <span style={{ fontSize:10,color:'var(--red)',fontWeight:600 }}>{fmt(detailLoan.outstanding)} remaining</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
