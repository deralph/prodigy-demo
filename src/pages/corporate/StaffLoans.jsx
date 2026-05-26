import React, { useState } from 'react';
import { BookOpen, Upload, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const activeLoans = [
  { name: 'Abiola Johnson', id: 'PP-001', principal: '₦150,000', dept: 'HR', progress: 44 },
  { name: 'Sarah Alabi',    id: 'PP-002', principal: '₦1,000,000', dept: 'FIN', progress: 76 },
];
const closedLoans = [
  { name: 'Emeka Okafor', id: 'PP-002', settled: '₦500,000',   status: 'Settled',     statusColor: 'var(--green)' },
  { name: 'Grace Idowu',  id: 'PP-003', settled: '₦0,125,000', status: 'Terminated',  statusColor: 'var(--red)' },
];

const tenorOptions = ['1 MONTH','3 MONTHS','6 MONTHS','12 MONTHS','18 MONTHS','24 MONTHS'];

/* ── File Upload Box ─────────────────────────────────────── */
function FileUploadBox({ label, file, onChange }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8 }}>{label}</div>
      )}
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '24px 20px', border: '1.5px dashed var(--gray-200)', borderRadius: 12,
        cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s', background: 'var(--gray-50)',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.background = 'white'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)'; }}
      >
        <input type="file" style={{ display: 'none' }} onChange={onChange} />
        <Upload size={22} color="var(--gray-400)" strokeWidth={1.5} />
        <span style={{ fontSize: 12, color: file ? 'var(--navy)' : 'var(--gray-400)', fontWeight: file ? 600 : 400 }}>
          {file ? file.name : 'Upload signed request letter'}
        </span>
      </label>
    </div>
  );
}

/* ── Staff Loan Application Modal ────────────────────────── */
function LoanApplicationModal({ onClose }) {
  const [form, setForm] = useState({ staffName: '', staffId: '', amount: '', tenor: '6 MONTHS' });
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.staffName || !form.staffId || !form.amount) {
      alert('Please fill in all required fields.'); return;
    }
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); }, 2200);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(13,27,53,0.55)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 300, padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, width: '100%', maxWidth: 540,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(13,27,53,0.25)', animation: 'modalIn 0.25s ease',
        overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--gray-100)', flexShrink: 0, position: 'sticky', top: 0, background: 'white', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--navy)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Staff Loan Application
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', borderRadius: 6, padding: 4, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--navy)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-400)'}
            ><X size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Row 1: Staff Name + Staff ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Staff Name</div>
              <input
                type="text" placeholder=""
                value={form.staffName} onChange={e => set('staffName', e.target.value)}
                style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '12px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1e293b', background: 'white', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--navy)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Staff ID</div>
              <input
                type="text" placeholder=""
                value={form.staffId} onChange={e => set('staffId', e.target.value)}
                style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '12px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1e293b', background: 'white', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--navy)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>
          </div>

          {/* Row 2: Amount + Tenor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Amount (₦)</div>
              <input
                type="text" placeholder=""
                value={form.amount} onChange={e => set('amount', e.target.value)}
                style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '12px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1e293b', background: 'white', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--navy)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Tenor</div>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.tenor} onChange={e => set('tenor', e.target.value)}
                  style={{
                    width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10,
                    padding: '12px 36px 12px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                    color: '#1e293b', background: 'white', outline: 'none', appearance: 'none', cursor: 'pointer',
                  }}
                >
                  {tenorOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {/* Chevron */}
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray-400)' }}>▾</span>
              </div>
            </div>
          </div>

          {/* Application PDF upload */}
          <FileUploadBox label="Application PDF" file={file} onChange={e => setFile(e.target.files?.[0] || null)} />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            style={{
              width: '100%', background: submitted ? 'var(--green)' : 'var(--navy)',
              color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 13, letterSpacing: '0.08em', border: 'none', borderRadius: 10,
              padding: '15px', cursor: 'pointer', transition: 'all 0.3s', marginTop: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {submitted ? '✓ APPLICATION SUBMITTED' : 'SUBMIT APPLICATION'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @media(max-width:480px){
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}

/* ── Staff Loans Page ────────────────────────────────────── */
export default function StaffLoans() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <PageHeader title="Employee Benefits Hub" subtitle="Bespoke Asset Management System V2.0" />

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card animate-in delay-1">
          <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Active Loan Portfolio</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--navy)', marginBottom: 6 }}>₦12,450,000</div>
          <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>↑ 100% Repayment Rate</div>
        </div>

        <div className="card animate-in delay-2">
          <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Total Beneficiaries</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--navy)', marginBottom: 6 }}>42 Employees</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Across all departments</div>
        </div>

        <div className="card animate-in delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-gold" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => setShowModal(true)}>
            + New Application
          </button>
        </div>

        <div className="card animate-in delay-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <BookOpen size={22} color="var(--navy)" strokeWidth={1.5} />
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Syne, sans-serif' }}>HR Monthly Ledger</div>
        </div>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="animate-in delay-4">
        {/* Active */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active / Performing Loans</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['Employee', 'Principal (₦)', 'Dept', ''].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeLoans.map(l => (
                <tr key={l.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.id}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--navy)' }}>{l.principal}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 10, background: 'var(--navy)', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{l.dept}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ width: 60, height: 4, background: 'var(--gray-100)', borderRadius: 2 }}>
                      <div style={{ width: `${l.progress}%`, height: '100%', background: 'var(--green)', borderRadius: 2 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closed */}
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
              {closedLoans.map(l => (
                <tr key={l.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.id}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--navy)' }}>{l.settled}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 10, color: l.statusColor, background: `${l.statusColor}18`, padding: '3px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && <LoanApplicationModal onClose={() => setShowModal(false)} />}

      <style>{`
        @media(max-width:900px){
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}
