import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Clock, TrendingUp, Percent, BarChart2,
  AlertTriangle, Users, CheckCircle, XCircle, Calendar, Shield,
  ChevronRight, ArrowUpRight, Info,
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import ModalOverlay from '../../components/ui/ModalOverlay';
import DetailRow from '../../components/ui/DetailRow';

const fmt   = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const RISK_COLOR  = { Low: '#22c55e', Medium: '#f97316', High: '#ef4444' };
const RISK_BG     = { Low: '#f0fdf4',  Medium: '#fff7ed',  High: '#fef2f2' };

function StatPill({ label, value, color, icon: Icon }) {
  return (
    <div style={{ background: color ? `${color}10` : 'var(--gray-50)', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={13} color={color || 'var(--gray-400)'} />}
        <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: color || 'var(--navy)', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 11, color: 'var(--navy)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, borderBottom: '1px solid var(--gray-100)', paddingBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plans, user, walletBalance } = useAppStore();
  const [subModal, setSubModal]   = useState(false);
  const [tenor, setTenor]         = useState('');
  const [amount, setAmount]       = useState('');
  const [rollover, setRollover]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subError, setSubError]   = useState('');

  const plan = useMemo(() => plans.find(p => p.id === id), [plans, id]);

  if (!plan) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--gray-400)', marginBottom: 16 }}>Product not found or no longer available.</div>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 9, padding: '11px 22px', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12 }}>
          Go Back
        </button>
      </div>
    );
  }

  const isActive      = plan.status === 'ACTIVE';
  const riskColor     = RISK_COLOR[plan.riskLevel];
  const riskBg        = RISK_BG[plan.riskLevel];
  const minInvest     = plan.minInvest || 0;
  const canAfford     = minInvest === 0 || walletBalance >= minInvest;
  const canInvest     = isActive && user?.role !== 'admin' && canAfford;

  const handleSubscribe = async () => {
    setSubError('');
    setSubmitting(true);
    try {
      const api = await import('../../services/api');
      const investAmount = parseFloat(amount);
      await api.investmentApi.subscribe({
        productId: plan.id,
        amount: investAmount,
        tenor: plan.hasTenor ? tenor : plan.lockInStr || plan.lockIn,
        autoRollover: rollover,
      });
      setSubmitted(true);
      // Refresh wallet, transactions, and investments so user sees updated data
      const { refreshWallet, refreshInvestments } = useAppStore.getState();
      if (refreshWallet) refreshWallet();
      if (refreshInvestments) refreshInvestments();
    } catch (err) {
      setSubError(err?.message || 'Subscription failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const tenorOptions = plan.hasTenor && plan.tenorOptions?.length
    ? plan.tenorOptions
    : plan.lockInStr ? [plan.lockInStr] : plan.lockIn ? [plan.lockIn] : [];

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, color: 'var(--gray-400)', fontSize: 12, fontWeight: 600, marginBottom: 20, padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--navy)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-400)'}>
        <ArrowLeft size={15} /> Back to Products
      </button>

      {/* Hero */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: 6, background: plan.color }} />
        <div style={{ padding: '28px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                {plan.category && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: plan.color, background: `${plan.color}15`, padding: '3px 9px', borderRadius: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {plan.category}
                  </span>
                )}
                {plan.riskLevel && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: riskColor, background: riskBg, padding: '3px 9px', borderRadius: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {plan.riskLevel} Risk
                  </span>
                )}
                {plan.isNegotiated && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6', background: '#8b5cf615', padding: '3px 9px', borderRadius: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Negotiable
                  </span>
                )}
                <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? '#22c55e' : '#ef4444', background: isActive ? '#f0fdf4' : '#fef2f2', padding: '3px 9px', borderRadius: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {isActive ? 'Open for Investment' : 'Closed'}
                </span>
              </div>
              <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--navy)', margin: 0, lineHeight: 1.2 }}>{plan.name}</h1>
            </div>
            {canInvest && (
              <button onClick={() => setSubModal(true)}
                style={{ background: plan.color, color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, border: 'none', borderRadius: 10, padding: '13px 24px', cursor: 'pointer', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <ArrowUpRight size={15} /> INVEST NOW
              </button>
            )}
          </div>

          {/* Key stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <StatPill label="Annual Return" value={plan.roi} color={plan.color} icon={TrendingUp} />
            <StatPill label="Min. Investment" value={plan.minInvest > 0 ? fmt(plan.minInvest) : 'Negotiable'} icon={DollarSign} />
            <StatPill label="Lock-in Period" value={plan.lockIn || '—'} icon={Clock} />
            <StatPill label="Withholding Tax" value={`${plan.withholdingTaxRate ?? 10}%`} icon={Percent} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        {/* Left column */}
        <div>
          {/* Description */}
          {plan.desc && (
            <SectionCard title="About This Product">
              <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.75, margin: 0 }}>{plan.desc}</p>
            </SectionCard>
          )}

          {/* Investment Terms */}
          <SectionCard title="Investment Terms">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <DetailRow label="Return on Investment" value={plan.roi} />
              <DetailRow label="Lock-in Period" value={plan.lockIn || '—'} />
              {plan.hasTenor && plan.tenorOptions?.length > 0 && (
                <DetailRow label="Available Tenors" value={plan.tenorOptions.join(' · ')} />
              )}
              <DetailRow label="Min. Investment" value={plan.minInvest > 0 ? fmt(plan.minInvest) : 'Negotiable'} />
              {plan.maxInvest && <DetailRow label="Max. Investment" value={fmt(plan.maxInvest)} />}
              <DetailRow label="Withholding Tax" value={`${plan.withholdingTaxRate ?? 10}%`} />
              {plan.earlyExitPenalty > 0 && <DetailRow label="Early Exit Penalty" value={`${plan.earlyExitPenalty}%`} />}
              <DetailRow label="Terms" value={plan.isNegotiated ? 'Negotiable — contact your relationship manager' : 'Fixed rate product'} />
            </div>
          </SectionCard>

          {/* Early exit warning */}
          {plan.earlyExitPenalty > 0 && (
            <div style={{ background: '#fef3c7', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: '#92400e', marginBottom: 3 }}>Early Exit Penalty</div>
                <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>
                  A {plan.earlyExitPenalty}% penalty applies if you opt out before the lock-in period ends. This will be deducted from your principal or accrued interest.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div>
          {/* Eligibility */}
          <SectionCard title="Eligibility">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['corporate', 'individual', 'joint'].map(ct => {
                const eligible = plan.clientTypes?.includes(ct);
                return (
                  <div key={ct} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: eligible ? '#f0fdf4' : 'var(--gray-50)' }}>
                    {eligible
                      ? <CheckCircle size={14} color="#22c55e" />
                      : <XCircle size={14} color="var(--gray-300)" />
                    }
                    <span style={{ fontSize: 12, fontWeight: 600, color: eligible ? 'var(--navy)' : 'var(--gray-400)', textTransform: 'capitalize' }}>{ct} Clients</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Quick facts */}
          <SectionCard title="Quick Facts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {plan.category && <DetailRow label="Category" value={plan.category} />}
              {plan.riskLevel && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Risk Level</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: riskColor, background: riskBg, padding: '2px 9px', borderRadius: 4 }}>{plan.riskLevel}</span>
                </div>
              )}
              <DetailRow label="Product Status" value={isActive ? 'Active' : 'Inactive'} />
              <DetailRow label="Terms" value={plan.isNegotiated ? 'Negotiable' : 'Fixed'} />
            </div>
          </SectionCard>

          {/* Invest CTA (sticky) */}
          {canInvest && (
            <div style={{ background: 'white', borderRadius: 14, border: `1.5px solid ${plan.color}40`, padding: '20px 22px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: plan.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Ready to invest?</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.5, marginBottom: 16 }}>
                Your wallet balance: <strong style={{ color: 'var(--navy)' }}>{fmt(walletBalance)}</strong>
              </div>
              <button onClick={() => setSubModal(true)}
                style={{ width: '100%', background: plan.color, color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, border: 'none', borderRadius: 9, padding: '13px', cursor: 'pointer', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <ArrowUpRight size={14} /> Invest Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subscription modal */}
      {subModal && (
        <ModalOverlay
          onClose={() => { setSubModal(false); setSubmitted(false); setSubError(''); setAmount(''); setTenor(''); }}
          maxWidth={480}
          headerContent={
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'white' }}>
              {submitted ? 'Subscription Submitted' : `Invest in ${plan.name}`}
            </div>
          }
          headerColor={plan.color}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 14 }} />
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>Application Submitted!</div>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 20 }}>
                Your investment request for <strong>{plan.name}</strong> is now pending approval by our operations team. You'll be notified once it's reviewed.
              </p>
              <button onClick={() => { setSubModal(false); setSubmitted(false); setAmount(''); setTenor(''); }}
                style={{ background: plan.color, color: 'white', border: 'none', borderRadius: 9, padding: '12px 28px', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em' }}>
                DONE
              </button>
            </div>
          ) : (
            <div>
              {/* Product summary */}
              <div style={{ background: `${plan.color}08`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>ROI</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: plan.color }}>{plan.roi}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>Lock-in</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{plan.lockIn}</div>
                </div>
              </div>

              {/* Amount */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Investment Amount (₦)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontWeight: 700 }}>₦</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min: ${fmt(plan.minInvest)}`}
                    style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '11px 12px 11px 26px', fontFamily: 'DM Sans,sans-serif', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = plan.color}
                    onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 5, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Wallet balance: <strong style={{ color: 'var(--navy)' }}>{fmt(walletBalance)}</strong></span>
                  {amount && parseFloat(amount) > walletBalance && (
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>Exceeds balance</span>
                  )}
                </div>
              </div>

              {/* Tenor (if flexible) */}
              {plan.hasTenor && tenorOptions.length > 1 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                    Select Tenor
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tenorOptions.map(t => (
                      <button key={t} onClick={() => setTenor(t)}
                        style={{ padding: '7px 14px', borderRadius: 7, border: `1.5px solid ${tenor === t ? plan.color : 'var(--gray-200)'}`, background: tenor === t ? `${plan.color}15` : 'white', color: tenor === t ? plan.color : 'var(--gray-500)', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto-rollover */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 9 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Auto-Rollover</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Automatically reinvest at maturity</div>
                </div>
                <button onClick={() => setRollover(r => !r)}
                  style={{ width: 42, height: 22, borderRadius: 11, background: rollover ? plan.color : 'var(--gray-200)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: rollover ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block' }} />
                </button>
              </div>

              {/* Fee note */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 20, padding: '10px 14px', background: '#eff6ff', borderRadius: 9 }}>
                <Info size={14} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: '#1d4ed8', margin: 0, lineHeight: 1.5 }}>
                  A {plan.withholdingTaxRate ?? 10}% withholding tax applies to interest earned. Your subscription is subject to admin approval before activation.
                </p>
              </div>

              {subError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>{subError}</div>
                </div>
              )}

              <button onClick={handleSubscribe}
                disabled={submitting || !amount || parseFloat(amount) < (plan.minInvest || 0) || parseFloat(amount) > walletBalance}
                style={{ width: '100%', background: plan.color, color: 'white', border: 'none', borderRadius: 9, padding: '14px', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (submitting || !amount || parseFloat(amount) < (plan.minInvest || 0) || parseFloat(amount) > walletBalance) ? 0.55 : 1, transition: 'opacity 0.2s' }}>
                <ArrowUpRight size={15} />
                {submitting ? 'SUBMITTING…' : 'CONFIRM INVESTMENT'}
              </button>
            </div>
          )}
        </ModalOverlay>
      )}
    </div>
  );
}
