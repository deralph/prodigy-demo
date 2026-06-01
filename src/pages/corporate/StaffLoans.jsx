import React, { useState, useEffect } from 'react';
import { BookOpen, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/EmptyState';
import LoanCard from '../../components/ui/LoanCard';
import LoanApplicationForm from '../../components/ui/LoanApplicationForm';
import ProgressBar from '../../components/ui/ProgressBar';
import { staffLoanApi } from '../../services/api';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

export default function CorporateStaffLoans() {
  const [showModal, setShowModal] = useState(false);
  const [loans,    setLoans]      = useState([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    staffLoanApi.getMyLoans()
      .then(data => { if (Array.isArray(data)) setLoans(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'performing');
  const closedLoans = loans.filter(l => l.status !== 'active' && l.status !== 'performing');
  const totalPrincipal = activeLoans.reduce((s, l) => s + (l.amount || l.principal || 0), 0);

  const handleSubmit = (loanData) => {
    setLoans(prev => [{ ...loanData, status: 'pending' }, ...prev]);
  };

  return (
    <div>
      <PageHeader title="Employee Staff Loans" subtitle="Bespoke Asset Management System V2.0" />

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card animate-in delay-1">
          <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Active Loan Portfolio</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--navy)', marginBottom: 6 }}>{loading ? '—' : fmt(totalPrincipal)}</div>
          <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="card animate-in delay-2">
          <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Total Beneficiaries</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--navy)', marginBottom: 6 }}>{loading ? '—' : loans.length} Employee{loans.length !== 1 ? 's' : ''}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Across all departments</div>
        </div>
        <div className="card animate-in delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => setShowModal(true)}>+ New Application</button>
        </div>
        <div className="card animate-in delay-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <BookOpen size={22} color="var(--navy)" strokeWidth={1.5} />
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Syne,sans-serif' }}>HR Monthly Ledger</div>
        </div>
      </div>

      {/* Active / closed tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="animate-in delay-4">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active / Performing Loans</span>
          </div>
          {activeLoans.length === 0
            ? <EmptyState icon={Users} title="No active loans" message="Active staff loan applications will appear here." compact />
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)' }}>
                    {['Employee', 'Principal (₦)', 'Dept', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map(l => (
                    <tr key={l.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{l.staffName || l.name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.staffId || l.id}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--navy)' }}>{fmt(l.amount || l.principal)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 10, background: 'var(--navy)', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{l.department || l.dept || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>{l.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gray-400)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Non-Active / Closed Archive</span>
          </div>
          {closedLoans.length === 0
            ? <EmptyState icon={BookOpen} title="No closed loans" message="Settled or terminated loans will appear here." compact />
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)' }}>
                    {['Employee', 'Settled (₦)', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {closedLoans.map(l => (
                    <tr key={l.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{l.staffName || l.name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.staffId || l.id}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--navy)' }}>{fmt(l.settledAmount || l.amount || 0)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 10, color: l.status === 'settled' ? 'var(--green)' : 'var(--red)', background: l.status === 'settled' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>

      {showModal && <LoanApplicationForm onClose={() => setShowModal(false)} onSubmit={handleSubmit} />}
      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
