import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Users, Eye } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/EmptyState';
import LoanApplicationForm from '../../components/ui/LoanApplicationForm';
import ProgressBar from '../../components/ui/ProgressBar';
import useAppStore from '../../store/useAppStore';
import { staffLoanApi } from '../../services/api';

const fmt = n => '\u20a6' + Number(n || 0).toLocaleString('en-NG');
const sColor = s => s === 'active' ? 'var(--green)' : s === 'pending' ? '#f59e0b' : s === 'repaid' ? '#3b82f6' : 'var(--red)';

function LoanDetailModal({ loan, onClose }) {
  const total = loan.principal + loan.interest;
  const reps  = loan.repayments || [];
  const schedule = Array.from({ length: loan.tenorMonths }, (_, i) => {
    const d = new Date(loan.disbursedAt || new Date());
    d.setMonth(d.getMonth() + i + 1);
    const paid = reps[i];
    return { num: i + 1, due: d.toLocaleDateString('en-GB'), paid: !!paid, paidOn: paid ? new Date(paid.createdAt).toLocaleDateString('en-GB') : null };
  });
  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div style={{ background:'white',borderRadius:14,maxWidth:560,width:'90%',maxHeight:'88vh',overflow:'auto',boxShadow:'0 20px 40px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'16px 20px',background:'var(--navy)',borderRadius:'14px 14px 0 0' }}>
          <div style={{ fontSize:9,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:2 }}>{loan.staffId} &middot; {loan.loanRef}</div>
          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white' }}>{loan.staffName}</div>
          <div style={{ fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:2 }}>{loan.department}</div>
        </div>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:10,marginBottom:18 }}>
            {[
              { l:'Principal',       v:fmt(loan.principal) },
              { l:'Interest (1.5%)', v:fmt(loan.interest) },
              { l:'Total Repayable', v:fmt(total) },
              { l:'Outstanding',     v:fmt(loan.outstanding), c:'var(--red)' },
              { l:'Monthly Payment', v:fmt(loan.monthlyPayment) },
              { l:'Status',          v:loan.status.toUpperCase(), c:sColor(loan.status) },
            ].map(s => (
              <div key={s.l} style={{ background:'var(--gray-50)',borderRadius:8,padding:'10px 12px' }}>
                <div style={{ fontSize:9,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4 }}>{s.l}</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:s.c||'var(--navy)' }}>{s.v}</div>
              </div>
            ))}
          </div>
          {loan.status === 'active' && (
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:9,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:7,fontWeight:700 }}>Repayment Progress</div>
              <ProgressBar pct={loan.pctRepaid} showPct />
              <div style={{ display:'flex',justifyContent:'space-between',marginTop:5,fontSize:10 }}>
                <span style={{ color:'var(--green)',fontWeight:600 }}>{loan.pctRepaid}% repaid</span>
                <span style={{ color:'var(--red)',fontWeight:600 }}>{fmt(loan.outstanding)} remaining</span>
              </div>
            </div>
          )}
          <div style={{ fontSize:9,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8,fontWeight:700 }}>Repayment Schedule</div>
          <div style={{ border:'1px solid var(--gray-200)',borderRadius:8,overflow:'hidden',maxHeight:260,overflowY:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--gray-50)' }}>
                  {['#','Due Date','Amount','Principal','Interest','Status'].map(h=>(
                    <th key={h} style={{ padding:'7px 10px',textAlign:'left',fontSize:9,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.06em',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.map(r=>(
                  <tr key={r.num} style={{ borderTop:'1px solid var(--gray-100)',background:r.paid?'rgba(34,197,94,0.04)':'transparent' }}>
                    <td style={{ padding:'7px 10px',fontSize:11,color:'var(--gray-500)' }}>{r.num}</td>
                    <td style={{ padding:'7px 10px',fontSize:11,color:'var(--navy)' }}>{r.due}</td>
                    <td style={{ padding:'7px 10px',fontSize:11,fontWeight:600,color:'var(--navy)' }}>{fmt(loan.monthlyPayment)}</td>
                    <td style={{ padding:'7px 10px',fontSize:11,color:'var(--gray-500)' }}>{fmt(Math.round(loan.principal/loan.tenorMonths))}</td>
                    <td style={{ padding:'7px 10px',fontSize:11,color:'var(--gray-500)' }}>{fmt(Math.round(loan.interest/loan.tenorMonths))}</td>
                    <td style={{ padding:'7px 10px' }}>
                      {r.paid
                        ? <span style={{ fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'rgba(34,197,94,0.12)',color:'var(--green)' }}>PAID{r.paidOn?' \u00b7 '+r.paidOn:''}</span>
                        : <span style={{ fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,background:'rgba(239,68,68,0.08)',color:'var(--red)' }}>DUE</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loan.status==='rejected' && loan.rejectionReason && (
            <div style={{ marginTop:14,padding:'10px 12px',background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,fontSize:11,color:'var(--red)' }}>
              <strong>Rejected: </strong>{loan.rejectionReason}
            </div>
          )}
          {loan.status==='active' && (
            <div style={{ marginTop:14,padding:'10px 12px',background:'rgba(34,197,94,0.05)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:8,fontSize:11,color:'var(--gray-500)' }}>
              <strong style={{ color:'var(--navy)' }}>Repayment:</strong> Monthly salary deduction via HR. Contact your RM for early repayment.
            </div>
          )}
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid var(--gray-100)',textAlign:'right' }}>
          <button onClick={onClose} style={{ padding:'8px 16px',background:'var(--gray-100)',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700,color:'var(--navy)' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function CorporateStaffLoans() {
  const { user }                   = useAppStore();
  const [showModal, setShowModal]  = useState(false);
  const [loans,     setLoans]      = useState([]);
  const [loading,   setLoading]    = useState(true);
  const [toast,     setToast]      = useState(null);
  const [detail,    setDetail]     = useState(null);

  useEffect(() => {
    staffLoanApi.getMyLoans()
      .then(data => { if (Array.isArray(data)) setLoans(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const norm = useMemo(() => loans.map(l => {
    const principal   = Number(l.principalKobo || 0) / 100;
    const outstanding = ['PENDING','REJECTED'].includes(l.status) ? 0 : Number(l.outstandingKobo || 0) / 100;
    const interest    = Math.round(principal * Number(l.interestRate || 1.5)) / 100;
    const totalRepay  = principal + interest;
    const repaid      = Math.max(0, totalRepay - outstanding);
    const monthly     = Number(l.monthlyPaymentKobo || 0) / 100;
    const pct         = totalRepay > 0 ? Math.min(100, Math.round(repaid / totalRepay * 100)) : 0;
    return {
      id: l.id, loanRef: l.loanRef,
      staffName: l.staffName || '\u2014',
      staffId: l.staffId || l.loanRef || '\u2014',
      department: l.department || 'N/A',
      principal, interest, outstanding, repaid,
      monthlyPayment: monthly,
      tenorMonths: l.tenorMonths || 1,
      pctRepaid: pct,
      status: (l.status || 'PENDING').toLowerCase(),
      disbursedAt: l.disbursedAt,
      repayments: l.repayments || [],
      rejectionReason: l.rejectionReason,
    };
  }), [loans]);

  const activeLoans     = norm.filter(l => ['active','performing','pending'].includes(l.status));
  const closedLoans     = norm.filter(l => !['active','performing','pending'].includes(l.status));
  const disbursedActive = activeLoans.filter(l => l.status !== 'pending');
  const totalPrincipal  = disbursedActive.reduce((s, l) => s + l.principal, 0);
  const totalOutstanding = disbursedActive.reduce((s, l) => s + l.outstanding, 0);

  const handleSubmit = async (loanData) => {
    try {
      const created = await staffLoanApi.applyLoan(loanData);
      setLoans(prev => [created, ...prev]);
      setToast('Loan application submitted successfully.');
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setToast(e?.message || 'Submission failed. Please try again.');
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div>
      <PageHeader title="Employee Staff Loans" subtitle="Bespoke Asset Management System V2.0" />
      {toast && (
        <div style={{ marginBottom:16, padding:'12px 16px', background: toast.includes('submit') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border:`1px solid ${toast.includes('submit')?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:8, fontSize:12, color: toast.includes('submit') ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>{toast}</div>
      )}

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:20, marginBottom:24 }}>
        <div className="card animate-in delay-1">
          <div style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Active Portfolio</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'var(--navy)', marginBottom:6 }}>{loading ? '—' : fmt(totalPrincipal)}</div>
          <div style={{ fontSize:11, color:'var(--green)', fontWeight:600 }}>{disbursedActive.length} disbursed loan{disbursedActive.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="card animate-in delay-2">
          <div style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Total Outstanding</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'var(--red)', marginBottom:6 }}>{loading ? '—' : fmt(totalOutstanding)}</div>
          <div style={{ fontSize:11, color:'var(--gray-400)' }}>Balance across active loans</div>
        </div>
        <div className="card animate-in delay-3">
          <div style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Total Beneficiaries</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'var(--navy)', marginBottom:6 }}>{loading ? '—' : norm.length}</div>
          <div style={{ fontSize:11, color:'var(--gray-400)' }}>Across all departments</div>
        </div>
        <div className="card animate-in delay-4" style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:10 }}>
          <button className="btn-gold" style={{ width:'100%', justifyContent:'center', padding:'12px' }} onClick={() => setShowModal(true)}>+ New Application</button>
        </div>
      </div>

      {/* Active / Closed tables */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }} className="animate-in delay-4">

        {/* Active table */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--gray-100)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', display:'inline-block' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Active / Performing Loans</span>
            <span style={{ marginLeft:'auto', fontSize:10, color:'var(--gray-400)', fontWeight:600 }}>{activeLoans.length} record{activeLoans.length !== 1 ? 's' : ''}</span>
          </div>
          {activeLoans.length === 0
            ? <EmptyState icon={Users} title="No active loans" message="Approved staff loans will appear here." compact />
            : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--gray-50)' }}>
                      {['Employee','Principal (₦)','Outstanding','Dept','Status',''].map(h => (
                        <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:9, color:'var(--gray-400)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map(l => (
                      <tr key={l.id} style={{ borderTop:'1px solid var(--gray-100)' }}>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ fontWeight:700, fontSize:13, color:'var(--navy)' }}>{l.staffName}</div>
                          <div style={{ fontSize:10, color:'var(--gray-400)', fontFamily:'monospace' }}>{l.staffId}</div>
                        </td>
                        <td style={{ padding:'12px 14px', fontSize:13, fontWeight:600, color:'var(--navy)' }}>{l.status === 'pending' ? '—' : fmt(l.principal)}</td>
                        <td style={{ padding:'12px 14px', fontSize:12, fontWeight:600, color:'var(--red)' }}>{l.status === 'pending' ? '—' : fmt(l.outstanding)}</td>
                        <td style={{ padding:'12px 14px' }}><span style={{ fontSize:9, background:'var(--navy)', color:'white', padding:'2px 7px', borderRadius:4, fontWeight:700 }}>{l.department}</span></td>
                        <td style={{ padding:'12px 14px' }}><span style={{ fontSize:10, fontWeight:700, color:sColor(l.status) }}>{l.status.toUpperCase()}</span></td>
                        <td style={{ padding:'12px 14px' }}>
                          <button onClick={() => setDetail(l)} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', background:'rgba(59,130,246,0.08)', border:'none', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:700, color:'#3b82f6' }}>
                            <Eye size={11} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>

        {/* Closed archive */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--gray-100)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--gray-400)', display:'inline-block' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Non-Active / Closed Archive</span>
            <span style={{ marginLeft:'auto', fontSize:10, color:'var(--gray-400)', fontWeight:600 }}>{closedLoans.length} record{closedLoans.length !== 1 ? 's' : ''}</span>
          </div>
          {closedLoans.length === 0
            ? <EmptyState icon={BookOpen} title="No closed loans" message="Fully repaid or rejected loans will appear here." compact />
            : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--gray-50)' }}>
                      {['Employee','Principal (₦)','Total Paid','Status',''].map(h => (
                        <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:9, color:'var(--gray-400)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {closedLoans.map(l => (
                      <tr key={l.id} style={{ borderTop:'1px solid var(--gray-100)' }}>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ fontWeight:700, fontSize:13, color:'var(--navy)' }}>{l.staffName}</div>
                          <div style={{ fontSize:10, color:'var(--gray-400)', fontFamily:'monospace' }}>{l.staffId}</div>
                        </td>
                        <td style={{ padding:'12px 14px', fontSize:13, fontWeight:600, color:'var(--navy)' }}>{fmt(l.principal)}</td>
                        <td style={{ padding:'12px 14px', fontSize:12, fontWeight:600, color:'var(--green)' }}>{fmt(l.repaid)}</td>
                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:4, background: l.status === 'repaid' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color:sColor(l.status), textTransform:'uppercase', letterSpacing:'0.06em' }}>{l.status}</span>
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          <button onClick={() => setDetail(l)} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', background:'rgba(59,130,246,0.08)', border:'none', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:700, color:'#3b82f6' }}>
                            <Eye size={11} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>

      {/* Repayment cycle */}
      <div className="card animate-in delay-5" style={{ marginTop:24, background:'rgba(13,27,53,0.02)', border:'1px solid var(--gray-200)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--gray-100)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Staff Loan Repayment Cycle</div>
        </div>
        <div style={{ padding:'16px 20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
            {[
              { step:'1', title:'Application',       desc:'Employee submits request via HR portal with department approval' },
              { step:'2', title:'HR Review',          desc:'HR validates eligibility, existing loan status and repayment capacity' },
              { step:'3', title:'Finance Approval',   desc:'Prodigy approves disbursement and sets up salary deduction mandate' },
              { step:'4', title:'Disbursement',       desc:'Principal credited to company wallet within 2–3 business days' },
              { step:'5', title:'Monthly Deduction',  desc:'1.5% flat interest. Fixed monthly amount deducted from salary payroll' },
              { step:'6', title:'Completion',         desc:'Final payment clears loan. Archived in Non-Active / Closed register' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--navy)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{step}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--navy)', marginBottom:3 }}>{title}</div>
                  <div style={{ fontSize:11, color:'var(--gray-500)', lineHeight:1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--gray-100)', fontSize:11, color:'var(--gray-500)' }}>
            <strong style={{ color:'var(--navy)' }}>Rate:</strong> 1.5% flat fee per loan.&ensp;<strong style={{ color:'var(--navy)' }}>Method:</strong> Salary deduction.&ensp;<strong style={{ color:'var(--navy)' }}>Early Repayment:</strong> Allowed without penalty via RM request.
          </div>
        </div>
      </div>

      {showModal && <LoanApplicationForm onClose={() => setShowModal(false)} onSubmit={handleSubmit} staffName={user?.name} />}
      {detail  && <LoanDetailModal loan={detail} onClose={() => setDetail(null)} />}
      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
