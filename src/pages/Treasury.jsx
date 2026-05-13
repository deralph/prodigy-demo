import React, { useState } from 'react';
import { PlusCircle, RefreshCcw, TrendingUp, ChevronDown, ChevronUp, X, Upload } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const tableProducts = [
  { name: 'Prodigy Aura',            roi: '28% ROI', balance: '₦50,000,000',  weight: '19.6%', color: '#e8b84b' },
  { name: 'Prodigy Flex-Tenure Note', roi: '22% ROI', balance: '₦42,500,000', weight: '16.7%', color: '#3b6ef8' },
  { name: 'Prodigy Genesis',          roi: '18% ROI', balance: '₦38,000,000',  weight: '14.9%', color: '#22c55e' },
  { name: 'Prodigy Liquidity Fund',   roi: '15% ROI', balance: '₦25,450,673',  weight: '10.0%', color: '#8b5cf6' },
  { name: 'Prodigy Apex',             roi: '32% ROI', balance: '₦98,500,000',  weight: '38.8%', color: '#f97316' },
];

const investPlans = [
  {
    id: 'aura', initial: 'P', color: '#22c55e',
    name: 'PRODIGY AURA', roi: '28% ROI',
    desc: 'A commodity-linked note focusing on sustainable, cyclical, and growth-aligned agro commodities trading.',
    minInvest: '₦₦50,000,000', lockIn: 'NONE', minRaw: 50000000,
  },
  {
    id: 'flex', initial: 'P', color: '#f97316',
    name: 'PRODIGY FLEX-TENURE NOTE', roi: '15-25% ROI',
    desc: 'High-yield flexible investment with rates based on amount and tenor.',
    minInvest: '₦₦100,000', lockIn: '30 - 365 DAYS', minRaw: 100000,
  },
  {
    id: 'genesis', initial: 'P', color: '#3b6ef8',
    name: 'PRODIGY GENESIS', roi: '30% ROI',
    desc: 'A property development focused fund taking positions in transformative, mid to high-end real estate projects.',
    minInvest: '₦₦100,000,000', lockIn: '12 MONTHS', minRaw: 100000000,
  },
  {
    id: 'liquidity', initial: 'P', color: '#0d1b35',
    name: 'PRODIGY LIQUIDITY FUND', roi: '17% ROI',
    desc: 'Designed to preserve capital and provide high liquidity with minimal risk.',
    minInvest: '₦₦5,000', lockIn: 'NONE', minRaw: 5000,
  },
  {
    id: 'vcf', initial: 'V', color: '#8b5cf6',
    name: 'VERIFIED CORP FUND', roi: 'Negotiated ROI',
    desc: "A customized investment vehicle tailored specifically for your organization's treasury objectives.",
    minInvest: 'NNEGOTIATED', lockIn: 'BESPOKE', minRaw: 0, negotiated: true,
  },
];

const pieData = tableProducts.map(p => ({ name: p.name, value: parseFloat(p.weight) }));

/* ── Shared Modal Shell ─────────────────────────────────────────── */
function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(13,27,53,0.55)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 300, padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, width: '100%', maxWidth: 560,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(13,27,53,0.25)',
        animation: 'modalIn 0.25s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 26px 16px', borderBottom: '1px solid var(--gray-100)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--navy)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {title}
              </h2>
              {subtitle && (
                <p style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)',
              padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--navy)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-400)'}
            ><X size={20} /></button>
          </div>
        </div>

        {children}
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ── File Upload Box ────────────────────────────────────────────── */
function FileUploadBox({ label, file, onChange }) {
  return (
    <div>
      {label && <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8 }}>{label}</div>}
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '28px 20px', border: '1.5px dashed var(--gray-200)', borderRadius: 12,
        cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s', background: 'var(--gray-50)',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.background = 'white'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)'; }}
      >
        <input type="file" style={{ display: 'none' }} onChange={onChange} />
        <Upload size={22} color="var(--gray-400)" strokeWidth={1.5} />
        <span style={{ fontSize: 12, color: file ? 'var(--navy)' : 'var(--gray-400)', fontWeight: file ? 600 : 400 }}>
          {file ? file.name : 'Upload board resolution / instruction'}
        </span>
      </label>
    </div>
  );
}

/* ── Subscribe Modal ────────────────────────────────────────────── */
function SubscribeModal({ onClose }) {
  const [openId, setOpenId] = useState(null);
  const [amounts, setAmounts] = useState({});
  const [invested, setInvested] = useState({});

  const toggle = (id) => setOpenId(prev => prev === id ? null : id);

  const handleInvest = (plan) => {
    if (plan.negotiated) {
      setInvested(prev => ({ ...prev, [plan.id]: true }));
      setTimeout(() => { setInvested(prev => ({ ...prev, [plan.id]: false })); setOpenId(null); }, 2000);
      return;
    }
    const amt = parseFloat((amounts[plan.id] || '').replace(/,/g, ''));
    if (!amt || amt < plan.minRaw) { alert(`Minimum investment is ${plan.minInvest}`); return; }
    setInvested(prev => ({ ...prev, [plan.id]: true }));
    setTimeout(() => { setInvested(prev => ({ ...prev, [plan.id]: false })); setOpenId(null); setAmounts(prev => ({ ...prev, [plan.id]: '' })); }, 2000);
  };

  return (
    <ModalShell title="Invest in Prodigy" subtitle="Source: Corporate Wallet (₦1,250,000)" onClose={onClose}>
      <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 20px' }}>
        {investPlans.map(plan => {
          const isOpen = openId === plan.id;
          const isSuccess = invested[plan.id];
          return (
            <div key={plan.id} style={{
              border: `1.5px solid ${isOpen ? plan.color + '66' : 'var(--gray-200)'}`,
              borderRadius: 14, marginBottom: 10, overflow: 'hidden',
              transition: 'border-color 0.2s', background: isOpen ? `${plan.color}07` : 'white',
            }}>
              {/* Accordion header */}
              <button onClick={() => toggle(plan.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: plan.color, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, flexShrink: 0,
                }}>{plan.initial}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.04em' }}>{plan.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>{plan.roi}</div>
                </div>
                {isOpen ? <ChevronUp size={16} color="var(--gray-400)" /> : <ChevronDown size={16} color="var(--gray-400)" />}
              </button>

              {/* Expanded */}
              {isOpen && (
                <div style={{ padding: '0 18px 18px' }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.04em', color: 'var(--gray-600)', lineHeight: 1.65, marginBottom: 16, textTransform: 'uppercase' }}>
                    {plan.desc}
                  </p>
                  {/* Min invest + lock-in pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    {[{ label: 'Min. Invest', val: plan.minInvest }, { label: 'Lock-In', val: plan.lockIn }].map(({ label, val }) => (
                      <div key={label} style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 5 }}>{label}</div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Amount */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Amount (₦)</div>
                    <input
                      type="text"
                      placeholder={plan.negotiated ? 'NEGOTIATED' : `MIN: ${plan.minInvest}`}
                      value={amounts[plan.id] || ''}
                      onChange={e => setAmounts(prev => ({ ...prev, [plan.id]: e.target.value }))}
                      disabled={plan.negotiated}
                      style={{
                        width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10,
                        padding: '12px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                        color: '#1e293b', background: plan.negotiated ? 'var(--gray-50)' : 'white',
                        outline: 'none',
                      }}
                      onFocus={e => !plan.negotiated && (e.target.style.borderColor = plan.color)}
                      onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                    />
                  </div>
                  {/* Invest button */}
                  <button
                    onClick={() => handleInvest(plan)}
                    style={{
                      width: '100%', background: isSuccess ? 'var(--green)' : 'var(--gold)',
                      color: isSuccess ? 'white' : 'var(--navy)',
                      fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13,
                      letterSpacing: '0.06em', border: 'none', borderRadius: 10,
                      padding: '14px', cursor: 'pointer', transition: 'all 0.3s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {isSuccess ? '✓ INVESTMENT SUBMITTED' : <><PlusCircle size={14} /> INVEST NOW</>}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

/* ── Redeem / Liquidate Modal ───────────────────────────────────── */
function RedeemModal({ onClose }) {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); }, 2000);
  };

  return (
    <ModalShell title="Liquidate Funds" onClose={onClose}>
      <div style={{ padding: '20px 26px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Amount */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Amount (₦)</div>
          <input
            type="text"
            placeholder="PRINCIPAL"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10,
              padding: '13px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 14,
              color: '#1e293b', background: 'white', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--navy)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
          />
        </div>

        {/* File upload */}
        <FileUploadBox label="Instruction (Upload)" file={file} onChange={e => setFile(e.target.files?.[0] || null)} />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%', background: submitted ? 'var(--green)' : 'var(--navy)',
            color: 'white', fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 13, letterSpacing: '0.08em', border: 'none', borderRadius: 10,
            padding: '15px', cursor: 'pointer', transition: 'all 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {submitted ? '✓ REQUEST SUBMITTED' : 'SUBMIT REQUEST'}
        </button>
      </div>
    </ModalShell>
  );
}

/* ── Treasury Page ──────────────────────────────────────────────── */
export default function Treasury() {
  const [modal, setModal] = useState(null); // 'subscribe' | 'redeem' | null

  return (
    <div>
      <PageHeader title="Treasury Portfolio Overview" subtitle="Bespoke Asset Management System V2.0" />

      {/* Live Liquidity Monitor */}
      <div style={{
        background: 'var(--navy)', borderRadius: 14, padding: '28px 32px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
      }} className="animate-in delay-1">
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(232,184,75,0.06)', pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live Liquidity Monitor
            </p>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 44px)', color: 'white', letterSpacing: '-0.01em', marginBottom: 8 }}>
              ₦25,450,673.60
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={13} color="var(--green)" />
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>+17% P.A.</span>
              &nbsp;· Last Accrual: Just Now
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => setModal('subscribe')}>
              <PlusCircle size={14} /> Subscribe
            </button>
            <button className="btn-gold" onClick={() => setModal('redeem')}>
              <RefreshCcw size={14} /> Redeem
            </button>
          </div>
        </div>
      </div>

      {/* Summary + Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, marginBottom: 24, alignItems: 'start' }} className="animate-in delay-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Executive Investment Summary
            </h3>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Consolidated ROI</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--navy)' }}>23.4%</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)' }}>
                  {['Product', 'ROI', 'Risk', 'Balance (₦)', 'Weight'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableProducts.map((p, i) => (
                  <tr key={p.name} style={{ borderTop: '1px solid var(--gray-100)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}><span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.roi}</span></td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ width: 60, height: 4, background: 'var(--gray-100)', borderRadius: 2 }}>
                        <div style={{ width: `${30 + i * 15}%`, height: '100%', background: p.color, borderRadius: 2 }} />
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>{p.balance}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--gray-600)' }}>{p.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie */}
        <div className="card" style={{ minWidth: 200, width: 220 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Allocation</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={tableProducts[i].color} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {tableProducts.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--gray-600)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--navy)' }}>{p.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'subscribe' && <SubscribeModal onClose={() => setModal(null)} />}
      {modal === 'redeem'    && <RedeemModal    onClose={() => setModal(null)} />}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media(max-width:768px){
          div[style*="grid-template-columns: 1fr auto"]{grid-template-columns:1fr!important;}
          div[style*="min-width: 200px"]{width:100%!important;}
        }
      `}</style>
    </div>
  );
}
