import React from 'react';
import { Eye } from 'lucide-react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const STATUS_STYLE = {
  active:           { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)',  label: 'Active' },
  pending_approval: { color: '#eab308',      bg: 'rgba(234,179,8,0.12)', label: 'Pending Approval' },
  matured:          { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)',label: 'Matured' },
  pre_term:         { color: '#f97316',      bg: 'rgba(249,115,22,0.1)', label: 'Pre-Term' },
  rejected:         { color: 'var(--red)',   bg: 'rgba(239,68,68,0.1)',  label: 'Rejected' },
};

/**
 * InvestmentCard — displays a single investment holding.
 *
 * Props:
 *   investment  — investment object from store/API
 *   planColor   — accent color for the card (from matched plan)
 *   onOpen      — (investment) => void — opens the investment dashboard drawer
 */
export default function InvestmentCard({ investment: inv, planColor = 'var(--navy)', onOpen }) {
  const st = STATUS_STYLE[inv.status] || STATUS_STYLE.active;
  const gross = (inv.amount * inv.roi) / 100;
  const tax   = (gross * (inv.tax || 0)) / 100;
  const net   = gross - tax;

  const metaFields = [
    ['Principal', fmt(inv.amount)],
    ['ROI',       `${inv.roi}%`],
    ['Tax',       `${inv.tax || 0}%`],
    ['Tenor',     inv.tenor],
    ['Value Date', inv.valueDate],
    ['Maturity',  inv.maturityDate],
  ];

  return (
    <div
      style={{
        background: 'white', borderRadius: 14,
        border: '1px solid var(--gray-200)', overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,27,53,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ height: 4, background: planColor }} />
      <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

        {/* Left: name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>
              {inv.plan}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: st.color, background: st.bg, padding: '2px 7px', borderRadius: 4,
            }}>
              {st.label}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '7px 18px', marginTop: 6 }}>
            {metaFields.map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginTop: 1 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: returns + CTA */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
            Est. Net Return
          </div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--green)', marginBottom: 2 }}>
            {fmt(net)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 12 }}>
            Gross: {fmt(gross)} · Tax: {fmt(tax)}
          </div>
          {onOpen && (
            <button
              onClick={() => onOpen(inv)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                background: 'var(--navy)', color: 'white', border: 'none',
                borderRadius: 8, cursor: 'pointer',
                fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11,
              }}
            >
              <Eye size={12} /> Open Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
