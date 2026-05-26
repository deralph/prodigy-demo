import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, Scatter } from 'recharts';
import { Filter, TrendingUp, TrendingDown, Users, DollarSign, BarChart2, Activity } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';

const fmt = n => '₦' + (n >= 1e9 ? (n/1e9).toFixed(2)+'B' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : Number(n).toLocaleString('en-NG'));
const fmtM = n => `₦${(n/1000000).toFixed(1)}M`;

/* ── Static enriched chart data ─────────────────────────── */
const aumTrend = [
  { month:'Jan 24', corporate:62, individual:18, joint:5,  total:85 },
  { month:'Feb 24', corporate:70, individual:20, joint:5.5,total:95.5 },
  { month:'Mar 24', corporate:80, individual:22, joint:6,  total:108 },
  { month:'Apr 24', corporate:85, individual:24, joint:7,  total:116 },
  { month:'May 24', corporate:90, individual:26, joint:7.5,total:123.5 },
  { month:'Jun 24', corporate:95, individual:28, joint:8,  total:131 },
  { month:'Jul 24', corporate:102,individual:31, joint:9,  total:142 },
  { month:'Aug 24', corporate:108,individual:33, joint:9.5,total:150.5 },
];

const clientGrowth = [
  { month:'Jan', corporate:8, individual:12, joint:2, total:22 },
  { month:'Feb', corporate:10,individual:15, joint:3, total:28 },
  { month:'Mar', corporate:12,individual:18, joint:4, total:34 },
  { month:'Apr', corporate:14,individual:20, joint:4, total:38 },
  { month:'May', corporate:15,individual:22, joint:5, total:42 },
  { month:'Jun', corporate:17,individual:25, joint:5, total:47 },
  { month:'Jul', corporate:19,individual:27, joint:6, total:52 },
  { month:'Aug', corporate:21,individual:29, joint:7, total:57 },
];

const portfolioGrowth = [
  { month:'Jan', capital:85000000, eli:1487500, cumReturn:1487500,  roiPct:21 },
  { month:'Feb', capital:95500000, eli:1671250, cumReturn:3158750,  roiPct:21.1 },
  { month:'Mar', capital:108000000,eli:1890000, cumReturn:5048750,  roiPct:21.2 },
  { month:'Apr', capital:116000000,eli:2030000, cumReturn:7078750,  roiPct:21.3 },
  { month:'May', capital:123500000,eli:2161250, cumReturn:9240000,  roiPct:21.5 },
  { month:'Jun', capital:131000000,eli:2292500, cumReturn:11532500, roiPct:21.5 },
  { month:'Jul', capital:142000000,eli:2485000, cumReturn:14017500, roiPct:21.7 },
  { month:'Aug', capital:150500000,eli:2633750, cumReturn:16651250, roiPct:21.9 },
];

const perProductGrowth = [
  { month:'Jan', apex:50, genesis:100, aura:10,  flex:5,  liquidity:5,  vcf:75, vantage:12.5 },
  { month:'Feb', apex:52, genesis:100, aura:10.5,flex:5.5,liquidity:5.5,vcf:75, vantage:13 },
  { month:'Mar', apex:54, genesis:100, aura:11,  flex:6,  liquidity:6,  vcf:75, vantage:13 },
  { month:'Apr', apex:55, genesis:100, aura:11.5,flex:6.5,liquidity:6.5,vcf:75, vantage:13.5 },
  { month:'May', apex:56, genesis:100, aura:12,  flex:7,  liquidity:7,  vcf:75, vantage:14 },
  { month:'Jun', apex:57, genesis:100, aura:12.5,flex:7.5,liquidity:7.5,vcf:75, vantage:14 },
  { month:'Jul', apex:58, genesis:100, aura:13,  flex:8,  liquidity:8,  vcf:75, vantage:14.5 },
  { month:'Aug', apex:60, genesis:100, aura:13.5,flex:8,  liquidity:8,  vcf:75, vantage:15 },
];


export default function Analytics() {
  const { clients, clientInvestments, plans, allTransactions } = useAppStore();
  const [tab, setTab] = useState('overview');
  const [filterType,    setFilterType]    = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');

  const activeInvs = clientInvestments.filter(i => i.status === 'active');
  const totalAUM   = activeInvs.reduce((s,i) => s + i.amount, 0);
  const byType = {
    corporate:  activeInvs.filter(i=>i.clientType==='corporate').reduce((s,i)=>s+i.amount,0),
    individual: activeInvs.filter(i=>i.clientType==='individual').reduce((s,i)=>s+i.amount,0),
    joint:      activeInvs.filter(i=>i.clientType==='joint').reduce((s,i)=>s+i.amount,0),
  };

  const pieData = [
    { name:'Corporate',  value:byType.corporate,  color:'#3b82f6' },
    { name:'Individual', value:byType.individual, color:'#22c55e' },
    { name:'Joint',      value:byType.joint,      color:'#8b5cf6' },
  ];

  const planPie = plans.map(p => ({
    name: p.name,
    value: activeInvs.filter(inv => inv.planId === p.id).reduce((s,inv) => s + inv.amount, 0),
    color: p.color,
  })).filter(p => p.value > 0);

  const roiByProduct = plans.map(p => {
    const aumVal = activeInvs.filter(i => i.planId === p.id).reduce((s,i) => s + i.amount, 0);
    const roi    = p.roiMin || p.roi || 0;
    const tax    = p.tax || p.wht || 10;
    return { product: p.name, roi, tax, netRoi: +(roi - roi*(tax/100)).toFixed(2), color: p.color || '#3b82f6', aum: +(aumVal/1e6).toFixed(1) };
  }).filter(p => p.aum > 0);

  const principalRateTime = plans.map(p => {
    const invs     = activeInvs.filter(i => i.planId === p.id);
    const principal = invs.reduce((s,i) => s + i.amount, 0);
    const rate      = p.roiMin || p.roi || 0;
    const months    = p.tenor || 12;
    const netReturn = Math.round(principal * (rate/100) * (months/12) * (1 - (p.tax||p.wht||10)/100));
    return { product: p.name, principal, rate, months, netReturn };
  }).filter(p => p.principal > 0);

  const totalLiquidityBalance = activeInvs.filter(i=>i.planId==='liquidity').reduce((s,i)=>s+i.amount,0);
  const kycPending = clients?.filter(c=>c.kyc==='pending').length || 0;
  const liveCumReturn = activeInvs.reduce((s,i)=>s+(i.returns||i.accruedReturn||0),0);

  const TABS = [
    { key:'overview',   label:'Overview' },
    { key:'growth',     label:'Fund Growth' },
    { key:'products',   label:'By Product' },
    { key:'eli',        label:'ELI vs Capital' },
    { key:'clients',    label:'Client Growth' },
    { key:'prt',        label:'Principal / Rate / Time' },
  ];

  const kpis = [
    { label:'Total AUM',         val:fmt(totalAUM),                                          color:'var(--navy)',  icon:DollarSign },
    { label:'Active Investors',  val:activeInvs.length,                                      color:'#3b82f6',     icon:Users },
    { label:'Avg. Investment',   val:fmt(activeInvs.length ? Math.round(totalAUM/activeInvs.length) : 0), color:'#8b5cf6', icon:BarChart2 },
    { label:'Total Return (YTD)',val:fmt(liveCumReturn),                                      color:'var(--green)',icon:TrendingUp },
    { label:'Liquidity Pool',    val:fmt(totalLiquidityBalance),                              color:'#f97316',     icon:Activity },
    { label:'Products Active',   val:plans.length,                                            color:'var(--gold)', icon:BarChart2 },
    { label:'Pending KYC',       val:kycPending,                                              color:'var(--red)',  icon:TrendingDown },
    { label:'Clients Total',     val:clients?.length || 0,                                    color:'#14b8a6',     icon:Users },
  ];

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Analytics</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Deep portfolio intelligence · Growth trends · Per-product & per-account breakdown</p>
      </div>

      {/* Filter bar */}
      <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'12px 16px',marginBottom:18,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }} className="animate-in">
        <Filter size={13} color="var(--gray-400)"/>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{ border:'1px solid var(--gray-200)',borderRadius:7,padding:'7px 10px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',background:'white',color:'var(--navy)',cursor:'pointer' }}>
          <option value="all">All Account Types</option>
          <option value="corporate">Corporate</option>
          <option value="individual">Individual</option>
          <option value="joint">Joint</option>
        </select>
        <select value={filterProduct} onChange={e=>setFilterProduct(e.target.value)}
          style={{ border:'1px solid var(--gray-200)',borderRadius:7,padding:'7px 10px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',background:'white',color:'var(--navy)',cursor:'pointer' }}>
          <option value="all">All Products</option>
          {plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:8,background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:8,padding:'7px 14px' }}>
          <TrendingUp size={13} color="var(--green)"/>
          <span style={{ fontSize:11,fontWeight:700,color:'var(--navy)' }}>Liquidity Pool: <span style={{ color:'var(--green)' }}>{fmt(totalLiquidityBalance)}</span></span>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {kpis.map(k=>(
          <div key={k.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)',display:'flex',flexDirection:'column',gap:6 }}>
            <k.icon size={15} color={k.color} style={{ opacity:0.7 }}/>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:k.color }}>{k.val}</div>
            <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex',gap:8,marginBottom:20,flexWrap:'wrap' }} className="animate-in delay-2">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{ padding:'8px 16px',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.06em',textTransform:'uppercase',background:tab===t.key?'var(--navy)':'white',color:tab===t.key?'white':'var(--gray-400)',border:`1px solid ${tab===t.key?'var(--navy)':'var(--gray-200)'}`,transition:'all 0.2s' }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div style={{ display:'flex',flexDirection:'column',gap:22 }} className="animate-in">
          {/* AUM Stacked Area */}
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>AUM Trend by Account Type (₦M)</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Stacked growth of corporate, individual and joint AUM over 8 months</p>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={aumTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize:10 }}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${v}M`}/>
                <Tooltip formatter={(v,n)=>[`₦${v}M`,n]}/>
                <Legend/>
                <Area type="monotone" dataKey="corporate"  name="Corporate"  stackId="1" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2}/>
                <Area type="monotone" dataKey="individual" name="Individual" stackId="1" stroke="#22c55e" fill="#22c55e20" strokeWidth={2}/>
                <Area type="monotone" dataKey="joint"      name="Joint"      stackId="1" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Total AUM Line */}
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Total AUM Growth Line</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Consolidated AUM trajectory — all account types combined</p>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={aumTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize:10 }}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`₦${v}M`}/>
                <Tooltip formatter={(v,n)=>[`₦${v}M`,n]}/>
                <Line type="monotone" dataKey="total" name="Total AUM" stroke="var(--navy)" strokeWidth={3} dot={{ r:5, fill:'var(--gold)' }} activeDot={{ r:7 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Pie breakdown */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:22 }}>
            <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
              <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:16 }}>AUM by Account Type</h3>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'center' }}>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {pieData.map((p,i)=><Cell key={i} fill={p.color}/>)}
                  </Pie><Tooltip formatter={v=>fmtM(v)}/></PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {pieData.map(p=>(
                    <div key={p.name}>
                      <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                        <span style={{ width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0 }}/>
                        <span style={{ fontSize:11,color:'var(--gray-600)',flex:1 }}>{p.name}</span>
                      </div>
                      <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)',paddingLeft:14 }}>{fmtM(p.value)}</div>
                      <div style={{ height:4,background:'var(--gray-100)',borderRadius:2,marginTop:3,marginLeft:14 }}>
                        <div style={{ height:'100%',width:`${((p.value/totalAUM)*100).toFixed(0)}%`,background:p.color,borderRadius:2 }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
              <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:16 }}>AUM by Product</h3>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'center' }}>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart><Pie data={planPie} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {planPie.map((p,i)=><Cell key={i} fill={p.color}/>)}
                  </Pie><Tooltip formatter={v=>fmtM(v)}/></PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex',flexDirection:'column',gap:6,maxHeight:150,overflowY:'auto' }}>
                  {planPie.sort((a,b)=>b.value-a.value).map(p=>(
                    <div key={p.name} style={{ display:'flex',alignItems:'center',gap:7 }}>
                      <span style={{ width:7,height:7,borderRadius:'50%',background:p.color,flexShrink:0 }}/>
                      <span style={{ fontSize:10,color:'var(--gray-600)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.name.replace('Prodigy ','')}</span>
                      <span style={{ fontSize:10,fontWeight:700,color:'var(--navy)' }}>{fmtM(p.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FUND GROWTH ── */}
      {tab === 'growth' && (
        <div style={{ display:'flex',flexDirection:'column',gap:22 }} className="animate-in">
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Total AUM + Cumulative Return Over Time</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>How total capital under management has grown alongside cumulative interest generated</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={portfolioGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize:11 }}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>'₦'+(v/1e6).toFixed(0)+'M'}/>
                <Tooltip formatter={(v,n)=>['₦'+(v/1e6).toFixed(2)+'M',n]}/>
                <Legend/>
                <Area type="monotone" dataKey="capital"   name="Principal AUM" stroke="var(--navy)"  fill="rgba(13,27,53,0.07)"  strokeWidth={2.5}/>
                <Area type="monotone" dataKey="cumReturn" name="Cumul. Return"  stroke="var(--green)" fill="rgba(34,197,94,0.08)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Monthly ELI (Earnings) Line Chart</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Monthly interest earned (ELI) trending upward as AUM grows</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={portfolioGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize:11 }}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'}/>
                <Tooltip formatter={(v,n)=>['₦'+(v/1e6).toFixed(3)+'M',n]}/>
                <Legend/>
                <Line type="monotone" dataKey="eli"     name="Monthly ELI"   stroke="var(--gold)" strokeWidth={2.5} dot={{ r:5 }} activeDot={{ r:7 }}/>
                <Line type="monotone" dataKey="roiPct"  name="Blended ROI %" stroke="#8b5cf6"     strokeWidth={2}   dot={{ r:4 }} yAxisId="right"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16 }}>
            {[
              { label:'Starting AUM',    val:fmt(portfolioGrowth[0].capital),              color:'var(--gray-600)' },
              { label:'Current AUM',     val:fmt(portfolioGrowth[portfolioGrowth.length-1].capital), color:'var(--navy)' },
              { label:'AUM Growth',      val:`+₦${((portfolioGrowth[portfolioGrowth.length-1].capital-portfolioGrowth[0].capital)/1e6).toFixed(1)}M`, color:'var(--green)' },
              { label:'Starting ELI/mo', val:fmt(portfolioGrowth[0].eli),                  color:'var(--gray-600)' },
              { label:'Latest ELI/mo',   val:fmt(portfolioGrowth[portfolioGrowth.length-1].eli),    color:'var(--gold)' },
              { label:'Cumul. Return',   val:fmt(totalReturn),                              color:'#8b5cf6' },
            ].map(s=>(
              <div key={s.label} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:s.color,marginBottom:4 }}>{s.val}</div>
                <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BY PRODUCT ── */}
      {tab === 'products' && (
        <div style={{ display:'flex',flexDirection:'column',gap:22 }} className="animate-in">
          {roiByProduct.length === 0 && <EmptyState icon={BarChart2} title="No product data yet" message="Product performance charts will appear once investments are active." />}
          {/* Per-product AUM bar */}
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:18 }}>AUM per Product (₦M)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roiByProduct} margin={{ bottom:40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="product" tick={{ fontSize:9 }} angle={-30} textAnchor="end" interval={0}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${v}M`}/>
                <Tooltip formatter={(v,n)=>[`₦${v}M`,n]}/>
                <Bar dataKey="aum" name="AUM (₦M)" radius={[4,4,0,0]}>
                  {roiByProduct.map((p,i)=><Cell key={i} fill={p.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Per-product growth lines */}
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Per-Product AUM Growth Over Time (₦M)</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Line chart showing how each product's AUM has grown month-on-month</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={perProductGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize:10 }}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`₦${v}M`}/>
                <Tooltip formatter={(v,n)=>[`₦${v}M`,n]}/>
                <Legend/>
                <Line type="monotone" dataKey="genesis"   name="Genesis"    stroke="#ec4899" strokeWidth={2} dot={{ r:3 }}/>
                <Line type="monotone" dataKey="vcf"       name="Corp Fund"  stroke="#6366f1" strokeWidth={2} dot={{ r:3 }}/>
                <Line type="monotone" dataKey="apex"      name="Apex"       stroke="#22c55e" strokeWidth={2} dot={{ r:3 }}/>
                <Line type="monotone" dataKey="vantage"   name="Vantage"    stroke="#8b5cf6" strokeWidth={2} dot={{ r:3 }}/>
                <Line type="monotone" dataKey="aura"      name="Aura"       stroke="#3b82f6" strokeWidth={2} dot={{ r:3 }}/>
                <Line type="monotone" dataKey="flex"      name="Flexi"      stroke="#f97316" strokeWidth={2} dot={{ r:3 }}/>
                <Line type="monotone" dataKey="liquidity" name="Liquidity"  stroke="#0d1b35" strokeWidth={2} dot={{ r:3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* ROI by product bar */}
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Gross ROI vs Net ROI by Product (%)</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Side-by-side comparison of advertised ROI vs after-tax net return</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roiByProduct} margin={{ bottom:40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="product" tick={{ fontSize:9 }} angle={-30} textAnchor="end" interval={0}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${v}%`}/>
                <Tooltip formatter={(v,n)=>[`${v}%`,n]}/>
                <Legend/>
                <Bar dataKey="roi"    name="Gross ROI %" fill="#3b82f6" radius={[3,3,0,0]}/>
                <Bar dataKey="netRoi" name="Net ROI %"   fill="#22c55e" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Product detail cards */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14 }}>
            {roiByProduct.map(p=>(
              <div key={p.product} style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
                <div style={{ height:4,background:p.color }}/>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',marginBottom:10,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{p.product}</div>
                  {[['AUM',`₦${p.aum}M`],['Gross ROI',`${p.roi}%`],['Net ROI',`${p.netRoi}%`],['Risk',p.risk]].map(([l,v])=>(
                    <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--gray-50)' }}>
                      <span style={{ fontSize:10,color:'var(--gray-400)' }}>{l}</span>
                      <span style={{ fontSize:11,fontWeight:700,color:l==='Risk'?p.color:'var(--navy)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ELI vs CAPITAL ── */}
      {tab === 'eli' && (
        <div style={{ display:'flex',flexDirection:'column',gap:22 }} className="animate-in">
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>ELI (Earnings) vs Capital — Combined Chart</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Bars = monthly ELI earned · Line = total AUM (capital deployed)</p>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={portfolioGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize:11 }}/>
                <YAxis yAxisId="left" tick={{ fontSize:10 }} tickFormatter={v=>'₦'+(v/1e6).toFixed(0)+'M'}/>
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }} tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'}/>
                <Tooltip formatter={(v,n)=>['₦'+(v/1e6).toFixed(2)+'M',n]}/>
                <Legend/>
                <Bar yAxisId="left"  dataKey="eli"     name="Monthly ELI"   fill="rgba(232,184,75,0.7)" radius={[4,4,0,0]}/>
                <Line yAxisId="right" type="monotone" dataKey="capital" name="Total Capital" stroke="var(--navy)" strokeWidth={2.5} dot={{ r:4 }}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16 }}>
            {[['corporate','Corporate','#3b82f6'],[' individual','Individual','#22c55e'],['joint','Joint','#8b5cf6']].map(([type,label,color])=>(
              <div key={type} style={{ background:'white',borderRadius:14,padding:'20px',border:'1px solid var(--gray-200)',borderTop:`4px solid ${color}` }}>
                <h4 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14 }}>{label}</h4>
                {[
                  ['AUM',       fmt(byType[type.trim()])],
                  ['Avg. Rate', '19.5% p.a.'],
                  ['Monthly ELI',fmt(byType[type.trim()]*0.195/12)],
                  ['Annual ELI', fmt(byType[type.trim()]*0.195)],
                  ['Net (post-tax)',fmt(byType[type.trim()]*0.195*0.88)],
                ].map(([l,v])=>(
                  <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:10,color:'var(--gray-400)' }}>{l}</span>
                    <span style={{ fontSize:11,fontWeight:700,color:'var(--navy)' }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CLIENT GROWTH ── */}
      {tab === 'clients' && (
        <div style={{ display:'flex',flexDirection:'column',gap:22 }} className="animate-in">
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Client Growth by Account Type</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Cumulative count of clients onboarded per account type</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={clientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize:11 }}/>
                <YAxis tick={{ fontSize:11 }}/>
                <Tooltip/>
                <Legend/>
                <Line type="monotone" dataKey="total"      name="Total Clients" stroke="var(--navy)"  strokeWidth={3} dot={{ r:5, fill:'var(--gold)' }}/>
                <Line type="monotone" dataKey="corporate"  name="Corporate"     stroke="#3b82f6" strokeWidth={2} dot={{ r:3 }}/>
                <Line type="monotone" dataKey="individual" name="Individual"    stroke="#22c55e" strokeWidth={2} dot={{ r:3 }}/>
                <Line type="monotone" dataKey="joint"      name="Joint"         stroke="#8b5cf6" strokeWidth={2} dot={{ r:3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:18 }}>New Client Additions per Month (Bar)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={clientGrowth.map((d,i,arr)=>({
                month:d.month,
                corporate:  i===0?d.corporate:d.corporate-arr[i-1].corporate,
                individual: i===0?d.individual:d.individual-arr[i-1].individual,
                joint:      i===0?d.joint:d.joint-arr[i-1].joint,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{ fontSize:11 }}/>
                <YAxis tick={{ fontSize:11 }}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="corporate"  name="Corporate"  fill="#3b82f6" radius={[3,3,0,0]}/>
                <Bar dataKey="individual" name="Individual" fill="#22c55e" radius={[3,3,0,0]}/>
                <Bar dataKey="joint"      name="Joint"      fill="#8b5cf6" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── PRINCIPAL / RATE / TIME ── */}
      {tab === 'prt' && (
        <div style={{ display:'flex',flexDirection:'column',gap:22 }} className="animate-in">
          {principalRateTime.length === 0 && <EmptyState icon={DollarSign} title="No investment data yet" message="Principal, rate and tenor data will populate once clients have active investments." />}
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Principal, Rate & Tenor Breakdown</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Per-product: principal deployed, annual ROI rate, tenor, and expected net return</p>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--gray-200)' }}>
                    {['Product','Principal','Rate (p.a.)','Tenor','Net Return','Yield %','Annualised'].map(h=>(
                      <th key={h} style={{ padding:'10px 12px',textAlign:'left',fontSize:9,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--gray-400)',fontWeight:700,whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {principalRateTime.map((row,i)=>{
                    const annualised = ((row.netReturn/row.principal)*(12/row.months)*100).toFixed(1);
                    return (
                      <tr key={row.product} style={{ borderBottom:'1px solid var(--gray-100)',background:i%2===0?'#fafafa':'white' }}>
                        <td style={{ padding:'10px 12px',fontWeight:700,color:'var(--navy)' }}>{row.product}</td>
                        <td style={{ padding:'10px 12px',color:'var(--navy)' }}>{fmt(row.principal)}</td>
                        <td style={{ padding:'10px 12px' }}><span style={{ fontWeight:700,color:'var(--green)' }}>{row.rate}%</span></td>
                        <td style={{ padding:'10px 12px',color:'var(--gray-600)' }}>{row.months} mo.</td>
                        <td style={{ padding:'10px 12px',fontWeight:700,color:'var(--green)' }}>{fmt(row.netReturn)}</td>
                        <td style={{ padding:'10px 12px' }}><span style={{ background:'rgba(232,184,75,0.12)',color:'var(--gold)',fontWeight:700,padding:'2px 8px',borderRadius:4 }}>{((row.netReturn/row.principal)*100).toFixed(1)}%</span></td>
                        <td style={{ padding:'10px 12px' }}><span style={{ background:'rgba(34,197,94,0.1)',color:'var(--green)',fontWeight:700,padding:'2px 8px',borderRadius:4 }}>{annualised}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Net Return bar chart */}
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:18 }}>Net Return by Product (₦)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={principalRateTime} margin={{ bottom:40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="product" tick={{ fontSize:9 }} angle={-30} textAnchor="end" interval={0}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>'₦'+(v/1e6).toFixed(1)+'M'}/>
                <Tooltip formatter={(v,n)=>['₦'+(v/1e6).toFixed(2)+'M',n]}/>
                <Bar dataKey="netReturn" name="Net Return" radius={[4,4,0,0]}>
                  {principalRateTime.map((_,i)=><Cell key={i} fill={['#22c55e','#ec4899','#3b82f6','#6366f1','#14b8a6','#06b6d4','#0ea5e9','#0d1b35','#f97316'][i%9]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Rate comparison line */}
          <div style={{ background:'white',borderRadius:14,padding:'22px',border:'1px solid var(--gray-200)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>Rate Comparison Across Products</h3>
            <p style={{ fontSize:11,color:'var(--gray-400)',marginBottom:18 }}>Gross rate vs net annualised rate — spot where tax erodes the most</p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={roiByProduct} margin={{ bottom:40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="product" tick={{ fontSize:9 }} angle={-30} textAnchor="end" interval={0}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${v}%`} domain={[0,35]}/>
                <Tooltip formatter={(v,n)=>[`${v}%`,n]}/>
                <Legend/>
                <Bar dataKey="roi"    name="Gross Rate %" fill="#3b82f6" radius={[3,3,0,0]}/>
                <Bar dataKey="netRoi" name="Net Rate %"   fill="#22c55e" radius={[3,3,0,0]}/>
                <Bar dataKey="tax"    name="Tax (%)"      fill="rgba(239,68,68,0.6)" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <style>{`@media(max-width:700px){
        div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}
        div[style*="1fr 1fr 1fr"]{grid-template-columns:1fr!important;}
      }`}</style>
    </div>
  );
}
