import React, { useState } from 'react';
import { DollarSign, Clock, TrendingUp, ArrowUpRight, Edit2, Percent, BarChart2, X, AlertTriangle, ChevronRight } from 'lucide-react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const DESC_LIMIT = 110;

const RISK_COLOR = { Low: '#22c55e', Medium: '#f97316', High: '#ef4444' };

/**
 * ProductCard — displays a single investment product.
 *
 * Props:
 *   plan         — product object from store/API (mapped via mapProduct)
 *   onInvest     — (plan) => void — called when "Invest Now" is clicked
 *   onEdit       — (plan) => void — called when edit button is clicked (admin)
 *   onClick      — (plan) => void — called when the card body is clicked
 *   variant      — 'client' | 'admin' (default 'client')
 */
export default function ProductCard({ plan, onInvest, onEdit, onClick, variant = 'client', walletBalance = 0 }) {
  const [showReadMore, setShowReadMore] = useState(false);

  const desc    = plan.desc || plan.description || '';
  const isLong  = desc.length > DESC_LIMIT;
  const snippet = isLong ? desc.slice(0, DESC_LIMIT) + '…' : desc;

  const isActive = plan.status === 'ACTIVE';
  const riskColor = RISK_COLOR[plan.riskLevel] || 'var(--gray-400)';

  const metaItems = [
    { icon: DollarSign,  label: 'Min. Investment', value: plan.minInvest > 0 ? fmt(plan.minInvest) : 'Negotiable' },
    { icon: Clock,       label: 'Lock-in Period',  value: plan.lockIn || '—' },
    { icon: TrendingUp,  label: 'ROI (p.a.)',       value: plan.roi || '—' },
    { icon: Percent,     label: 'Wthld. Tax',       value: `${plan.withholdingTaxRate ?? 10}%` },
  ];

  const minInvest = plan.minInvest || 0;
  const canAfford = minInvest === 0 || walletBalance >= minInvest;
  const handleCardClick = () => { if (!showReadMore) onClick?.(plan); };

  return (
    <>
      <div
        style={{
          background: 'white', borderRadius: 16,
          border: `1px solid ${isActive ? 'var(--gray-200)' : '#f3f4f6'}`,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column', height: '100%',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: (onClick || onInvest) ? 'pointer' : 'default',
          opacity: isActive ? 1 : 0.7,
        }}
        onMouseEnter={e => {
          if (!showReadMore) {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 12px 32px ${plan.color}28`;
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onClick={handleCardClick}
      >
        {/* Accent bar */}
        <div style={{ height: 5, background: plan.color, flexShrink: 0 }} />

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Category + Status badges */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
                {plan.category && (
                  <span style={{ fontSize: 8, fontWeight: 700, color: plan.color, background: `${plan.color}15`, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    {plan.category}
                  </span>
                )}
                {plan.isNegotiated && (
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#8b5cf6', background: '#8b5cf615', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Negotiable
                  </span>
                )}
                {!isActive && (
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#ef4444', background: '#ef444415', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Inactive
                  </span>
                )}
              </div>
              {/* Name */}
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'var(--navy)', letterSpacing: '0.01em', lineHeight: 1.25 }}>
                {plan.name}
              </div>
            </div>

            {/* Right side: edit (admin) or ROI pill (client) */}
            {variant === 'admin' && onEdit ? (
              <button onClick={e => { e.stopPropagation(); onEdit(plan); }}
                style={{ background: `${plan.color}12`, border: 'none', borderRadius: 7, padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                <Edit2 size={13} color={plan.color} />
              </button>
            ) : (
              <div style={{ background: `${plan.color}12`, borderRadius: 8, padding: '7px 11px', textAlign: 'center', flexShrink: 0, marginLeft: 8 }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: plan.color, lineHeight: 1 }}>{plan.roi}</div>
                <div style={{ fontSize: 8, color: plan.color, opacity: 0.75, letterSpacing: '0.06em', marginTop: 2 }}>P.A.</div>
              </div>
            )}
          </div>

          {/* Risk level indicator */}
          {plan.riskLevel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
              <BarChart2 size={11} color={riskColor} />
              <span style={{ fontSize: 10, fontWeight: 700, color: riskColor, letterSpacing: '0.05em' }}>{plan.riskLevel} Risk</span>
            </div>
          )}

          {/* Description with Read More */}
          <div style={{ marginBottom: 14, flex: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.55, margin: 0 }}>
              {snippet || <span style={{ fontStyle: 'italic', color: 'var(--gray-300)' }}>No description provided.</span>}
              {isLong && (
                <button onClick={e => { e.stopPropagation(); setShowReadMore(true); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: plan.color, fontWeight: 700, fontSize: 12, padding: 0, marginLeft: 4 }}>
                  Read more
                </button>
              )}
            </p>
          </div>

          {/* Spacer so meta always sticks to bottom */}
          <div style={{ flex: 1 }} />

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 14 }}>
            {metaItems.map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--gray-50)', borderRadius: 8, padding: '7px 9px' }}>
                <Icon size={12} color={plan.color} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 8, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Client type badges */}
          {plan.clientTypes?.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
              {plan.clientTypes.map(ct => (
                <span key={ct} style={{ fontSize: 8, fontWeight: 700, color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '3px 8px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'capitalize' }}>
                  {ct}
                </span>
              ))}
            </div>
          )}

          {/* Early exit warning */}
          {plan.earlyExitPenalty > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fef3c7', borderRadius: 7, padding: '5px 9px', marginBottom: 12 }}>
              <AlertTriangle size={11} color="#d97706" />
              <span style={{ fontSize: 10, color: '#92400e', fontWeight: 600 }}>{plan.earlyExitPenalty}% early exit penalty applies</span>
            </div>
          )}

          {/* Insufficient balance note (hide for admin) */}
          {variant !== 'admin' && !canAfford && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', borderRadius: 8, padding: '7px 10px', marginBottom: 12 }}>
              <AlertTriangle size={12} color="#ef4444" />
              <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 600 }}>Wallet balance too low — min is {fmt(minInvest)}</span>
            </div>
          )}

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {variant === 'client' && onInvest && isActive && (
              <button onClick={e => { if (!canAfford) return; e.stopPropagation(); onInvest(plan); }}
                disabled={!canAfford}
                style={{ flex: 1, background: plan.color, color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 11, border: 'none', borderRadius: 8, padding: '11px', cursor: canAfford ? 'pointer' : 'not-allowed', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.2s', opacity: canAfford ? 1 : 0.45 }}
                onMouseEnter={e => { if (canAfford) e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { if (canAfford) e.currentTarget.style.opacity = '1'; }}>
                <ArrowUpRight size={13} /> Invest Now
              </button>
            )}
            {onClick && (
              <button onClick={e => { e.stopPropagation(); onClick(plan); }}
                style={{ background: 'var(--gray-100)', color: 'var(--navy)', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, border: 'none', borderRadius: 8, padding: '11px 14px', cursor: 'pointer', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.15s', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-200)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-100)'}>
                Details <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Read More modal */}
      {showReadMore && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowReadMore(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: '28px', maxWidth: 520, width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ height: 4, background: plan.color, borderRadius: 2, marginBottom: 18 }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>{plan.name}</div>
                {plan.category && <div style={{ fontSize: 10, color: plan.color, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 3 }}>{plan.category}</div>}
              </div>
              <button onClick={() => setShowReadMore(false)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 7, padding: 7, cursor: 'pointer', flexShrink: 0 }}>
                <X size={14} color="var(--gray-500)" />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 20 }}>{desc}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                ['ROI', plan.roi],
                ['Min. Investment', plan.minInvest > 0 ? fmt(plan.minInvest) : 'Negotiable'],
                ['Lock-in Period', plan.lockIn],
                ['Withholding Tax', `${plan.withholdingTaxRate ?? 10}%`],
                plan.riskLevel && ['Risk Level', plan.riskLevel],
                plan.earlyExitPenalty && ['Early Exit Penalty', `${plan.earlyExitPenalty}%`],
              ].filter(Boolean).map(([l, v]) => (
                <div key={l} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{v}</div>
                </div>
              ))}
            </div>
            {variant === 'client' && onInvest && isActive && (
              <button onClick={() => { if (!canAfford) return; setShowReadMore(false); onInvest(plan); }}
                disabled={!canAfford}
                style={{ width: '100%', background: plan.color, color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, border: 'none', borderRadius: 9, padding: '13px', cursor: canAfford ? 'pointer' : 'not-allowed', letterSpacing: '0.06em', textTransform: 'uppercase', opacity: canAfford ? 1 : 0.45 }}>
                {canAfford ? 'Invest Now' : `Need ${fmt(minInvest)} minimum`}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
