import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PlusCircle, RefreshCcw, TrendingUp, ChevronDown, ChevronUp, X, Upload, Clock, Eye, Download, Award, AlertTriangle, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits:0 });
const TENOR_OPTIONS = ['30 Days','60 Days','90 Days','120 Days','150 Days','180 Days','210 Days','240 Days','270 Days','300 Days','330 Days','365 Days'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Corp Product Drawer ─────────────────────────────────── */
function CorpProductDrawer({ product, onClose }) {
  const [tab, setTab]             = useState('overview');
  const [termStep, setTermStep]   = useState(null);
  const [termReason, setTermReason] = useState('');
  const chartData = MONTHS.map((month,mi) => ({
    month,
    value:     Math.round(product.balance*(0.7+0.3*((mi+1)/12))),
    principal: Math.round(product.balance*(0.65+0.2*((mi+1)/12))),
    returns:   Math.round(product.balance*0.0015*(mi+1)),
  }));
  const net   = product.balance * 0.15;
  const tax   = net * 0.10;
  const netP  = net - tax;

  const downloadCertificate = (terminated = false) => {
    const date = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
    const lines = [
      'PRODIGY FINANCE LIMITED',
      terminated ? 'CORPORATE TERMINATION CERTIFICATE' : 'CORPORATE INVESTMENT CERTIFICATE',
      '═'.repeat(54),
      `Certificate Ref : CERT-${product.id.toUpperCase()}-${Date.now()}${terminated?'-TERM':''}`,
      `Issue Date      : ${date}`,
      '',
      '── PRODUCT DETAILS ──────────────────────────────────',
      `Product Name    : ${product.name}`,
      `Balance         : ${fmt(product.balance)}`,
      `Portfolio Weight: ${product.weight}`,
      `Est. Annual Ret : ${fmt(net)}`,
      `WHT (10%)       : ${fmt(tax)}`,
      `Net Return      : ${fmt(netP)}`,
      terminated ? `Termination Rsn : ${termReason||'Corporate decision'}` : '',
      '═'.repeat(54),
      'Prodigy Finance Limited · www.prodigyfinance.ng',
    ].filter(Boolean).join('\n');
    const blob = new Blob([lines],{type:'text/plain'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`corp-${terminated?'term':'cert'}-${product.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportStatement = () => {
    const headers = 'Month,Projected Value,Principal,Cumul. Returns';
    const rows = chartData.map(r=>`${r.month},${r.value},${r.principal},${r.returns}`);
    const blob = new Blob([`CORPORATE PRODUCT STATEMENT\nProduct: ${product.name}\n\n${headers}\n${rows.join('\n')}`],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`corp-${product.id}-statement.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = ['overview','chart','terminate'];
  return (
    <div style={{ position:'fixed',inset:0,zIndex:400,display:'flex' }} onClick={onClose}>
      <div style={{ flex:1,background:'rgba(13,27,53,0.45)',backdropFilter:'blur(3px)' }}/>
      <div style={{ width:'min(520px,100vw)',background:'white',display:'flex',flexDirection:'column',overflowY:'auto',boxShadow:'-24px 0 60px rgba(0,0,0,0.18)',animation:'slideIn 0.28s ease' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ background:product.color,padding:'22px 24px',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14 }}>
            <div>
              <div style={{ fontSize:9,color:'rgba(255,255,255,0.55)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4 }}>Corporate Investment Dashboard</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'white' }}>{product.name}</div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,padding:8,cursor:'pointer',color:'white',display:'flex',alignItems:'center' }}><X size={16}/></button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
            {[{label:'Balance',val:fmt(product.balance)},{label:'Weight',val:product.weight},{label:'Net Return',val:fmt(netP)}].map(s=>(
              <div key={s.label} style={{ background:'rgba(255,255,255,0.12)',borderRadius:8,padding:'10px 12px' }}>
                <div style={{ fontSize:9,color:'rgba(255,255,255,0.55)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'white' }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex',borderBottom:'1px solid var(--gray-100)',flexShrink:0 }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:'12px 4px',border:'none',background:'transparent',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.05em',color:tab===t?product.color:'var(--gray-400)',borderBottom:`2px solid ${tab===t?product.color:'transparent'}`,transition:'all 0.2s' }}>
              {t==='terminate'?'⚠ Terminate':t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ flex:1,padding:'22px 24px',overflowY:'auto' }}>
          {tab==='overview' && (
            <div>
              {[['Product',product.name],['Balance',fmt(product.balance)],['Portfolio Weight',product.weight],['Est. Annual Return',fmt(net)],['WHT (10%)',fmt(tax)],['Net Return',fmt(netP)]].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:18 }}>
                <button onClick={()=>downloadCertificate(false)} style={{ padding:'12px',background:`${product.color}18`,color:product.color,border:`1px solid ${product.color}30`,borderRadius:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}><Award size={14}/> CERTIFICATE</button>
                <button onClick={exportStatement} style={{ padding:'12px',background:'rgba(13,27,53,0.07)',color:'var(--navy)',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}><Download size={14}/> STATEMENT</button>
              </div>
            </div>
          )}
          {tab==='chart' && (
            <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
              <div>
                <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14 }}>12-Month Projected Growth</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                    <XAxis dataKey="month" tick={{ fontSize:10 }}/>
                    <YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:10 }}/>
                    <Tooltip formatter={v=>[fmt(v)]}/><Legend/>
                    <Area type="monotone" dataKey="value"     name="Total Value" stroke={product.color}       fill={product.color+'18'} strokeWidth={2.5}/>
                    <Area type="monotone" dataKey="principal" name="Principal"   stroke="var(--navy)" fill="rgba(13,27,53,0.05)" strokeWidth={1.5} strokeDasharray="4 2"/>
                    <Area type="monotone" dataKey="returns"   name="Returns"    stroke="var(--gold)" fill="rgba(232,184,75,0.07)" strokeWidth={1.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {tab==='terminate' && (
            <div>
              {termStep==='done' ? (
                <div style={{ textAlign:'center',padding:'32px 0' }}>
                  <CheckCircle size={52} color="var(--green)" style={{ marginBottom:14 }}/>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'var(--navy)',marginBottom:8 }}>Termination Request Submitted</div>
                  <p style={{ fontSize:12,color:'var(--gray-400)',marginBottom:20,lineHeight:1.6 }}>Board resolution received. Processing will begin within 2 business days.</p>
                  <button onClick={()=>downloadCertificate(true)} style={{ display:'flex',alignItems:'center',gap:6,padding:'12px 20px',background:'var(--gold)',color:'white',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,margin:'0 auto' }}><Award size={14}/> Termination Certificate</button>
                </div>
              ) : termStep==='confirm' ? (
                <div>
                  <div style={{ background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:12,padding:'16px',marginBottom:16 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}><AlertTriangle size={16} color="var(--red)"/><span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--red)' }}>Confirm Corporate Termination</span></div>
                    <p style={{ fontSize:12,color:'var(--navy)',lineHeight:1.7 }}>A 25% penalty applies on accrued returns. Board resolution required.</p>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6,fontWeight:700 }}>Board Resolution / Reason</div>
                    <textarea rows={3} placeholder="State board resolution or reason…" value={termReason} onChange={e=>setTermReason(e.target.value)}
                      style={{ width:'100%',border:'1.5px solid #e2e8f0',borderRadius:10,padding:'12px 14px',fontFamily:'DM Sans,sans-serif',fontSize:13,resize:'vertical',outline:'none',boxSizing:'border-box' }}
                      onFocus={e=>e.target.style.borderColor='var(--red)'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                    <button onClick={()=>setTermStep(null)} style={{ padding:'13px',background:'var(--gray-100)',color:'var(--navy)',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12 }}>Cancel</button>
                    <button onClick={()=>setTermStep('done')} style={{ padding:'13px',background:'var(--red)',color:'white',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12 }}>Submit</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:12,padding:'16px',marginBottom:18 }}>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--red)',marginBottom:8 }}>⚠ Early Termination</div>
                    <ul style={{ fontSize:12,color:'var(--navy)',lineHeight:1.9,paddingLeft:16,margin:0 }}>
                      <li>25% penalty on accrued net returns applies.</li>
                      <li>Board resolution must be uploaded.</li>
                      <li>Principal returned within 5 business days.</li>
                      <li>Termination Certificate issued upon approval.</li>
                    </ul>
                  </div>
                  <div style={{ background:'white',border:'1px solid var(--gray-200)',borderRadius:10,padding:'14px',marginBottom:18 }}>
                    {[['Product',product.name],['Balance',fmt(product.balance)],['Est. Net Return',fmt(netP)],['Penalty (est.)',fmt(netP*0.25)],['Net After Exit',fmt(product.balance+netP*0.75)]].map(([l,v])=>(
                      <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--gray-50)' }}>
                        <span style={{ fontSize:11,color:'var(--gray-400)' }}>{l}</span>
                        <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setTermStep('confirm')} style={{ width:'100%',padding:'14px',background:'var(--red)',color:'white',border:'none',borderRadius:12,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,letterSpacing:'0.06em',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                    <AlertTriangle size={15}/> REQUEST TERMINATION
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );
}

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
function RedeemModal({ onClose, portfolio = [] }) {
  const [selectedProduct, setSelectedProduct] = useState(portfolio[0] || null);
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const numAmt = parseInt(amount.replace(/[^0-9]/g,''),10)||0;
  const accrued = selectedProduct ? Math.round(numAmt * 0.20 * (90/365)) : 0;
  const penalty = Math.round(numAmt * 0.05);
  const wht     = Math.round(accrued * 0.10);
  const nrv     = numAmt + accrued - penalty - wht;
  const showBreakdown = numAmt > 0;
  if (!selectedProduct) return (
    <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.58)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300 }} onClick={onClose}>
      <div style={{ background:'white',borderRadius:20,padding:'32px',maxWidth:400,width:'100%' }} onClick={e=>e.stopPropagation()}>
        <EmptyState icon={TrendingUp} title="No active investments" message="You must have an active investment to submit a pre-termination request." action={{ label:'Close', onClick:onClose }} />
      </div>
    </div>
  );

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
                <span>{selectedProduct?.name} ({fmt(selectedProduct?.balance || 0)})</span>
                <ChevronDown size={15} color="var(--gray-400)" style={{ transform:dropOpen?'rotate(180deg)':'none',transition:'transform 0.2s' }}/>
              </button>
              {dropOpen && (
                <div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'white',border:'1px solid var(--gray-200)',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.1)',zIndex:10,overflow:'hidden' }}>
                  {portfolio.map(p=>(
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
  const { user, clientInvestments, plans } = useAppStore();
  const [modal, setModal]                 = useState(null);
  const [drawerProduct, setDrawerProduct] = useState(null);
  const [chartFilter, setChartFilter]     = useState('all');
  const [chartType, setChartType]         = useState('area');

  // Build PORTFOLIO from live client investments
  const PORTFOLIO = useMemo(() => {
    const myInvs = clientInvestments.filter(i =>
      i.clientId === user?.clientId || i.clientId === user?.id
    );
    const total = myInvs.reduce((s,i) => s + (i.amount||0), 0);
    const grouped = {};
    myInvs.forEach(inv => {
      const plan = plans.find(p => p.id === inv.planId) || {};
      if (!grouped[inv.planId]) {
        grouped[inv.planId] = { id: inv.planId, name: inv.plan || plan.name || 'Unknown', balance: 0, color: plan.color || '#3b82f6' };
      }
      grouped[inv.planId].balance += (inv.amount || 0);
    });
    return Object.values(grouped).map(p => ({
      ...p,
      weight: total > 0 ? ((p.balance / total) * 100).toFixed(1) + '%' : '0%',
    }));
  }, [clientInvestments, plans, user]);

  const pieData = PORTFOLIO.map(p => ({ name: p.name, value: parseFloat(p.weight) }));
  const displayedProds = chartFilter === 'all' ? PORTFOLIO : PORTFOLIO.filter(p => p.id === chartFilter);
  const perProdData = useMemo(() => {
    const filtered = chartFilter === 'all' ? PORTFOLIO : PORTFOLIO.filter(p => p.id === chartFilter);
    return MONTHS.map((month, mi) => {
      const row = { month };
      filtered.forEach(p => { row[p.name] = Math.round(p.balance * (0.7 + 0.3 * ((mi+1)/12))); });
      return row;
    });
  }, [chartFilter, PORTFOLIO]);

  const totalAUM = PORTFOLIO.reduce((s,p) => s + p.balance, 0);
  const fmtAUM = n => '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits:2, maximumFractionDigits:2 });

  const GROWTH_DATA = useMemo(() => MONTHS.map((month, mi) => ({
    month,
    aum: Math.round(totalAUM * (0.7 + 0.3 * ((mi + 1) / 12))),
    ret: Math.round(totalAUM * 0.0015 * (mi + 1)),
  })), [totalAUM]);

  return (
    <div>
      <PageHeader title="Treasury Portfolio Overview" subtitle="Bespoke Asset Management System V2.0"/>

      {/* Live Monitor */}
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'26px 30px',marginBottom:24,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:'rgba(232,184,75,0.06)',pointerEvents:'none' }}/>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:20 }}>
          <div>
            <p style={{ fontSize:10,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:6 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:'pulse 2s infinite' }}/> Total Assets Under Management
            </p>
            <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,5vw,42px)',color:'white',letterSpacing:'-0.01em',marginBottom:8 }}>{fmtAUM(totalAUM)}</h2>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',gap:6 }}>
              <TrendingUp size={13} color="var(--green)"/>
              <span style={{ color:'var(--green)',fontWeight:600 }}>{PORTFOLIO.length} Product{PORTFOLIO.length !== 1 ? 's' : ''} Active</span>&nbsp;· Live Portfolio
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
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:'var(--navy)' }}>{PORTFOLIO.length > 0 ? 'Active' : '—'}</div>
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
                {PORTFOLIO.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon={TrendingUp} compact title="No active investments" message="Your booked products will appear here once confirmed by your relationship manager." /></td></tr>
                ) : PORTFOLIO.map(p=>(
                  <tr key={p.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--gray-50)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'13px 18px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <span style={{ width:8,height:8,borderRadius:'50%',background:p.color,display:'inline-block' }}/>
                        <span style={{ fontSize:13,fontWeight:600,color:'var(--navy)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'13px 18px' }}><span style={{ fontSize:12,fontWeight:700,color:'var(--green)' }}>Active</span></td>
                    <td style={{ padding:'13px 18px' }}><span style={{ fontSize:10,fontWeight:700,color:'#3b82f6',background:'rgba(59,130,246,0.1)',padding:'3px 7px',borderRadius:4,letterSpacing:'0.05em' }}>—</span></td>
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
              {pieData.map((_, i) => <Cell key={i} fill={PORTFOLIO[i]?.color || '#94a3b8'}/>)}
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

      {/* Per-product AUM stats row */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:22 }} className="animate-in delay-3">
        {PORTFOLIO.map(p=>(
          <div key={p.id} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:`1px solid ${p.color}30`,borderLeft:`4px solid ${p.color}` }}>
            <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.name.replace('Prodigy ','')}</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:p.color }}>₦{(p.balance/1e6).toFixed(1)}M</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',marginTop:2 }}>{p.weight} of total</div>
          </div>
        ))}
      </div>

      {/* AUM Growth Line Chart */}
      <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)',marginBottom:22 }} className="animate-in delay-3">
        <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Portfolio AUM & Returns Growth (Monthly)</h3>
        <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Total AUM vs. monthly interest/returns generated across all products</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={GROWTH_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="month" tick={{ fontSize:11 }}/>
            <YAxis tick={{ fontSize:10 }} tickFormatter={v=>'₦'+(v/1e6).toFixed(0)+'M'}/>
            <Tooltip formatter={(v,n)=>['₦'+(v/1e6).toFixed(2)+'M',n]}/>
            <Legend/>
            <Area type="monotone" dataKey="aum" name="Total AUM" stroke="var(--navy)" fill="rgba(13,27,53,0.07)" strokeWidth={2.5}/>
            <Area type="monotone" dataKey="ret" name="Monthly Return" stroke="var(--gold)" fill="rgba(232,184,75,0.1)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per-product multi-line growth chart */}
      <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)',marginBottom:22 }} className="animate-in delay-3">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
          <div>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Per-Product Capital Growth</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginTop:2 }}>Monthly projected growth per corporate treasury product</p>
          </div>
          <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
            <select value={chartFilter} onChange={e=>setChartFilter(e.target.value)}
              style={{ border:'1px solid #e2e8f0',borderRadius:7,padding:'7px 12px',fontSize:11,color:'var(--navy)',fontFamily:'DM Sans,sans-serif',cursor:'pointer',outline:'none' }}>
              <option value="all">All Products</option>
              {PORTFOLIO.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {['area','line','bar'].map(t=>(
              <button key={t} onClick={()=>setChartType(t)} style={{ padding:'6px 11px',borderRadius:7,border:`1.5px solid ${chartType===t?'var(--navy)':'#e2e8f0'}`,background:chartType===t?'var(--navy)':'white',color:chartType===t?'white':'var(--navy)',fontSize:10,fontWeight:700,cursor:'pointer',textTransform:'capitalize' }}>{t}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          {chartType==='bar' ? (
            <BarChart data={perProdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
              <XAxis dataKey="month" tick={{ fontSize:11 }}/><YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(0)+'M'} tick={{ fontSize:10 }}/>
              <Tooltip formatter={v=>[fmt(v)]}/><Legend/>
              {displayedProds.map(p=><Bar key={p.id} dataKey={p.name} fill={p.color} radius={[3,3,0,0]}/>)}
            </BarChart>
          ) : chartType==='line' ? (
            <LineChart data={perProdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
              <XAxis dataKey="month" tick={{ fontSize:11 }}/><YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(0)+'M'} tick={{ fontSize:10 }}/>
              <Tooltip formatter={v=>[fmt(v)]}/><Legend/>
              {displayedProds.map(p=><Line key={p.id} type="monotone" dataKey={p.name} stroke={p.color} strokeWidth={2.5} dot={{ r:3 }}/>)}
            </LineChart>
          ) : (
            <AreaChart data={perProdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
              <XAxis dataKey="month" tick={{ fontSize:11 }}/><YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(0)+'M'} tick={{ fontSize:10 }}/>
              <Tooltip formatter={v=>[fmt(v)]}/><Legend/>
              {displayedProds.map(p=><Area key={p.id} type="monotone" dataKey={p.name} stroke={p.color} fill={p.color+'18'} strokeWidth={2}/>)}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Per-product Balance Bar */}
      <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)',marginBottom:22 }} className="animate-in delay-3">
        <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:18 }}>Balance by Product</h3>
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {PORTFOLIO.sort((a,b)=>b.balance-a.balance).map(p=>{
            const pct = ((p.balance/totalAUM)*100).toFixed(1);
            return (
              <div key={p.id}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4,alignItems:'center' }}>
                  <span style={{ fontSize:11,fontWeight:600,color:'var(--navy)' }}>{p.name}</span>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:11,fontWeight:700,color:p.color }}>₦{(p.balance/1e6).toFixed(1)}M ({pct}%)</span>
                    <button onClick={()=>setDrawerProduct(p)} style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 9px',background:p.color+'18',border:`1px solid ${p.color}30`,borderRadius:6,cursor:'pointer',fontSize:10,fontWeight:700,color:p.color,flexShrink:0 }}>
                      <Eye size={10}/> View
                    </button>
                  </div>
                </div>
                <div style={{ height:8,background:'var(--gray-100)',borderRadius:4,overflow:'hidden' }}>
                  <div style={{ height:'100%',width:`${pct}%`,background:p.color,borderRadius:4,transition:'width 0.5s ease' }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal==='subscribe' && <SubscribeModal onClose={()=>setModal(null)}/>}
      {modal==='redeem'    && <RedeemModal    onClose={()=>setModal(null)} portfolio={PORTFOLIO}/>}
      {drawerProduct && <CorpProductDrawer product={drawerProduct} onClose={()=>setDrawerProduct(null)}/>}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @media(max-width:900px){div[style*="grid-template-columns: 1fr 220px"]{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  );
}
