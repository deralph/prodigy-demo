import React, { useState, useMemo } from 'react';
import { ArrowLeft, Eye, Building2, Users, TrendingDown, CheckCircle, Download, Briefcase, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { adminStaffLoanApi } from '../../services/api';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import ModalOverlay from '../../components/ui/ModalOverlay';
import { csvRow } from '../../utils/csv';
import DetailRow from '../../components/ui/DetailRow';
import ProgressBar from '../../components/ui/ProgressBar';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

/* ── Entity card ── */
function EntityCard({ entity, onSelect }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden', transition: 'all 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,27,53,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={20} color="var(--gold)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--navy)', marginBottom: 2 }}>{entity.company}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}><strong style={{ color: 'var(--navy)' }}>{entity.staff.length}</strong> staff</span>
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}><strong style={{ color: 'var(--green)' }}>{entity.activeLoans}</strong> active</span>
            <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Total: <strong style={{ color: 'var(--navy)' }}>{fmt(entity.totalDisbursed)}</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <StatusBadge status={entity.status} />
          <button onClick={() => onSelect(entity.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em' }}>
            <Eye size={13} /> VIEW STAFF LOANS
          </button>
        </div>
      </div>
      <ProgressBar pct={entity.totalStaff > 0 ? (entity.activeLoans / entity.totalStaff) * 100 : 0} height={4} color="var(--navy)" />
    </div>
  ); 
}
 
/* ── Loan detail modal with approve / reject / repayment ── */
function LoanDetailModal({ loan, onClose, onRefresh }) {
  const [tab,        setTab]        = useState('details');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [repayAmt,   setRepayAmt]   = useState('');
  const [repayNote,  setRepayNote]  = useState('');

  const pct = loan.amount > 0 ? Math.min(100, Math.round((loan.repaid / (loan.amount * 1.015)) * 100)) : 0;

  const act = async (fn) => {
    setError(''); setLoading(true);
    try { await fn(); onRefresh(); onClose(); }
    catch (e) { setError(e?.message || 'Action failed.'); }
    setLoading(false);
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={520} headerContent={
      <div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Staff Loan · {loan.staffId || loan.loanRef || loan.id?.slice(0,8)}</div>
        <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: 'white', textTransform: 'uppercase' }}>{loan.employee}</h3>
      </div>
    }>
      {error && <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>{error}</div>}

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid var(--gray-100)', paddingBottom: 12 }}>
        {['details', loan.status === 'pending' ? 'approve' : null, loan.status === 'active' ? 'repayment' : null].filter(Boolean).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: tab === t ? 'var(--navy)' : 'var(--gray-100)', color: tab === t ? 'white' : 'var(--gray-500)' }}>
            {t === 'approve' ? 'Approve / Reject' : t}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div>
          {[
            ['Employee',    loan.employee],
            ['Staff ID',    loan.staffId || '—'],
            ['Department',  loan.dept],
            ['Loan Amount', fmt(loan.amount)],
            ['Interest (1.5%)', fmt(Math.round(loan.amount * 0.015))],
            ['Total Repayable', fmt(Math.round(loan.amount * 1.015))],
            ['Repaid',      fmt(loan.repaid)],
            ['Outstanding', fmt(loan.outstanding)],
            ['Tenor',       loan.tenor],
            ['Applied On',  loan.date],
            ['Status',      loan.status.toUpperCase()],
          ].map(([l, v]) => <DetailRow key={l} label={l} value={v} />)}
          {loan.status === 'active' && loan.amount > 0 && (
            <div style={{ marginTop: 16, background: 'rgba(13,27,53,0.04)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Repayment Progress</div>
              <ProgressBar pct={pct} showPct />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>{pct}% repaid</span>
                <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>{fmt(loan.outstanding)} remaining</span>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'approve' && loan.status === 'pending' && (
        <div>
          <div style={{ marginBottom: 20, padding: '14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Approve Loan</div>
            <p style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.6, margin: 0 }}>
              Approving will mark this loan as <strong>ACTIVE</strong>, set the disbursement date, calculate the maturity date, and credit <strong>{fmt(loan.amount)}</strong> to the company&apos;s Prodigy wallet.
            </p>
          </div>
          <button onClick={() => act(() => adminStaffLoanApi.approve(loan.rawId))} disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? 'var(--gray-200)' : 'var(--green)', color: 'white', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle size={15} /> {loading ? 'Processing...' : 'APPROVE & DISBURSE'}
          </button>

          <div style={{ padding: '14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Reject Loan</div>
            <textarea rows={2} placeholder="Reason for rejection (required)" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 8, padding: '8px 10px', fontSize: 12, resize: 'vertical', outline: 'none', marginBottom: 8 }} />
            <button onClick={() => { if (!rejectNote.trim()) { setError('Please provide a rejection reason.'); return; } act(() => adminStaffLoanApi.reject(loan.rawId, rejectNote)); }} disabled={loading}
              style={{ width: '100%', padding: '10px', background: loading ? 'var(--gray-200)' : 'rgba(239,68,68,0.9)', color: 'white', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <XCircle size={13} /> REJECT APPLICATION
            </button>
          </div>
        </div>
      )}

      {tab === 'repayment' && loan.status === 'active' && (
        <div>
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(13,27,53,0.04)', borderRadius: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Suggested Monthly Payment</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--navy)' }}>{fmt(loan.monthlyPayment || 0)}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>Outstanding: {fmt(loan.outstanding)}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7, fontWeight: 700 }}>Repayment Amount (₦)</div>
            <input type="text" placeholder="e.g. 845,833" value={repayAmt} onChange={e => setRepayAmt(e.target.value)}
              style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', color: 'var(--navy)' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7, fontWeight: 700 }}>Note (optional)</div>
            <input type="text" placeholder="e.g. June 2026 salary deduction" value={repayNote} onChange={e => setRepayNote(e.target.value)}
              style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', color: 'var(--navy)' }} />
          </div>
          <button onClick={() => {
            const amt = parseFloat(repayAmt.replace(/[^0-9.]/g, ''));
            if (!amt || amt <= 0) { setError('Enter a valid repayment amount.'); return; }
            act(() => adminStaffLoanApi.recordRepayment(loan.rawId, Math.round(amt * 100), repayNote || undefined));
          }} disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? 'var(--gray-200)' : 'var(--navy)', color: 'white', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CreditCard size={14} /> {loading ? 'Recording...' : 'RECORD REPAYMENT'}
          </button>
        </div>
      )}
    </ModalOverlay>
  );
}

export default function StaffLoansAdmin() {
  const { corpLoanEntities, fetchApiData } = useAppStore();
  const [selectedId,  setSelectedId]  = useState(null);
  const [detailLoan,  setDetailLoan]  = useState(null);

  // Normalize API shape → component shape
  const entities = useMemo(() => (corpLoanEntities || []).map(e => {
    const loans = (e.staffLoans || e.staff || []);
    const staff = loans.map(l => {
      const principal      = Number(l.principalKobo || l.amount || 0) / 100;
      const outstanding    = Number(l.outstandingKobo || l.outstanding || 0) / 100;
      const totalRepayable = principal * (1 + Number(l.interestRate || 1.5) / 100);
      const repaid         = Math.max(0, totalRepayable - outstanding);
      const tenorMonths    = l.tenorMonths || 1;
      return {
        id:             l.id,
        rawId:          l.id,
        loanRef:        l.loanRef,
        employee:       l.staffName   || l.employee || '—',
        staffId:        l.staffId     || '—',
        dept:           l.department  || l.dept     || 'N/A',
        amount:         principal,
        monthlyPayment: Math.round(totalRepayable / tenorMonths),
        repaid:         Math.round(repaid),
        outstanding:    Math.round(outstanding),
        tenor:          tenorMonths ? `${tenorMonths} month${tenorMonths !== 1 ? 's' : ''}` : (l.tenor || '—'),
        date:           l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-GB') : (l.date || '—'),
        status:         (l.status || 'pending').toLowerCase(),
      };
    });
    const disbursedLoans = staff.filter(l => !['pending','rejected'].includes(l.status));
    const activeLoans    = staff.filter(l => ['active','performing','disbursed'].includes(l.status)).length;
    const totalDisbursed = disbursedLoans.reduce((s, l) => s + l.amount, 0);
    const totalOutstanding = disbursedLoans.reduce((s, l) => s + l.outstanding, 0);
    const totalRepaid    = disbursedLoans.reduce((s, l) => s + l.repaid, 0);
    const statusVal      = activeLoans > 0 ? 'active' : (staff.length > 0 ? 'pending' : 'inactive');
    return {
      ...e,
      company:       e.name       || e.company || '—',
      staff,
      totalStaff:    e.staffCount || staff.length,
      activeLoans,
      totalDisbursed,
      totalOutstanding,
      totalRepaid,
      status:        statusVal,
    };
  }), [corpLoanEntities]);

  const entity = selectedId ? entities.find(e => e.id === selectedId) : null;

  const totalDisbursed = entities.reduce((s, e) => s + e.totalDisbursed, 0);
  const totalActive    = entities.reduce((s, e) => s + e.activeLoans, 0);
  const allStaffCount  = entities.reduce((s, e) => s + (e.staff?.length || 0), 0);

  const exportCSV = (rows, filename) => {
    const header = csvRow('Employee','Staff ID','Dept','Amount','Repaid','Outstanding','Tenor','Date','Status');
    const body   = rows.map(l => csvRow(l.employee, l.staffId, l.dept, l.amount, l.repaid, l.outstanding, l.tenor, l.date, l.status)).join('\n');
    const blob   = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const kpiStats = [
    { label: 'Corporate Entities', val: entities.length, color: 'var(--navy)',  icon: Building2 },
    { label: 'Total Disbursed',    val: fmt(totalDisbursed),     color: '#3b82f6',      icon: TrendingDown },
    { label: 'Active Loans',       val: totalActive,             color: 'var(--green)', icon: CheckCircle },
    { label: 'Total Staff',        val: allStaffCount,           color: '#8b5cf6',      icon: Users },
  ];

  return (
    <div>
      <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {entity && (
          <button onClick={() => setSelectedId(null)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>
            <ArrowLeft size={13} /> Back
          </button>
        )}
        <PageHeader title={entity ? entity.company : 'Corporate Staff Loans'} subtitle={entity ? `Staff loan records · ${entity.staff.length} employees` : 'Loans grouped by corporate entity'} />
      </div>

      {!entity ? (
        <>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 22 }} className="animate-in delay-1">
            {kpiStats.map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--gray-200)' }}>
                <s.icon size={16} color={s.color} style={{ marginBottom: 8 }} />
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: s.color, marginBottom: 4 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {entities.length === 0
            ? <EmptyState icon={Briefcase} title="No staff loan entities yet" message="Corporate staff loan programs will appear here once companies enroll." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="animate-in delay-2">
                {entities.map(ent => <EntityCard key={ent.id} entity={ent} onSelect={setSelectedId} />)}
              </div>
            )
          }
        </>
      ) : (
        <>
          {/* Entity summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 22 }} className="animate-in delay-1">
            {[
              { label: 'Active Loans',    val: entity.staff.filter(l => l.status === 'active').length, color: 'var(--green)' },
              { label: 'Total Disbursed', val: fmt(entity.totalDisbursed),                             color: 'var(--navy)' },
              { label: 'Outstanding',     val: fmt(entity.totalOutstanding),                           color: 'var(--red)' },
              { label: 'Repaid',          val: fmt(entity.totalRepaid),                                color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: s.color, marginBottom: 4 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={() => exportCSV(entity.staff, `${entity.company.replace(/\s/g, '_')}_loans.csv`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>
              <Download size={13} /> Export CSV
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-2">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f4f6fa' }}>
                    {['Employee', 'Staff ID', 'Dept', 'Loan Amount', 'Repaid', 'Outstanding', 'Tenor', 'Date', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entity.staff.map(l => (
                    <tr key={l.id} style={{ borderTop: '1px solid var(--gray-100)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 16px' }}><div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{l.employee}</div></td>
                      <td style={{ padding: '13px 16px', fontSize: 11, fontFamily: 'monospace', color: 'var(--gray-500)' }}>{l.staffId}</td>
                      <td style={{ padding: '13px 16px' }}><span style={{ fontSize: 10, background: 'var(--navy)', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{l.dept}</span></td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{fmt(l.amount)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--green)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(l.repaid)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: l.outstanding > 0 ? 'var(--red)' : 'var(--gray-400)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(l.outstanding)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--gray-600)' }}>{l.tenor}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{l.date}</td>
                      <td style={{ padding: '13px 16px' }}><StatusBadge status={l.status} /></td>
                      <td style={{ padding: '13px 16px' }}>
                        <button onClick={() => setDetailLoan(l)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'rgba(59,130,246,0.08)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>
                          <Eye size={12} /> View
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

      {detailLoan && <LoanDetailModal loan={detailLoan} onClose={() => setDetailLoan(null)} onRefresh={() => fetchApiData && fetchApiData()} />}
    </div>
  );
}
