import React from 'react';
import PageHeader from '../../components/PageHeader';
import useAppStore from '../../store/useAppStore';

const RISK_DETAILS = {
  apex:     { vol:'Very Low. As a structured product with a fixed, pre-determined return, the value does not fluctuate with market sentiment in the same way equities do.', cap:'HIGH. The product explicitly mentions "Guaranteed Returns" and a "Strong Foundation of Safety", backed by government securities.', icon:'🏛', color:'#22c55e' },
  liquidity:{ vol:'Very Low. Designed to mimic the stability of a savings account with a pegged ROI (15% P.A.), ensuring stable returns without capital locking.', cap:'HIGH. Described explicitly as a "low-risk investment product" utilizing "secure" instruments.', icon:'💧', color:'#3b82f6' },
  vantage:  { vol:'Medium to High. Unlike the fixed-income notes, this portfolio includes commodities, stocks and equity markets which are subject to market fluctuations and global economic shifts.', cap:'MEDIUM. While the product mentions a "disciplined approach to risk management", the inclusion of equities and commodities means capital is exposed to market performance risks.', icon:'📊', color:'#8b5cf6' },
  genesis:  { vol:'Medium. Real estate development carries execution risk and market cycle risk. While less volatile than stocks, it is less liquid and more volatile than government bonds.', cap:'MEDIUM. Although it is "collateralized" and "asset-backed", the high return potential (25-33%) indicates a higher risk profile than standard fixed-income notes.', icon:'🏗', color:'#ec4899' },
  aura:     { vol:'Medium. Infrastructure and green energy projects carry project execution risks, regulatory risks, and longer gestation periods.', cap:'MEDIUM. The fund focuses on sustainable and impact-focused investments, offering 16% ROI with 180-day lock-in.', icon:'🌱', color:'#10b981' },
  flex:     { vol:'Low-Medium. Flexible tenure options mean the risk profile varies based on duration and market conditions at time of investment.', cap:'MEDIUM. Returns of 12-18% vary based on amount and tenor selected. Capital is protected via diversified short-term instruments.', icon:'⚡', color:'#f97316' },
  vcf:      { vol:'Customized. Risk profile is bespoke to each corporate mandate and negotiated terms.', cap:'CUSTOMIZED. Structured specifically for corporate treasury objectives with negotiated ROI and bespoke liquidation cycle.', icon:'🏢', color:'#6366f1' },
};

export default function RiskStrategy() {
  const { plans } = useAppStore();
  return (
    <div>
      <PageHeader title="Methodology & Methodology Registry" subtitle="Bespoke Asset Management System V2.0" />

      {/* Summary table */}
      <div className="card animate-in delay-1" style={{ padding:0, overflow:'hidden', marginBottom:24 }}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color:'var(--navy)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Executive Investment Summary</h3>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Consolidated ROI</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'var(--navy)' }}>23.4%</div>
          </div>
        </div>
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
              {[
                { name:'Prodigy Apex',         roi:'20% ROI',     risk:'LOW',         riskColor:'#22c55e',  balance:'₦50,000,000',   weight:'16.8%', dot:'#22c55e' },
                { name:'Prodigy Flexi-Tenure', roi:'12-18% ROI',  risk:'LOW-MEDIUM',  riskColor:'#84cc16',  balance:'₦15,000,000',   weight:'5.0%',  dot:'#f97316' },
                { name:'Prodigy Aura',          roi:'16% ROI',     risk:'MEDIUM',      riskColor:'#f97316',  balance:'₦20,000,000',   weight:'6.7%',  dot:'#3b82f6' },
                { name:'Prodigy Vantage',       roi:'FX LINKED',   risk:'MEDIUM-HIGH', riskColor:'#ef4444',  balance:'₦12,500,000',   weight:'4.2%',  dot:'#8b5cf6' },
                { name:'Prodigy Genesis',       roi:'25-33% ROI',  risk:'MEDIUM',      riskColor:'#f97316',  balance:'₦100,000,000',  weight:'33.6%', dot:'#ec4899' },
                { name:'Prodigy Liquidity',     roi:'15% ROI',     risk:'VERY LOW',    riskColor:'#22c55e',  balance:'₦25,450,670',   weight:'8.5%',  dot:'#0d1b35' },
                { name:'Verified Corp Fund',    roi:'BESPOKE ROI', risk:'CUSTOMIZED',  riskColor:'#8b5cf6',  balance:'₦75,000,000',   weight:'25.2%', dot:'#6366f1' },
              ].map(p => (
                <tr key={p.name} style={{ borderTop:'1px solid var(--gray-100)', transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--gray-50)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:p.dot, display:'inline-block' }} />
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--navy)' }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'14px 18px' }}><span style={{ fontSize:12, fontWeight:700, color:'var(--green)' }}>{p.roi}</span></td>
                  <td style={{ padding:'14px 18px' }}><span style={{ fontSize:10, fontWeight:700, color:p.riskColor, background:`${p.riskColor}18`, padding:'3px 8px', borderRadius:4, letterSpacing:'0.06em' }}>{p.risk}</span></td>
                  <td style={{ padding:'14px 18px', fontSize:13, color:'var(--navy)', fontWeight:500 }}>{p.balance}</td>
                  <td style={{ padding:'14px 18px', fontSize:13, color:'var(--gray-600)' }}>{p.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Strategy heading */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'16px 20px', background:'white', borderRadius:12, border:'1px solid var(--gray-200)' }} className="animate-in delay-2">
        <span style={{ fontSize:18 }}>🎯</span>
        <div>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:14, color:'var(--navy)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Risk Categorization & Strategy</h3>
          <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2 }}>Methodology & Capital Protection Registry</p>
        </div>
      </div>

      {/* Risk cards grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(340px, 1fr))', gap:20 }}>
        {plans.map((plan, i) => {
          const rd = RISK_DETAILS[plan.id];
          if (!rd) return null;
          return (
            <div key={plan.id} className={`card animate-in delay-${Math.min(i+1,5)}`} style={{ padding:0, overflow:'hidden' }}>
              {/* Card header */}
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--gray-100)', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:rd.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                  {rd.icon}
                </div>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13, color:'var(--navy)', letterSpacing:'0.04em' }}>{plan.name.toUpperCase()} — {plan.id === 'apex' ? 'TENURED NOTE' : plan.id === 'liquidity' ? 'NOTE' : plan.id === 'vantage' ? 'FX NOTE' : plan.id === 'genesis' ? '' : plan.id === 'flex' ? 'TENURE NOTE' : ''}</div>
                  <div style={{ fontSize:11, color:'var(--green)', fontWeight:700, marginTop:2 }}>{plan.roi}</div>
                </div>
              </div>
              <div style={{ padding:'16px 20px' }}>
                {/* Risk methodology */}
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
        })}
      </div>
    </div>
  );
}
