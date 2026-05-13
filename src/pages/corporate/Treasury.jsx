import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlusCircle, RefreshCcw, TrendingUp, ChevronDown, ChevronUp, X, Upload, Clock } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import useAppStore from '../../store/useAppStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits:0 });
const TENOR_OPTIONS = ['30 Days','60 Days','90 Days','120 Days','150 Days','180 Days','210 Days','240 Days','270 Days','300 Days','330 Days','365 Days'];

const PORTFOLIO = [
  { id:'apex',    name:'Prodigy Apex',         balance:50000000,  weight:'16.8%', color:'#22c55e' },
  { id:'flex',    name:'Prodigy Flexi-Tenure', balance:15000000,  weight:'5.0%',  color:'#f97316' },
  { id:'aura',    name:'Prodigy Aura',          balance:20000000,  weight:'6.7%',  color:'#3b82f6' },
  { id:'vantage', name:'Prodigy Vantage',       balance:12500000,  weight:'4.2%',  color:'#8b5cf6' },
  { id:'genesis', name:'Prodigy Genesis',       balance:100000000, weight:'33.6%', color:'#ec4899' },
  { id:'liquidity',name:'Prodigy Liquidity',    balance:25450673,  weight:'8.5%',  color:'#0d1b35' },
  { id:'vcf',     name:'Verified Corp Fund',    balance:75000000,  weight:'25.2%', color:'#6366f1' },
];

/* ── Subscribe Modal ─────────────────────────────────────── */
function SubscribeModal({ onClose }) {
  const { plans } = useAppStore();
  const [openId, setOpenId] = useState(null);
  const [amounts, setAmounts] = useState({});
  const [tenors, setTenors] = useState({});
  const [success, setSuccess] = useState({});

  const toggle = id => setOpenId(p => p === id ? null : id);

  const handleInvest = (plan) => {
    if (!plan.negotiated) {
      const amt = parseInt((amounts[plan.id]||'').replace(/[^0-9]/g,''), 10)||0;
      if (amt < plan.minInvest) { alert(`Minimum investment is ${fmt(plan.minInvest)}`); return; }
    }
    setSuccess(s => ({...s,[plan.id]:true}));
    setTimeout(() => { setSuccess(s=>({...s,[plan.id]:false})); setOpenId(null); }, 2200);
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.58)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={onClose}>
      <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:580,maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.28s ease',overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 24px 16px',borderBottom:'1px solid var(--gray-100)',flexShrink:0,display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:17,color:'var(--navy)',letterSpacing:'0.05em',textTransform:'uppercase' }}>Invest in Prodigy</h2>
            <p style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:3 }}>Source: Corporate Wallet (₦1,250,000)</p>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)',padding:4,display:'flex',borderRadius:6,transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--navy)'} onMouseLeave={e=>e.currentTarget.style.color='var(--gray-400)'}
          ><X size={18}/></button>
        </div>

        <div style={{ overflowY:'auto',flex:1,padding:'12px 16px 20px' }}>
          {plans.map(plan => {
            const isOpen = openId === plan.id;
            const isOk   = success[plan.id];
            return (
              <div key={plan.id} style={{ border:`1.5px solid ${isOpen?plan.color+'55':'var(--gray-200)'}`,borderRadius:14,marginBottom:10,overflow:'hidden',transition:'border-color 0.2s',background:isOpen?`${plan.color}07`:'white' }}>
                <button onClick={()=>toggle(plan.id)} style={{ width:'100%',display:'flex',alignItems:'center',gap:14,padding:'16px 18px',background:'none',border:'none',cursor:'pointer',textAlign:'left' }}>
                  <div style={{ width:40,height:40,borderRadius:10,background:plan.color,color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,flexShrink:0 }}>
                    {plan.name.charAt(0)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:'var(--navy)',letterSpacing:'0.04em' }}>{plan.name.toUpperCase()}</div>
                    <div style={{ fontSize:11,fontWeight:700,color:plan.tag?'#8b5cf6':'var(--green)',marginTop:2 }}>{plan.tag||plan.roi}</div>
                  </div>
                  {isOpen ? <ChevronUp size={16} color="var(--gray-400)"/> : <ChevronDown size={16} color="var(--gray-400)"/>}
                </button>

                {isOpen && (
                  <div style={{ padding:'0 18px 18px' }}>
                    <p style={{ fontSize:11,color:'var(--gray-600)',lineHeight:1.65,marginBottom:14,textTransform:'uppercase',letterSpacing:'0.03em' }}>{plan.desc}</p>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14 }}>
                      {[['Min. Invest', plan.negotiated?'NEGOTIATED':fmt(plan.minInvest)],['Lock-In',plan.lockIn]].map(([l,v])=>(
                        <div key={l} style={{ background:'var(--gray-50)',borderRadius:10,padding:'12px 14px' }}>
                          <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:4 }}>{l}</div>
                          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)' }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Tenor dropdown for applicable plans */}
                    {plan.hasTenor && (
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:7 }}>Select Tenor</div>
                        <div style={{ position:'relative',display:'flex',alignItems:'center',gap:8,border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'11px 14px',background:'white',transition:'border-color 0.2s' }}>
                          <Clock size={14} color="var(--gray-400)" style={{ flexShrink:0 }}/>
                          <select value={tenors[plan.id]||'30 Days'} onChange={e=>setTenors(t=>({...t,[plan.id]:e.target.value}))}
                            style={{ flex:1,border:'none',outline:'none',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'var(--navy)',background:'transparent',appearance:'none',cursor:'pointer' }}>
                            {TENOR_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                          <ChevronDown size={14} color="var(--gray-400)" style={{ pointerEvents:'none' }}/>
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:7 }}>Amount (₦)</div>
                      <input type="text" placeholder={plan.negotiated?'NEGOTIATED':`MIN: ${fmt(plan.minInvest)}`}
                        value={amounts[plan.id]||''} onChange={e=>setAmounts(a=>({...a,[plan.id]:e.target.value}))}
                        disabled={plan.negotiated}
                        style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'12px 14px',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#1e293b',background:plan.negotiated?'var(--gray-50)':'white',outline:'none' }}
                        onFocus={e=>!plan.negotiated&&(e.target.style.borderColor=plan.color)}
                        onBlur={e=>e.target.style.borderColor='var(--gray-200)'}
                      />
                    </div>
                    <button onClick={()=>handleInvest(plan)} style={{ width:'100%',background:isOk?'var(--green)':'var(--gold)',color:isOk?'white':'var(--navy)',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,letterSpacing:'0.06em',border:'none',borderRadius:10,padding:'14px',cursor:'pointer',transition:'all 0.3s',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                      {isOk?'✓ INVESTMENT SUBMITTED':<><PlusCircle size={14}/> INVEST NOW</>}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}

/* ── Pre-Termination Redeem Modal ───────────────────────── */
function RedeemModal({ onClose }) {
  const [selectedProduct, setSelectedProduct] = useState(PORTFOLIO[0]);
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const numAmt = parseInt(amount.replace(/[^0-9]/g,''),10)||0;
  const accrued = Math.round(numAmt * (selectedProduct.id==='genesis'?0.29:0.20) * (90/365));
  const penalty = Math.round(numAmt * 0.05);
  const wht     = Math.round(accrued * 0.10);
  const nrv     = numAmt + accrued - penalty - wht;
  const showBreakdown = numAmt > 0;

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); }, 2200);
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.58)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={onClose}>
      <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.28s ease' }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:'20px 24px 16px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'white',zIndex:2 }}>
          <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:17,color:'var(--navy)',letterSpacing:'0.05em',textTransform:'uppercase' }}>Pre-Termination Analysis</h2>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)',display:'flex',borderRadius:6,padding:4 }}><X size={18}/></button>
        </div>

        <div style={{ padding:'20px 24px 24px' }}>
          {/* Source product dropdown */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8 }}>Source Product</div>
            <div style={{ position:'relative' }}>
              <button onClick={()=>setDropOpen(d=>!d)} style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'12px 16px',background:'white',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:14,color:'var(--navy)',fontWeight:600 }}>
                <span>{selectedProduct.name} ({fmt(selectedProduct.balance)})</span>
                <ChevronDown size={15} color="var(--gray-400)" style={{ transform:dropOpen?'rotate(180deg)':'none',transition:'transform 0.2s' }}/>
              </button>
              {dropOpen && (
                <div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'white',border:'1px solid var(--gray-200)',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.1)',zIndex:10,overflow:'hidden' }}>
                  {PORTFOLIO.map(p=>(
                    <button key={p.id} onClick={()=>{setSelectedProduct(p);setDropOpen(false);setAmount('');}} style={{ width:'100%',textAlign:'left',padding:'11px 16px',border:'none',background:selectedProduct.id===p.id?'#f0f4ff':'white',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:13,color:selectedProduct.id===p.id?'var(--navy)':'var(--gray-600)',fontWeight:selectedProduct.id===p.id?700:400,transition:'background 0.15s' }}
                      onMouseEnter={e=>{if(selectedProduct.id!==p.id)e.currentTarget.style.background='var(--gray-50)'}}
                      onMouseLeave={e=>{if(selectedProduct.id!==p.id)e.currentTarget.style.background='white'}}
                    >
                      {p.name} ({fmt(p.balance)})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8 }}>Liquidation Principal (₦)</div>
            <input type="text" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}
              style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'13px 16px',fontFamily:'DM Sans,sans-serif',fontSize:18,fontWeight:700,color:'var(--navy)',background:'white',outline:'none',transition:'border-color 0.2s' }}
              onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            <div style={{ fontSize:11,color:'#3b82f6',marginTop:5,fontWeight:600 }}>Available: {fmt(selectedProduct.balance)}</div>
          </div>

          {/* Financial consequence breakdown */}
          {showBreakdown && (
            <div style={{ marginBottom:16,border:'1px solid var(--gray-200)',borderRadius:12,overflow:'hidden' }}>
              <div style={{ padding:'10px 16px',background:'var(--gray-50)',borderBottom:'1px solid var(--gray-200)' }}>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-600)' }}>Financial Consequence Breakdown</span>
              </div>
              <div style={{ padding:'14px 16px',display:'flex',flexDirection:'column',gap:10 }}>
                {[
                  { label:'Liquidation Principal',   val:fmt(numAmt),  color:'var(--navy)',    sign:'' },
                  { label:'Accrued Growth (Est.)',    val:fmt(accrued), color:'var(--green)',   sign:'+' },
                  { label:'Pre-Termination Penalty ⚠',val:fmt(penalty), color:'var(--red)',     sign:'-', flag:true },
                  { label:'10% WHT (Tax) on Growth',  val:fmt(wht),    color:'var(--gray-600)',sign:'-' },
                ].map(r=>(
                  <div key={r.label} style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <span style={{ fontSize:12,color:r.flag?'var(--red)':'var(--gray-600)',fontWeight:r.flag?600:400 }}>{r.label}</span>
                    <span style={{ fontSize:13,fontWeight:700,color:r.color }}>{r.sign}{r.val}</span>
                  </div>
                ))}
                <div style={{ borderTop:'1.5px solid var(--gray-200)',paddingTop:10,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)',letterSpacing:'0.04em',textTransform:'uppercase' }}>Net Realizable Value (NRV)</span>
                  <span style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'var(--navy)' }}>{fmt(nrv)}</span>
                </div>
              </div>
            </div>
          )}

          {/* File upload */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8 }}>Upload Board Resolution</div>
            <label style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'22px',border:'1.5px dashed var(--gray-200)',borderRadius:12,cursor:'pointer',background:'var(--gray-50)',transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--navy)';e.currentTarget.style.background='white';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--gray-200)';e.currentTarget.style.background='var(--gray-50)';}}>
              <input type="file" style={{ display:'none' }} onChange={e=>setFile(e.target.files?.[0]||null)}/>
              <Upload size={20} color={file?'var(--green)':'var(--gray-400)'} strokeWidth={1.5}/>
              <span style={{ fontSize:12,color:file?'var(--navy)':'var(--gray-400)',fontWeight:file?600:400 }}>
                {file?file.name:'Click to browse files'}
              </span>
            </label>
          </div>

          <button onClick={handleSubmit} style={{ width:'100%',background:submitted?'var(--green)':'var(--navy)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,letterSpacing:'0.08em',border:'none',borderRadius:10,padding:'15px',cursor:'pointer',transition:'all 0.3s',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
            {submitted?'✓ REQUEST SUBMITTED':'EXECUTE LIQUIDATION'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Treasury Page ───────────────────────────────────────── */
export default function Treasury() {
  const [modal, setModal] = useState(null);
  const pieData = PORTFOLIO.map(p=>({ name:p.name, value:parseFloat(p.weight) }));

  return (
    <div>
      <PageHeader title="Treasury Portfolio Overview" subtitle="Bespoke Asset Management System V2.0"/>

      {/* Live Monitor */}
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'26px 30px',marginBottom:24,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:'rgba(232,184,75,0.06)',pointerEvents:'none' }}/>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:20 }}>
          <div>
            <p style={{ fontSize:10,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:6 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:'pulse 2s infinite' }}/> Live Liquidity Monitor
            </p>
            <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,5vw,42px)',color:'white',letterSpacing:'-0.01em',marginBottom:8 }}>₦25,450,673.60</h2>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',gap:6 }}>
              <TrendingUp size={13} color="var(--green)"/>
              <span style={{ color:'var(--green)',fontWeight:600 }}>+17% P.A.</span>&nbsp;· Last Accrual: Just Now
            </p>
          </div>
          <div style={{ display:'flex',gap:10,alignItems:'center' }}>
            <button className="btn-outline" style={{ color:'white',borderColor:'rgba(255,255,255,0.3)' }} onClick={()=>setModal('subscribe')}>
              <PlusCircle size={14}/> Subscribe
            </button>
            <button className="btn-gold" onClick={()=>setModal('redeem')}>
              <RefreshCcw size={14}/> Redeem
            </button>
          </div>
        </div>
      </div>

      {/* Table + Chart */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 220px',gap:22,marginBottom:24,alignItems:'start' }} className="animate-in delay-2">
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          <div style={{ padding:'18px 22px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Executive Investment Summary</h3>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Consolidated ROI</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:'var(--navy)' }}>23.4%</div>
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--gray-50)' }}>
                  {['Product','ROI','Risk','Balance (₦)','Weight'].map(h=>(
                    <th key={h} style={{ padding:'10px 18px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { ...PORTFOLIO[0], roi:'20% ROI', risk:'LOW',        riskC:'#22c55e' },
                  { ...PORTFOLIO[1], roi:'12-18% ROI',risk:'LOW-MEDIUM',riskC:'#84cc16' },
                  { ...PORTFOLIO[2], roi:'16% ROI', risk:'MEDIUM',     riskC:'#f97316' },
                  { ...PORTFOLIO[3], roi:'FX LINKED',risk:'MEDIUM-HIGH',riskC:'#ef4444' },
                  { ...PORTFOLIO[4], roi:'25-33% ROI',risk:'MEDIUM',   riskC:'#f97316' },
                  { ...PORTFOLIO[5], roi:'15% ROI', risk:'VERY LOW',   riskC:'#22c55e' },
                  { ...PORTFOLIO[6], roi:'BESPOKE', risk:'CUSTOMIZED', riskC:'#8b5cf6' },
                ].map(p=>(
                  <tr key={p.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--gray-50)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'13px 18px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <span style={{ width:8,height:8,borderRadius:'50%',background:p.color,display:'inline-block' }}/>
                        <span style={{ fontSize:13,fontWeight:600,color:'var(--navy)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'13px 18px' }}><span style={{ fontSize:12,fontWeight:700,color:'var(--green)' }}>{p.roi}</span></td>
                    <td style={{ padding:'13px 18px' }}><span style={{ fontSize:10,fontWeight:700,color:p.riskC,background:`${p.riskC}18`,padding:'3px 7px',borderRadius:4,letterSpacing:'0.05em' }}>{p.risk}</span></td>
                    <td style={{ padding:'13px 18px',fontSize:13,color:'var(--navy)',fontWeight:500 }}>{fmt(p.balance)}</td>
                    <td style={{ padding:'13px 18px',fontSize:13,color:'var(--gray-600)' }}>{p.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ minWidth:0 }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14 }}>Allocation</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" strokeWidth={0}>
              {pieData.map((_,i)=><Cell key={i} fill={PORTFOLIO[i].color}/>)}
            </Pie><Tooltip formatter={v=>`${v}%`}/></PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex',flexDirection:'column',gap:5,marginTop:10 }}>
            {PORTFOLIO.map(p=>(
              <div key={p.id} style={{ display:'flex',alignItems:'center',gap:6 }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:p.color,flexShrink:0 }}/>
                <span style={{ fontSize:10,color:'var(--gray-600)',flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{p.name}</span>
                <span style={{ fontSize:10,fontWeight:700,color:'var(--navy)' }}>{p.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal==='subscribe' && <SubscribeModal onClose={()=>setModal(null)}/>}
      {modal==='redeem'    && <RedeemModal    onClose={()=>setModal(null)}/>}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @media(max-width:900px){div[style*="grid-template-columns: 1fr 220px"]{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  );
}
