import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/ui/PageHeader';

const RISK_DETAILS = {
  apex:     { vol:'Very Low. Structured product with fixed, pre-determined returns backed by government securities.', cap:'HIGH — Guaranteed Returns with a Strong Foundation of Safety.', icon:'🏛', color:'#22c55e' },
  liquidity:{ vol:'Very Low. Designed to mimic savings account stability with a pegged ROI (15% P.A.).', cap:'HIGH — Explicitly low-risk utilizing secure, short-term instruments.', icon:'💧', color:'#3b82f6' },
  vantage:  { vol:'Medium–High. Includes commodities, stocks, and equity markets subject to global economic shifts.', cap:'MEDIUM — Disciplined risk management, but exposed to market performance risks.', icon:'📊', color:'#8b5cf6' },
  genesis:  { vol:'Medium. Real estate carries execution and market cycle risk, less liquid than bonds.', cap:'MEDIUM — Asset-backed and collateralised, but 25–33% ROI signals higher risk profile.', icon:'🏗', color:'#ec4899' },
  aura:     { vol:'Medium. Infrastructure and green energy projects carry regulatory and execution risks.', cap:'MEDIUM — Impact-focused, 16% ROI with 180-day lock-in.', icon:'🌱', color:'#10b981' },
  flex:     { vol:'Low–Medium. Flexible tenure options mean varying risk based on duration and market conditions.', cap:'MEDIUM — 12–18% returns via diversified short-term instruments.', icon:'⚡', color:'#f97316' },
  vcf:      { vol:'Customized — risk profile bespoke to each corporate mandate and negotiated terms.', cap:'CUSTOMIZED — Structured specifically for corporate treasury objectives.', icon:'🏢', color:'#6366f1' },
};
const DOT_COLORS = ['#22c55e','#f97316','#3b82f6','#8b5cf6','#ec4899','#0d1b35','#6366f1','#e8b84b'];

/* ── Risk card ── */
function RiskCard({ plan, rd, delay }) {
  return (
    <div className={`card animate-in delay-${delay}`} style={{ padding:0, overflow:'hidden' }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--gray-100)', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:rd.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
          {rd.icon}
        </div>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13, color:'var(--navy)', letterSpacing:'0.04em' }}>{plan.name.toUpperCase()}</div>
          <div style={{ fontSize:11, color:'var(--green)', fontWeight:700, marginTop:2 }}>{plan.roi}</div>
        </div>
      </div>
      <div style={{ padding:'16px 20px' }}>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', fontWeight:700, marginBottom:6 }}>Risk Methodology</div>
          <p style={{ fontSize:11, color:'var(--gray-600)', lineHeight:1.65 }}>{rd.vol}</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', fontWeight:700, marginBottom:6 }}>Volatility Band</div>
            <p style={{ fontSize:10, color:'var(--navy)', lineHeight:1.6, fontWeight:500 }}>{rd.vol.split('.')[0]}.</p>
          </div>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)', fontWeight:700, marginBottom:6 }}>Capital Protection</div>
            <p style={{ fontSize:10, color:'var(--navy)', lineHeight:1.6, fontWeight:600 }}>{rd.cap.split('.')[0]}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RiskStrategy() {
  const { plans, clientInvestments } = useAppStore();

  const activeInvs = useMemo(() =>
    clientInvestments.filter(i => ['active','pending_approval'].includes(i.status) && i.preTermStatus !== 'disbursed')
  , [clientInvestments]);

  const totalBalance = useMemo(() =>
    activeInvs.reduce((s, i) => s + (i.amount || 0), 0)
  , [activeInvs]);

  const tableRows = useMemo(() =>
    activeInvs.map((inv, idx) => {
      const balance  = inv.amount || 0;
      const weight   = totalBalance > 0 ? ((balance / totalBalance) * 100).toFixed(1) + '%' : '—';
      const planObj  = plans.find(p => p.id === inv.planId) || {};
      return {
        name:    inv.plan || `Investment ${idx + 1}`,
        roi:     inv.roi  ? `${inv.roi}% p.a.` : planObj.roi || '—',
        risk:    planObj.riskLevel || 'Moderate',
        balance: '₦' + Number(balance).toLocaleString('en-NG'),
        weight,
        dot:     DOT_COLORS[idx % DOT_COLORS.length],
      };
    })
  , [activeInvs, totalBalance, plans]);

  const avgRoi = useMemo(() => {
    const withRoi = activeInvs.filter(i => i.roi > 0);
    if (!withRoi.length) return null;
    return (withRoi.reduce((s, i) => s + i.roi, 0) / withRoi.length).toFixed(1);
  }, [activeInvs]);

  return (
    <div>
      <PageHeader title="Risk & Strategy Registry" subtitle="Bespoke Asset Management System V2.0" />

      {/* Executive summary table */}
      <div className="card animate-in delay-1" style={{ padding:0, overflow:'hidden', marginBottom:24 }}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color:'var(--navy)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Executive Investment Summary</h3>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Avg. ROI</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'var(--navy)' }}>{avgRoi ? `${avgRoi}%` : '—'}</div>
          </div>
        </div>
        {tableRows.length === 0
          ? <EmptyState icon={TrendingUp} title="No investments" message="Your booked investment positions will appear in this executive summary." />
          : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--gray-50)' }}>
                    {['Product','ROI','Risk','Balance (₦)','Weight'].map(h => (
                      <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, color:'var(--gray-400)', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(p => (
                    <tr key={p.name} style={{ borderTop:'1px solid var(--gray-100)', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--gray-50)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'14px 18px' }}><div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ width:8, height:8, borderRadius:'50%', background:p.dot, display:'inline-block' }}/><span style={{ fontSize:13, fontWeight:600, color:'var(--navy)' }}>{p.name}</span></div></td>
                      <td style={{ padding:'14px 18px' }}><span style={{ fontSize:12, fontWeight:700, color:'var(--green)' }}>{p.roi}</span></td>
                      <td style={{ padding:'14px 18px' }}><span style={{ fontSize:10, fontWeight:700, color:'#6366f1', background:'rgba(99,102,241,0.1)', padding:'3px 8px', borderRadius:4, letterSpacing:'0.06em' }}>{p.risk}</span></td>
                      <td style={{ padding:'14px 18px', fontSize:13, color:'var(--navy)', fontWeight:500 }}>{p.balance}</td>
                      <td style={{ padding:'14px 18px', fontSize:13, color:'var(--gray-600)' }}>{p.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* Risk section heading */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'16px 20px', background:'white', borderRadius:12, border:'1px solid var(--gray-200)' }} className="animate-in delay-2">
        <span style={{ fontSize:18 }}>🎯</span>
        <div>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:14, color:'var(--navy)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Risk Categorization & Strategy</h3>
          <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2 }}>Methodology & Capital Protection Registry</p>
        </div>
      </div>

      {/* Risk cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:20 }}>
        {plans.map((plan, i) => {
          const rd = RISK_DETAILS[plan.id];
          if (!rd) return null;
          return <RiskCard key={plan.id} plan={plan} rd={rd} delay={Math.min(i + 1, 5)} />;
        })}
      </div>
    </div>
  );
}
