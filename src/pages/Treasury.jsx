import React, { useState } from 'react';
import { PlusCircle, RefreshCcw, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from './components/ui/PageHeader';
import ModalOverlay from './components/ui/ModalOverlay';
import FileUploadBox from './components/ui/FileUploadBox';
import PortfolioHero from './components/portfolio/PortfolioHero';
import SectionCard from './components/ui/SectionCard';
import ProgressBar from './components/ui/ProgressBar';

/* Static display data — this is the legacy/demo treasury page (not the corporate version) */
const TABLE_PRODUCTS = [
  { name:'Prodigy Aura',             roi:'28% ROI', balance:'₦50,000,000',  weight:'19.6%', color:'#e8b84b', w:19.6 },
  { name:'Prodigy Flex-Tenure Note', roi:'22% ROI', balance:'₦42,500,000',  weight:'16.7%', color:'#3b6ef8', w:16.7 },
  { name:'Prodigy Genesis',          roi:'18% ROI', balance:'₦38,000,000',  weight:'14.9%', color:'#22c55e', w:14.9 },
  { name:'Prodigy Liquidity Fund',   roi:'15% ROI', balance:'₦25,450,673',  weight:'10.0%', color:'#8b5cf6', w:10.0 },
  { name:'Prodigy Apex',             roi:'32% ROI', balance:'₦98,500,000',  weight:'38.8%', color:'#f97316', w:38.8 },
];

const INVEST_PLANS = [
  { id:'aura',      initial:'P', color:'#22c55e', name:'PRODIGY AURA',           roi:'28% ROI', desc:'A commodity-linked note focusing on sustainable agro commodities trading.',             minInvest:'₦50,000,000',   lockIn:'NONE',         minRaw:50000000 },
  { id:'flex',      initial:'P', color:'#f97316', name:'PRODIGY FLEX-TENURE NOTE', roi:'15-25% ROI', desc:'High-yield flexible investment with rates based on amount and tenor.',           minInvest:'₦100,000',      lockIn:'30–365 DAYS',  minRaw:100000 },
  { id:'genesis',   initial:'P', color:'#3b6ef8', name:'PRODIGY GENESIS',         roi:'30% ROI', desc:'Property development fund taking positions in mid to high-end real estate projects.', minInvest:'₦100,000,000',  lockIn:'12 MONTHS',    minRaw:100000000 },
  { id:'liquidity', initial:'P', color:'#0d1b35', name:'PRODIGY LIQUIDITY FUND',  roi:'17% ROI', desc:'Designed to preserve capital and provide high liquidity with minimal risk.',          minInvest:'₦5,000',        lockIn:'NONE',         minRaw:5000 },
  { id:'vcf',       initial:'V', color:'#8b5cf6', name:'VERIFIED CORP FUND',      roi:'Negotiated ROI', desc:"A customized investment vehicle for your organization's treasury objectives.", minInvest:'NEGOTIATED',    lockIn:'BESPOKE',      minRaw:0, negotiated:true },
];

const pieData = TABLE_PRODUCTS.map(p => ({ name:p.name, value:p.w }));

/* ── Plan accordion item ── */
function PlanAccordion({ plan, isOpen, onToggle, isSuccess, onInvest, amount, setAmount }) {
  return (
    <div style={{ border:`1.5px solid ${isOpen?plan.color+'66':'var(--gray-200)'}`,borderRadius:14,marginBottom:10,overflow:'hidden',transition:'border-color 0.2s',background:isOpen?`${plan.color}07`:'white' }}>
      <button onClick={onToggle} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'16px 18px',background:'none',border:'none',cursor:'pointer',textAlign:'left' }}>
        <div style={{ width:40,height:40,borderRadius:10,background:plan.color,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,flexShrink:0 }}>{plan.initial}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:'var(--navy)',letterSpacing:'0.04em' }}>{plan.name}</div>
          <div style={{ fontSize:11,fontWeight:700,color:'var(--green)',marginTop:2 }}>{plan.roi}</div>
        </div>
        {isOpen ? <ChevronUp size={16} color="var(--gray-400)"/> : <ChevronDown size={16} color="var(--gray-400)"/>}
      </button>
      {isOpen && (
        <div style={{ padding:'0 18px 18px' }}>
          <p style={{ fontSize:11,letterSpacing:'0.04em',color:'var(--gray-600)',lineHeight:1.65,marginBottom:16,textTransform:'uppercase' }}>{plan.desc}</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14 }}>
            {[['Min. Invest',plan.minInvest],['Lock-In',plan.lockIn]].map(([l,v]) => (
              <div key={l} style={{ background:'var(--gray-50)',borderRadius:10,padding:'12px 14px' }}>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:5 }}>{l}</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:7 }}>Amount (₦)</div>
            <input type="text" placeholder={plan.negotiated?'NEGOTIATED':`MIN: ${plan.minInvest}`} value={amount} onChange={e=>setAmount(e.target.value)} disabled={plan.negotiated}
              style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'12px 14px',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#1e293b',background:plan.negotiated?'var(--gray-50)':'white',outline:'none' }}
              onFocus={e => !plan.negotiated && (e.target.style.borderColor=plan.color)} onBlur={e => e.target.style.borderColor='var(--gray-200)'} />
          </div>
          <button onClick={() => onInvest(plan)} style={{ width:'100%',background:isSuccess?'var(--green)':'var(--gold)',color:isSuccess?'white':'var(--navy)',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,letterSpacing:'0.06em',border:'none',borderRadius:10,padding:'14px',cursor:'pointer',transition:'all 0.3s',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
            {isSuccess ? '✓ INVESTMENT SUBMITTED' : <><PlusCircle size={14}/> INVEST NOW</>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Subscribe modal ── */
function SubscribeModal({ onClose }) {
  const [openId,   setOpenId]   = useState(null);
  const [amounts,  setAmounts]  = useState({});
  const [invested, setInvested] = useState({});

  const handleInvest = plan => {
    if (!plan.negotiated) {
      const amt = parseFloat((amounts[plan.id]||'').replace(/,/g,''));
      if (!amt || amt < plan.minRaw) { alert(`Minimum is ${plan.minInvest}`); return; }
    }
    setInvested(p => ({ ...p, [plan.id]:true }));
    setTimeout(() => { setInvested(p => ({ ...p, [plan.id]:false })); setOpenId(null); setAmounts(p => ({ ...p, [plan.id]:'' })); }, 2200);
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={560} scrollable
      headerContent={<div><h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:17,color:'white',letterSpacing:'0.05em',textTransform:'uppercase' }}>Invest in Prodigy</h2><p style={{ fontSize:10,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:3 }}>Source: Corporate Wallet (₦1,250,000)</p></div>}
    >
      {INVEST_PLANS.map(plan => (
        <PlanAccordion key={plan.id} plan={plan} isOpen={openId===plan.id} onToggle={() => setOpenId(p => p===plan.id?null:plan.id)} isSuccess={!!invested[plan.id]}
          amount={amounts[plan.id]||''} setAmount={v => setAmounts(p=>({...p,[plan.id]:v}))} onInvest={handleInvest} />
      ))}
    </ModalOverlay>
  );
}

/* ── Redeem modal ── */
function RedeemModal({ onClose }) {
  const [amount,    setAmount]    = useState('');
  const [file,      setFile]      = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => { setSubmitted(true); setTimeout(() => { setSubmitted(false); onClose(); }, 2000); };

  return (
    <ModalOverlay onClose={onClose} maxWidth={480}
      headerContent={<h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:17,color:'white',textTransform:'uppercase' }}>Liquidate Funds</h2>}
    >
      <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
        <div>
          <div style={{ fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:7 }}>Amount (₦)</div>
          <input type="text" placeholder="PRINCIPAL" value={amount} onChange={e=>setAmount(e.target.value)}
            style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'13px 14px',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#1e293b',background:'white',outline:'none' }}
            onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
        </div>
        <FileUploadBox label="Instruction (Upload)" file={file} onChange={f=>setFile(f)} hint="Board resolution or signed instruction · PDF" />
        <button onClick={handleSubmit} style={{ width:'100%',background:submitted?'var(--green)':'var(--navy)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,letterSpacing:'0.08em',border:'none',borderRadius:10,padding:'15px',cursor:'pointer',transition:'all 0.3s',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
          {submitted ? '✓ REQUEST SUBMITTED' : 'SUBMIT REQUEST'}
        </button>
      </div>
    </ModalOverlay>
  );
}

export default function Treasury() {
  const [modal, setModal] = useState(null);

  return (
    <div>
      <PageHeader title="Treasury Portfolio Overview" subtitle="Bespoke Asset Management System V2.0" />

      <PortfolioHero
        label="Live Liquidity Monitor"
        value="₦25,450,673.60"
        sub="+17% P.A. · Last Accrual: Just Now"
        live
        actions={
          <>
            <button className="btn-outline" style={{ color:'white',borderColor:'rgba(255,255,255,0.3)' }} onClick={() => setModal('subscribe')}>
              <PlusCircle size={14}/> Subscribe
            </button>
            <button className="btn-gold" onClick={() => setModal('redeem')}>
              <RefreshCcw size={14}/> Redeem
            </button>
          </>
        }
      />

      {/* Summary table + allocation pie */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 220px',gap:24,marginBottom:24,alignItems:'start' }} className="animate-in delay-2">
        <SectionCard title="Executive Investment Summary" noPadding
          titleAction={<div style={{ textAlign:'right' }}><div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Consolidated ROI</div><div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:'var(--navy)' }}>23.4%</div></div>}
        >
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--gray-50)' }}>
                  {['Product','ROI','Risk','Balance (₦)','Weight'].map(h => <th key={h} style={{ padding:'10px 20px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {TABLE_PRODUCTS.map((p,i) => (
                  <tr key={p.name} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding:'14px 20px' }}><div style={{ display:'flex',alignItems:'center',gap:8 }}><span style={{ width:8,height:8,borderRadius:'50%',background:p.color,display:'inline-block' }}/><span style={{ fontSize:13,fontWeight:600,color:'var(--navy)' }}>{p.name}</span></div></td>
                    <td style={{ padding:'14px 20px' }}><span style={{ fontSize:12,fontWeight:700,color:p.color }}>{p.roi}</span></td>
                    <td style={{ padding:'14px 20px' }}><ProgressBar pct={30+i*15} color={p.color} height={4} style={{ width:60 }}/></td>
                    <td style={{ padding:'14px 20px',fontSize:13,color:'var(--navy)',fontWeight:500 }}>{p.balance}</td>
                    <td style={{ padding:'14px 20px',fontSize:13,color:'var(--gray-600)' }}>{p.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Pie */}
        <div className="card">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:16 }}>Allocation</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" strokeWidth={0}>
                {pieData.map((_,i) => <Cell key={i} fill={TABLE_PRODUCTS[i].color}/>)}
              </Pie>
              <Tooltip formatter={v=>`${v}%`}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex',flexDirection:'column',gap:6,marginTop:12 }}>
            {TABLE_PRODUCTS.map(p => (
              <div key={p.name} style={{ display:'flex',alignItems:'center',gap:6 }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0 }}/>
                <span style={{ fontSize:10,color:'var(--gray-600)',flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{p.name}</span>
                <span style={{ fontSize:10,fontWeight:700,color:'var(--navy)' }}>{p.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal==='subscribe' && <SubscribeModal onClose={() => setModal(null)} />}
      {modal==='redeem'    && <RedeemModal    onClose={() => setModal(null)} />}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@media(max-width:768px){div[style*="1fr 220px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
