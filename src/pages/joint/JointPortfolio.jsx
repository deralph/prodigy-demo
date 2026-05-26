import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Users, Eye, X, Download, Award, AlertTriangle, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

const STATUS_STYLE = {
  active:   { color:'var(--green)', bg:'rgba(34,197,94,0.1)',  label:'Active' },
  matured:  { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)',label:'Matured' },
  pre_term: { color:'#f97316',      bg:'rgba(249,115,22,0.1)', label:'Pre-Term' },
};

const fmt2 = n => '₦' + Number(n||0).toLocaleString('en-NG');

function buildGrowth(inv) {
  const base = inv.amount;
  const rate = (inv.roi||0) / 1200;
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=>({
    month:m,
    value:  +(base*(0.6+0.4*((i+1)/12)) + base*rate*(i+1)).toFixed(0),
    principal: +(base*(0.6+0.4*((i+1)/12))).toFixed(0),
    eli:    +(base*rate*(i+1)).toFixed(0),
  }));
}

function JointInvestmentDrawer({ inv, plans, user, client, onClose }) {
  const plan  = plans.find(p => p.id === inv.planId);
  const color = plan?.color || 'var(--navy)';
  const gross = (inv.amount * inv.roi) / 100;
  const tax   = (gross * (inv.tax||0)) / 100;
  const net   = gross - tax;
  const chartData = buildGrowth(inv);
  const [tab, setTab]           = useState('overview');
  const [termStep, setTermStep] = useState(null);
  const [termReason, setTermReason] = useState('');
  const holders = client?.holders || [
    { name: user?.name||'Primary Holder' },
    { name: client?.secondaryName||'Secondary Holder' }
  ];

  const downloadCertificate = (terminated = false) => {
    const date = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
    const lines = [
      'PRODIGY FINANCE LIMITED',
      terminated ? 'JOINT TERMINATION CERTIFICATE' : 'JOINT INVESTMENT CERTIFICATE',
      '═'.repeat(54),
      '',
      `Certificate Ref : CERT-${inv.id}${terminated?'-TERM':''}`,
      `Issue Date      : ${date}`,
      '',
      '── JOINT ACCOUNT HOLDERS ────────────────────────────',
      ...holders.map((h,i)=>`Holder ${i+1}        : ${h.name} · ${(100/holders.length).toFixed(2)}% share`),
      `Mandate         : ${client?.mandate||'AND'}`,
      '',
      '── INVESTMENT DETAILS ───────────────────────────────',
      `Product         : ${inv.plan}`,
      `Principal       : ${fmt2(inv.amount)}`,
      `ROI Rate        : ${inv.roi}% per annum`,
      `Tenor           : ${inv.tenor}`,
      `Value Date      : ${inv.valueDate}`,
      `Maturity Date   : ${inv.maturityDate}`,
      `Status          : ${terminated?'TERMINATED':(inv.status||'ACTIVE').toUpperCase()}`,
      '',
      '── RETURNS ──────────────────────────────────────────',
      `Gross Return    : ${fmt2(gross)}`,
      `Tax Deducted    : ${fmt2(tax)}`,
      `Net Return      : ${fmt2(net)}`,
      terminated ? `Reason          : ${termReason||'Client request'}` : '',
      '═'.repeat(54),
      'Prodigy Finance Limited · www.prodigyfinance.ng',
    ].filter(Boolean).join('\n');
    const blob = new Blob([lines],{type:'text/plain'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`joint-${terminated?'term':'cert'}-${inv.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportStatement = () => {
    const date = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
    const rows = (inv.history||[]).map(h=>`"${h.date}","${h.action}","${fmt2(inv.amount)}","${inv.status}"`);
    const blob = new Blob([`JOINT ACCOUNT STATEMENT — ${inv.plan}\nGenerated: ${date}\nHolders: ${holders.map(h=>h.name).join(' & ')}\n\nDate,Action,Amount,Status\n${rows.join('\n')}`],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`joint-${inv.plan.replace(/\s/g,'_')}-${inv.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = ['overview','chart','history','terminate'];

  return (
    <div style={{ position:'fixed',inset:0,zIndex:400,display:'flex' }} onClick={onClose}>
      <div style={{ flex:1,background:'rgba(13,27,53,0.45)',backdropFilter:'blur(3px)' }}/>
      <div style={{ width:'min(520px,100vw)',background:'white',display:'flex',flexDirection:'column',overflowY:'auto',boxShadow:'-24px 0 60px rgba(0,0,0,0.18)',animation:'slideIn 0.28s ease' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ background:color,padding:'22px 24px',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12 }}>
            <div>
              <div style={{ fontSize:9,color:'rgba(255,255,255,0.55)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4 }}>Joint Investment Dashboard</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'white' }}>{inv.plan}</div>
              <div style={{ fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:3 }}>{holders.map(h=>h.name.split(' ')[0]).join(' & ')} · {client?.mandate||'AND'} Mandate</div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,padding:8,cursor:'pointer',color:'white',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={16}/></button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
            {[{label:'Principal',val:fmt2(inv.amount)},{label:'Net Return',val:fmt2(net)},{label:'ROI Rate',val:`${inv.roi}% p.a.`}].map(s=>(
              <div key={s.label} style={{ background:'rgba(255,255,255,0.12)',borderRadius:8,padding:'10px 12px' }}>
                <div style={{ fontSize:9,color:'rgba(255,255,255,0.55)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'white' }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex',borderBottom:'1px solid var(--gray-100)',flexShrink:0 }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:'12px 4px',border:'none',background:'transparent',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.05em',textTransform:'capitalize',color:tab===t?color:'var(--gray-400)',borderBottom:`2px solid ${tab===t?color:'transparent'}`,transition:'all 0.2s' }}>
              {t==='terminate'?'⚠ Terminate':t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ flex:1,padding:'22px 24px',overflowY:'auto' }}>
          {tab==='overview' && (
            <div>
              <div style={{ marginBottom:16 }}>
                {holders.map((h,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid var(--gray-50)' }}>
                    <div style={{ width:24,height:24,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'white',flexShrink:0 }}>{h.name.charAt(0)}</div>
                    <div style={{ flex:1 }}><span style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{h.name}</span> <span style={{ fontSize:10,color:'var(--gray-400)' }}>· {(100/holders.length).toFixed(2)}% share</span></div>
                    <span style={{ fontSize:10,fontWeight:700,color:'var(--green)',background:'rgba(34,197,94,0.1)',padding:'2px 8px',borderRadius:4 }}>Joint Holder</span>
                  </div>
                ))}
              </div>
              {[['Investment ID',inv.id],['Product',inv.plan],['Principal',fmt2(inv.amount)],['ROI Rate',`${inv.roi}% p.a.`],['Tax',`${inv.tax||0}%`],['Tenor',inv.tenor],['Value Date',inv.valueDate],['Maturity',inv.maturityDate],['Status',(inv.status||'active').toUpperCase()],['Gross Return',fmt2(gross)],['Tax Deducted',fmt2(tax)],['Net Return',fmt2(net)],['Mandate',client?.mandate||'AND']].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:16 }}>
                <button onClick={()=>downloadCertificate(false)} style={{ padding:'13px',background:`${color}18`,color,border:`1px solid ${color}30`,borderRadius:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                  <Award size={14}/> CERTIFICATE
                </button>
                <button onClick={exportStatement} style={{ padding:'13px',background:'rgba(13,27,53,0.07)',color:'var(--navy)',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                  <Download size={14}/> STATEMENT
                </button>
              </div>
            </div>
          )}
          {tab==='chart' && (
            <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
              <div>
                <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Growth Over Time</h3>
                <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:14 }}>Projected value, principal & ELI over 12 months</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                    <XAxis dataKey="month" tick={{ fontSize:10 }}/>
                    <YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:10 }}/>
                    <Tooltip formatter={v=>[fmt2(v)]}/>
                    <Legend/>
                    <Area type="monotone" dataKey="value"     name="Total Value" stroke={color}       fill={`${color}18`} strokeWidth={2.5}/>
                    <Area type="monotone" dataKey="principal" name="Principal"   stroke="var(--navy)" fill="rgba(13,27,53,0.05)" strokeWidth={1.5} strokeDasharray="4 2"/>
                    <Area type="monotone" dataKey="eli"       name="Cumul. ELI"  stroke="var(--gold)" fill="rgba(232,184,75,0.08)" strokeWidth={1.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14 }}>Monthly ELI</h3>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                    <XAxis dataKey="month" tick={{ fontSize:10 }}/>
                    <YAxis tickFormatter={v=>'₦'+(v/1e3).toFixed(0)+'K'} tick={{ fontSize:10 }}/>
                    <Tooltip formatter={v=>[fmt2(v),'ELI']}/>
                    <Bar dataKey="eli" name="Monthly ELI" fill={color} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {tab==='history' && (
            <div>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
                <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Transaction History</h3>
                <button onClick={exportStatement} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(13,27,53,0.07)',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>
                  <Download size={12}/> Export
                </button>
              </div>
              {(inv.history||[]).length===0&&<div style={{ padding:'28px',textAlign:'center',color:'var(--gray-400)',fontSize:12 }}>No history available.</div>}
              {(inv.history||[]).map((h,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <div style={{ width:8,height:8,borderRadius:'50%',background:color,flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{h.action}</div>
                    <div style={{ fontSize:10,color:'var(--gray-400)' }}>{h.date}</div>
                  </div>
                  <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{fmt2(h.amount||inv.amount)}</div>
                </div>
              ))}
            </div>
          )}
          {tab==='terminate' && (
            <div>
              {termStep==='done' ? (
                <div style={{ textAlign:'center',padding:'32px 0' }}>
                  <CheckCircle size={52} color="var(--green)" style={{ marginBottom:14 }}/>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'var(--navy)',marginBottom:8 }}>Pre-Termination Submitted</div>
                  <p style={{ fontSize:12,color:'var(--gray-400)',marginBottom:20,lineHeight:1.6 }}>
                    Request submitted. Under {client?.mandate||'AND'} mandate, {client?.mandate==='AND'?'all holders must co-authorise':'any holder may authorise'} the termination.
                  </p>
                  <button onClick={()=>downloadCertificate(true)} style={{ display:'flex',alignItems:'center',gap:6,padding:'12px 20px',background:'var(--gold)',color:'white',border:'none',borderRadius:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,margin:'0 auto' }}>
                    <Award size={14}/> Termination Certificate
                  </button>
                </div>
              ) : termStep==='confirm' ? (
                <div>
                  <div style={{ background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:12,padding:'16px',marginBottom:18 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                      <AlertTriangle size={16} color="var(--red)"/>
                      <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--red)' }}>Confirm Joint Pre-Termination</span>
                    </div>
                    <p style={{ fontSize:12,color:'var(--navy)',lineHeight:1.7 }}>Under <strong>{client?.mandate||'AND'} mandate</strong>, {client?.mandate==='AND'?`all ${holders.length} holders must approve`:'any holder may request'} this termination. A 25% penalty applies on net returns.</p>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6,fontWeight:700 }}>Reason</div>
                    <textarea rows={3} placeholder="Reason for early termination…" value={termReason} onChange={e=>setTermReason(e.target.value)}
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
                  <div style={{ background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:12,padding:'16px',marginBottom:20 }}>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--red)',marginBottom:8 }}>⚠ Joint Pre-Termination / Early Exit</div>
                    <ul style={{ fontSize:12,color:'var(--navy)',lineHeight:1.9,paddingLeft:16,margin:0 }}>
                      <li>25% penalty applies on net returns for early exit.</li>
                      <li>Under <strong>{client?.mandate||'AND'} mandate</strong>: {client?.mandate==='AND'?`all ${holders.length} signatories must co-authorise`:'any signatory may initiate'}.</li>
                      <li>Principal returned within 5 business days of approval.</li>
                      <li>Termination Certificate issued upon processing.</li>
                    </ul>
                  </div>
                  <div style={{ background:'white',border:'1px solid var(--gray-200)',borderRadius:10,padding:'14px',marginBottom:18 }}>
                    {[['Investment',inv.plan],['Principal',fmt2(inv.amount)],['Net Return',fmt2(net)],['Penalty (est.)',fmt2(net*0.25)],['Net After Exit',fmt2(inv.amount+net*0.75)]].map(([l,v])=>(
                      <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--gray-50)' }}>
                        <span style={{ fontSize:11,color:'var(--gray-400)' }}>{l}</span>
                        <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setTermStep('confirm')} style={{ width:'100%',padding:'14px',background:'var(--red)',color:'white',border:'none',borderRadius:12,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,letterSpacing:'0.06em',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                    <AlertTriangle size={15}/> REQUEST PRE-TERMINATION
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

export default function JointPortfolio() {
  const { user, clientInvestments, clients, plans } = useAppStore();
  const client  = clients.find(c => c.clientId === user?.clientId);
  const holders = client?.holders || [
    { name: user?.name||'Primary Holder' },
    { name: client?.secondaryName||'Secondary Holder' }
  ];
  const [drawer, setDrawer]           = useState(null);
  const [chartFilter, setChartFilter] = useState('all');
  const [chartType,   setChartType]   = useState('area');
  const [statusFilter,setStatusFilter]= useState('all');

  const myInvs  = clientInvestments; // scoped by getMyInvestments() in store
  const displayed = statusFilter==='all' ? myInvs : myInvs.filter(i=>i.status===statusFilter);
  const totalAUM  = myInvs.reduce((s,i)=>s+i.amount,0);
  const activeAUM = myInvs.filter(i=>i.status==='active').reduce((s,i)=>s+i.amount,0);
  const avgRoi    = myInvs.length ? (myInvs.reduce((s,i)=>s+i.roi,0)/myInvs.length).toFixed(1) : 0;
  const totalNet  = myInvs.reduce((s,i)=>{ const g=(i.amount*i.roi)/100; return s+g-((g*(i.tax||0))/100); },0);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const uniqueProducts = [...new Map(myInvs.map(i=>[i.planId,{id:i.planId,name:i.plan,color:plans.find(p=>p.id===i.planId)?.color||'#3b82f6'}])).values()];
  const displayedProducts = chartFilter==='all' ? uniqueProducts : uniqueProducts.filter(p=>p.id===chartFilter);

  const perProductData = useMemo(()=>{
    const filtered = chartFilter==='all' ? myInvs : myInvs.filter(i=>i.planId===chartFilter);
    return MONTHS.map((month, mi)=>{
      const row = { month };
      filtered.forEach(inv=>{
        const plan  = plans.find(p=>p.id===inv.planId);
        const label = plan?.name || inv.plan;
        row[label]  = (row[label]||0) + Math.round(inv.amount*(0.6+0.4*((mi+1)/12)));
        row[label+'_roi'] = +((inv.roi*(mi+1)/12).toFixed(2));
      });
      return row;
    });
  }, [myInvs, plans, chartFilter]);

  const pieData = uniqueProducts.map(p=>({ name:p.name, value:myInvs.filter(i=>i.planId===p.id).reduce((s,i)=>s+i.amount,0), color:p.color }));

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Asset Portfolio</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Joint Investment Dashboard · {holders.length} Holders</p>
      </div>

      {/* Holders banner */}
      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }} className="animate-in">
        <Users size={14} color="var(--gold)"/>
        <span style={{ fontSize:12,color:'var(--navy)',fontWeight:600 }}>
          {holders.map((h,i)=><span key={i}>{i>0?' · ':''}<strong>{h.name}</strong></span>)}
        </span>
        <span style={{ marginLeft:'auto',fontSize:10,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--gold)',background:'rgba(232,184,75,0.12)',padding:'3px 9px',borderRadius:4 }}>{client?.mandate||'AND'} Mandate</span>
      </div>

      {/* AUM Hero */}
      <div style={{ background:'var(--navy)',borderRadius:16,padding:'26px 30px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-50,right:-50,width:200,height:200,borderRadius:'50%',background:'rgba(232,184,75,0.06)' }}/>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div>
            <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:5 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:'pulse 2s infinite' }}/> Joint Portfolio Value
            </p>
            <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,4vw,40px)',color:'white',letterSpacing:'-0.01em',marginBottom:8 }}>{fmt2(totalAUM)}</h2>
            <p style={{ fontSize:12,color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',gap:5 }}>
              <TrendingUp size={12} color="var(--green)"/>
              <span style={{ color:'var(--green)',fontWeight:600 }}>{avgRoi}% Avg ROI · {myInvs.filter(i=>i.status==='active').length} Active</span>
            </p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,textAlign:'right' }}>
            {[{label:'Active AUM',val:fmt2(activeAUM)},{label:'Est. Net',val:fmt2(totalNet)},{label:'Products',val:uniqueProducts.length}].map(s=>(
              <div key={s.label}>
                <div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase' }}>{s.label}</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,color:'var(--gold)',marginTop:2 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-2">
        {[{label:'Joint AUM',val:fmt2(totalAUM),color:'var(--navy)'},{label:'Active',val:myInvs.filter(i=>i.status==='active').length,color:'var(--green)'},{label:'Avg ROI',val:`${avgRoi}%`,color:'var(--gold)'},{label:'Net Returns',val:fmt2(totalNet),color:'#22c55e'},{label:'Products',val:uniqueProducts.length,color:'#8b5cf6'}].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:12,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-product growth chart */}
      {myInvs.length>0 && (
        <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',padding:'22px',marginBottom:22 }} className="animate-in delay-2">
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10 }}>
            <div>
              <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Joint Portfolio Growth by Product</h3>
              <p style={{ fontSize:11,color:'var(--gray-400)',marginTop:2 }}>Monthly capital growth per investment product</p>
            </div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              <select value={chartFilter} onChange={e=>setChartFilter(e.target.value)}
                style={{ border:'1px solid #e2e8f0',borderRadius:7,padding:'7px 12px',fontSize:11,color:'var(--navy)',fontFamily:'DM Sans,sans-serif',cursor:'pointer',outline:'none' }}>
                <option value="all">All Products</option>
                {uniqueProducts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {['area','line','bar'].map(t=>(
                <button key={t} onClick={()=>setChartType(t)} style={{ padding:'6px 11px',borderRadius:7,border:`1.5px solid ${chartType===t?'var(--navy)':'#e2e8f0'}`,background:chartType===t?'var(--navy)':'white',color:chartType===t?'white':'var(--navy)',fontSize:10,fontWeight:700,cursor:'pointer',textTransform:'capitalize' }}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            {chartType==='bar' ? (
              <BarChart data={perProductData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                <XAxis dataKey="month" tick={{ fontSize:11 }}/><YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:10 }}/>
                <Tooltip formatter={v=>[fmt2(v)]}/><Legend/>
                {displayedProducts.map(p=><Bar key={p.id} dataKey={p.name} fill={p.color} radius={[3,3,0,0]}/>)}
              </BarChart>
            ) : chartType==='line' ? (
              <LineChart data={perProductData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                <XAxis dataKey="month" tick={{ fontSize:11 }}/><YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:10 }}/>
                <Tooltip formatter={v=>[fmt2(v)]}/><Legend/>
                {displayedProducts.map(p=><Line key={p.id} type="monotone" dataKey={p.name} stroke={p.color} strokeWidth={2.5} dot={{ r:3 }}/>)}
              </LineChart>
            ) : (
              <AreaChart data={perProductData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
                <XAxis dataKey="month" tick={{ fontSize:11 }}/><YAxis tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'} tick={{ fontSize:10 }}/>
                <Tooltip formatter={v=>[fmt2(v)]}/><Legend/>
                {displayedProducts.map(p=><Area key={p.id} type="monotone" dataKey={p.name} stroke={p.color} fill={p.color+'22'} strokeWidth={2}/>)}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* ROI trend per product */}
      {myInvs.length>0 && (
        <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',padding:'22px',marginBottom:22 }} className="animate-in delay-3">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>ROI Trend per Product</h3>
          <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:14 }}>Cumulative ROI growth over 12 months</p>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={perProductData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff"/>
              <XAxis dataKey="month" tick={{ fontSize:11 }}/><YAxis unit="%" tick={{ fontSize:10 }}/>
              <Tooltip formatter={v=>[v+'%']}/><Legend/>
              {uniqueProducts.map(p=><Line key={p.id} type="monotone" dataKey={p.name+'_roi'} name={p.name+' ROI'} stroke={p.color} strokeWidth={2} dot={false}/>)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Allocation pie */}
      {myInvs.length>0 && pieData.length>1 && (
        <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',padding:'22px',marginBottom:22 }} className="animate-in delay-3">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14 }}>Portfolio Allocation</h3>
          <div style={{ display:'flex',alignItems:'center',gap:20,flexWrap:'wrap' }}>
            <PieChart width={180} height={180}>
              <Pie data={pieData} cx={90} cy={90} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((p,i)=><Cell key={i} fill={p.color}/>)}
              </Pie>
              <Tooltip formatter={v=>[fmt2(v)]}/>
            </PieChart>
            <div style={{ flex:1 }}>
              {pieData.map((p,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                  <span style={{ width:10,height:10,borderRadius:2,background:p.color,flexShrink:0 }}/>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)',flex:1 }}>{p.name}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:p.color }}>{fmt2(p.value)}</span>
                  <span style={{ fontSize:10,color:'var(--gray-400)',width:40,textAlign:'right' }}>{((p.value/totalAUM)*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Holdings */}
      <div style={{ display:'flex',flexDirection:'column',gap:14 }} className="animate-in delay-3">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4,flexWrap:'wrap',gap:8 }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Shared Holdings</h3>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{ border:'1px solid #e2e8f0',borderRadius:7,padding:'7px 12px',fontSize:11,color:'var(--navy)',fontFamily:'DM Sans,sans-serif',cursor:'pointer',outline:'none' }}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="matured">Matured</option>
            <option value="pre_term">Pre-Term</option>
          </select>
        </div>
        {displayed.length===0 && <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>No joint investments found.</div>}
        {displayed.map(inv=>{
          const plan = plans.find(p=>p.id===inv.planId);
          const st   = STATUS_STYLE[inv.status]||STATUS_STYLE.active;
          const gross = (inv.amount*inv.roi)/100;
          const tax   = (gross*(inv.tax||0))/100;
          const net   = gross-tax;
          return (
            <div key={inv.id} style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden',transition:'box-shadow 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 20px rgba(13,27,53,0.1)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{ height:4,background:plan?.color||'var(--navy)' }}/>
              <div style={{ padding:'18px 22px',display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap' }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)' }}>{inv.plan}</span>
                    <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.bg,padding:'2px 7px',borderRadius:4 }}>{st.label}</span>
                    <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--gold)',background:'rgba(232,184,75,0.1)',padding:'2px 7px',borderRadius:4 }}>Joint</span>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(100px,1fr))',gap:'7px 18px',marginTop:6 }}>
                    {[['Principal',fmt2(inv.amount)],['ROI',`${inv.roi}%`],['Tax',`${inv.tax||0}%`],['Tenor',inv.tenor],['Value Date',inv.valueDate],['Maturity',inv.maturityDate]].map(([l,v])=>(
                      <div key={l}>
                        <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{l}</div>
                        <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)',marginTop:1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:3 }}>Est. Net Return</div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'var(--green)',marginBottom:2 }}>{fmt2(net)}</div>
                  <div style={{ fontSize:11,color:'var(--gray-400)',marginBottom:12 }}>Gross: {fmt2(gross)} · Tax: {fmt2(tax)}</div>
                  <button onClick={()=>setDrawer(inv)} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 14px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11 }}>
                    <Eye size={12}/> Open Dashboard
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {drawer && <JointInvestmentDrawer inv={drawer} plans={plans} user={user} client={client} onClose={()=>setDrawer(null)}/>}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
