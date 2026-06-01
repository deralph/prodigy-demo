import React from 'react';
import { DollarSign, Clock, Shield, TrendingUp, ArrowUpRight, Edit2 } from 'lucide-react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

/**
 * ProductCard — displays a single investment product.
 *
 * Props:
 *   plan         — product object from store/API
 *   onInvest     — (plan) => void — called when "Invest Now" is clicked (optional)
 *   onEdit       — (plan) => void — called when edit button is clicked (optional, shows edit icon)
 *   onClick      — (plan) => void — called when card body is clicked (optional)
 *   variant      — 'client' (invest button) | 'admin' (edit button) (default 'client')
 */
export default function ProductCard({ plan, onInvest, onEdit, onClick, variant = 'client' }) {
  const metaItems = [
    { icon: DollarSign, label: 'Min. Investment', value: plan.minInvest > 0 ? fmt(plan.minInvest) : 'Negotiable' },
    { icon: Clock,      label: 'Lock-in Period',  value: plan.lockIn || '—' },
    { icon: Shield,     label: 'Status',           value: plan.status === 'ACTIVE' ? 'Open' : 'Closed' },
    { icon: TrendingUp, label: 'Type',             value: plan.isNegotiated ? 'Negotiable' : 'Fixed' },
  ];

  return (
    <div
      style={{
        background: 'white', borderRadius: 16,
        border: '1px solid var(--gray-200)', overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 12px 32px ${plan.color}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={() => onClick?.(plan)}
    >
      {/* Accent bar */}
      <div style={{ height: 5, background: plan.color }} />

      <div style={{ padding: '20px 22px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{
              fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15,
              color: 'var(--navy)', letterSpacing: '0.02em',
            }}>
              {plan.name}
            </div>
            {plan.tag && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: plan.color,
                background: `${plan.color}15`, padding: '2px 7px',
                borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase',
                marginTop: 4, display: 'inline-block',
              }}>
                {plan.tag}
              </span>
            )}
          </div>

          {variant === 'admin' && onEdit ? (
            <button
              onClick={e => { e.stopPropagation(); onEdit(plan); }}
              style={{
                background: `${plan.color}12`, border: 'none',
                borderRadius: 7, padding: '7px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Edit2 size={13} color={plan.color} />
            </button>
          ) : (
            <div style={{
              background: `${plan.color}12`, borderRadius: 8, padding: '8px 12px', textAlign: 'right',
            }}>
              <div style={{
                fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: plan.color,
              }}>
                {plan.roi}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.5, marginBottom: 16 }}>
          {plan.desc || plan.description}
        </p>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {metaItems.map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon size={12} color="var(--gray-400)" />
              <div>
                <div style={{ fontSize: 8, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Client types (admin variant) */}
        {variant === 'admin' && plan.clientTypes?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
            {plan.clientTypes.map(ct => (
              <span key={ct} style={{
                fontSize: 9, fontWeight: 700, color: plan.color,
                background: `${plan.color}12`, padding: '3px 8px',
                borderRadius: 4, letterSpacing: '0.06em', textTransform: 'capitalize',
              }}>
                {ct}
              </span>
            ))}
          </div>
        )}

        {/* CTA (client variant only) */}
        {variant === 'client' && onInvest && (
          <button
            onClick={e => { e.stopPropagation(); onInvest(plan); }}
            style={{
              width: '100%', background: plan.color, color: 'white',
              fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 11,
              border: 'none', borderRadius: 8, padding: '12px', cursor: 'pointer',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <ArrowUpRight size={13} /> Invest Now
          </button>
        )}
      </div>
    </div>
  );
}
