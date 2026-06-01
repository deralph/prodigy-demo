import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import PageHeader from './components/ui/PageHeader';
import LoanCard from './components/ui/LoanCard';
import FileUploadBox from './components/ui/FileUploadBox';
import ModalOverlay from './components/ui/ModalOverlay';
import ProgressBar from './components/ui/ProgressBar';

/* Static demo data (root-level StaffLoans — legacy/demo page) */
const ACTIVE_LOANS = [
  { id: 'PP-001', staffName: 'Abiola Johnson', principal: 1500000, dept: 'HR',  progress: 44, status: 'active' },
  { id: 'PP-002', staffName: 'Sarah Alabi',    principal: 1000000, dept: 'FIN', progress: 76, status: 'active' },
];
const CLOSED_LOANS = [
  { id: 'PP-002', staffName: 'Emeka Okafor', settledAmount: 500000,    status: 'settled',    },
  { id: 'PP-003', staffName: 'Grace Idowu',  settledAmount: 125000,    status: 'terminated', },
];

const TENOR_OPTIONS = ['1 MONTH', '3 MONTHS', '6 MONTHS', '12 MONTHS', '18 MONTHS', '24 MONTHS'];

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

function LoanApplicationModal({ onClose }) {
  const [form, setForm]   = useState({ staffName: '', staffId: '', amount: '', tenor: '6 MONTHS' });
  const [file, setFile]   = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.staffName || !form.staffId || !form.amount) { alert('Please fill in all required fields.'); return; }
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); }, 2200);
  };

  const inputStyle = { width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '12px 14px', fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#1e293b', background: 'white', outline: 'none' };

  return (
    <ModalOverlay onClose={onClose} maxWidth={540} scrollable
      headerContent={<h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Staff Loan Application</h2>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[['Staff Name', 'staffName'], ['Staff ID', 'staffId']].map(([l, k]) => (
            <div key={k}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>{l}</div>
              <input type="text" value={form[k]} onChange={e => set(k, e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Amount (₦)</div>
            <input type="text" value={form.amount} onChange={e => set('amount', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Tenor</div>
            <div style={{ position: 'relative' }}>
              <select value={form.tenor} onChange={e => set('tenor', e.target.value)}
                style={{ ...inputStyle, paddingRight: 36, appearance: 'none', cursor: 'pointer' }}>
                {TENOR_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray-400)' }}>▾</span>
            </div>
          </div>
        </div>
        <FileUploadBox label="Application PDF" file={file} onChange={setFile} hint="Signed request letter · PDF" />
        <button onClick={handleSubmit}
          style={{ width: '100%', background: submitted ? 'var(--green)' : 'var(--navy)', color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', border: 'none', borderRadius: 10, padding: '15px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {submitted ? '✓ APPLICATION SUBMITTED' : 'SUBMIT APPLICATION'}
        </button>
      </div>
    </ModalOverlay>
  );
}

export default function StaffLoans() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <PageHeader title="Employee Benefits Hub" subtitle="Bespoke Asset Management System V2.0" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card animate-in delay-1">
          <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Active Loan Portfolio</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--navy)', marginBottom: 6 }}>₦1,450,000</div>
          <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>↑ 100% Repayment Rate</div>
        </div>
        <div className="card animate-in delay-2">
          <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Total Beneficiaries</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--navy)', marginBottom: 6 }}>42 Employees</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Across all departments</div>
        </div>
        <div className="card animate-in delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => setShowModal(true)}>+ New Application</button>
          <button className="btn-navy" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>↑ Upload Schedule</button>
        </div>
        <div className="card animate-in delay-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <BookOpen size={22} color="var(--navy)" strokeWidth={1.5} />
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Syne,sans-serif' }}>HR Monthly Ledger</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="animate-in delay-4">
        {/* Active loans */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active / Performing Loans</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['Employee', 'Principal (₦)', 'Dept', 'Progress'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACTIVE_LOANS.map(l => (
                <tr key={l.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{l.staffName}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.id}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--navy)' }}>{fmt(l.principal)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 10, background: 'var(--navy)', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{l.dept}</span>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: 80 }}>
                    <ProgressBar pct={l.progress} showPct />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closed loans */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gray-400)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Non-Active / Closed Archive</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['Employee', 'Settled (₦)', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLOSED_LOANS.map(l => (
                <tr key={l.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{l.staffName}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.id}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--navy)' }}>{fmt(l.settledAmount)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 10, color: l.status === 'settled' ? 'var(--green)' : 'var(--red)', background: l.status === 'settled' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <LoanApplicationModal onClose={() => setShowModal(false)} />}
      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
