import React, { useState } from 'react';
import { ArrowLeft, Eye, Building2, Users, TrendingDown, CheckCircle, Download, Briefcase } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import ModalOverlay from '../../components/ui/ModalOverlay';
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

/* ── Loan detail modal ── */
function LoanDetailModal({ loan, onClose }) {
  return (
    <ModalOverlay onClose={onClose} maxWidth={480} headerContent={
      <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: 'white', textTransform: 'uppercase' }}>Loan Details</h3>
    }>
      {[
        ['Employee',    loan.employee],
        ['Staff ID',    loan.staffId],
        ['Department',  loan.dept],
        ['Loan Amount', fmt(loan.amount)],
        ['Repaid',      fmt(loan.repaid)],
        ['Outstanding', fmt(loan.outstanding)],
        ['Tenor',       loan.tenor],
        ['Date',        loan.date],
        ['Status',      loan.status],
      ].map(([l, v]) => <DetailRow key={l} label={l} value={v} />)}
      {loan.outstanding > 0 && (
        <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>Recovery Progress</div>
          <ProgressBar pct={Math.round((loan.repaid / loan.amount) * 100)} showPct />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{Math.round((loan.repaid / loan.amount) * 100)}% repaid</span>
            <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>{fmt(loan.outstanding)} remaining</span>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}

export default function StaffLoansAdmin() {
  const { corpLoanEntities } = useAppStore();
  const [selectedId,  setSelectedId]  = useState(null);
  const [detailLoan,  setDetailLoan]  = useState(null);

  const entity = selectedId ? corpLoanEntities.find(e => e.id === selectedId) : null;

  const totalDisbursed = corpLoanEntities.reduce((s, e) => s + e.totalDisbursed, 0);
  const totalActive    = corpLoanEntities.reduce((s, e) => s + e.activeLoans, 0);
  const allStaffCount  = corpLoanEntities.reduce((s, e) => s + e.staff.length, 0);

  const exportCSV = (rows, filename) => {
    const header = 'Employee,Staff ID,Dept,Amount,Repaid,Outstanding,Tenor,Date,Status';
    const body   = rows.map(l => `"${l.employee}","${l.staffId}","${l.dept}",${l.amount},${l.repaid},${l.outstanding},"${l.tenor}","${l.date}","${l.status}"`).join('\n');
    const blob   = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const kpiStats = [
    { label: 'Corporate Entities', val: corpLoanEntities.length, color: 'var(--navy)',  icon: Building2 },
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

          {corpLoanEntities.length === 0
            ? <EmptyState icon={Briefcase} title="No staff loan entities yet" message="Corporate staff loan programs will appear here once companies enroll." />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="animate-in delay-2">
                {corpLoanEntities.map(ent => <EntityCard key={ent.id} entity={ent} onSelect={setSelectedId} />)}
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
              { label: 'Outstanding',     val: fmt(entity.staff.reduce((s, l) => s + l.outstanding, 0)), color: 'var(--red)' },
              { label: 'Settled',         val: entity.staff.filter(l => l.status === 'settled').length,  color: '#3b82f6' },
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

      {detailLoan && <LoanDetailModal loan={detailLoan} onClose={() => setDetailLoan(null)} />}
    </div>
  );
}
