import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Eye, X, Download, Award, AlertTriangle, CheckCircle,
  BarChart2, DollarSign, Layers
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import InvestmentCard from '../../components/ui/InvestmentCard';
import DetailRow from '../../components/ui/DetailRow';
import TabBar from '../../components/ui/TabBar';
import SectionCard from '../../components/ui/SectionCard';

const fmt  = n => '₦' + Number(n || 0).toLocaleString('en-NG');

function buildInvGrowth(inv) {
  const base = inv.amount;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyRate = (inv.roi || 0) / 1200;
  return months.map((m, i) => ({
    month: m,
    principal: +(base * (0.6 + 0.4 * ((i + 1) / 12))).toFixed(0),
    eli:       +(base * monthlyRate * (i + 1)).toFixed(0),
    value:     +(base * (0.6 + 0.4 * ((i + 1) / 12)) + base * monthlyRate * (i + 1)).toFixed(0),
  }));
}

function InvestmentDrawer({ inv, plans, user, onClose }) {
  const plan = plans.find(p => p.id === inv.planId);
  const color = plan?.color || 'var(--navy)';
  const grossReturn = (inv.amount * inv.roi) / 100;
  const tax         = (grossReturn * (inv.tax || 0)) / 100;
  const netReturn   = grossReturn - tax;
  const chartData   = buildInvGrowth(inv);
  const [termStep, setTermStep]   = useState(null);
  const [termReason, setTermReason] = useState('');
  const [tab, setTab] = useState('overview');

  const TABS = [
    { key: 'overview',   label: 'Overview' },
    { key: 'chart',      label: 'Chart' },
    { key: 'history',    label: 'History' },
    { key: 'terminate',  label: '⚠ Terminate' },
  ];

  const downloadCertificate = (terminated = false) => {
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const lines = [
      'PRODIGY FINANCE LIMITED',
      terminated ? 'TERMINATION CERTIFICATE' : 'INVESTMENT CERTIFICATE',
      '═'.repeat(54), '',
      `Certificate Ref : CERT-${inv.id}${terminated ? '-TERM' : ''}`,
      `Issue Date      : ${date}`, '',
      '── INVESTOR DETAILS ─────────────────────────────────',
      `Name            : ${user?.name || '—'}`,
      `Client ID       : ${user?.clientId || '—'}`,
      `Account Type    : Individual`, '',
      '── INVESTMENT DETAILS ───────────────────────────────',
      `Product         : ${inv.plan}`,
      `Investment ID   : ${inv.id}`,
      `Principal       : ${fmt(inv.amount)}`,
      `ROI Rate        : ${inv.roi}% per annum`,
      `Tax Rate        : ${inv.tax || 0}%`,
      `Tenor           : ${inv.tenor}`,
      `Value Date      : ${inv.valueDate}`,
      `Maturity Date   : ${inv.maturityDate}`,
      `Status          : ${terminated ? 'TERMINATED' : (inv.status || 'ACTIVE').toUpperCase()}`, '',
      '── RETURNS ──────────────────────────────────────────',
      `Gross Return    : ${fmt(grossReturn)}`,
      `Tax Deducted    : ${fmt(tax)}`,
      `Net Return      : ${fmt(netReturn)}`, '',
      terminated ? `Termination Reason: ${termReason || 'Client request'}` : '',
      '═'.repeat(54),
      'This certificate confirms the above investment was duly executed.',
      'Prodigy Finance Limited · www.prodigyfinance.ng',
    ].filter(l => l !== undefined).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${terminated ? 'termination' : 'investment'}-cert-${inv.id}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportStatement = () => {
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const rows = (inv.history || []).map(h => `"${h.date}","${h.action}","${fmt(inv.amount)}","${inv.status}"`).join('\n');
    const header = `PRODIGY FINANCE — ${inv.plan.toUpperCase()} PRODUCT STATEMENT\nGenerated: ${date}\nClient: ${user?.name || '—'} · ID: ${user?.clientId || '—'}\n\n`;
    const body = `Date,Action,Amount,Status\n${rows}`;
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${inv.plan.replace(/\s/g, '_')}-statement-${inv.id}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex' }} onClick={onClose}>
      <div style={{ flex: 1, background: 'rgba(13,27,53,0.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ width: 'min(520px,100vw)', background: 'white', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-24px 0 60px rgba(0,0,0,0.18)', animation: 'slideIn 0.28s ease' }}
        onClick={e => e.stopPropagation()}>
        {/* Drawer header */}
        <div style={{ background: color, padding: '22px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Investment Dashboard</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'white' }}>{inv.plan}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{inv.id} · {inv.valueDate} → {inv.maturityDate}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white', display: 'flex' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['Principal', fmt(inv.amount)], ['Net Return', fmt(netReturn)], ['ROI Rate', `${inv.roi}% p.a.`]].map(([l, v]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'white' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-100)', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '12px 4px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'capitalize', color: tab === t.key ? color : 'var(--gray-400)', borderBottom: `2px solid ${tab === t.key ? color : 'transparent'}`, transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '22px 24px', overflowY: 'auto' }}>
          {/* Overview tab */}
          {tab === 'overview' && (
            <div>
              {[
                ['Investment ID', inv.id], ['Product', inv.plan], ['Principal', fmt(inv.amount)],
                ['ROI Rate', `${inv.roi}% per annum`], ['Tax Rate', `${inv.tax || 0}%`],
                ['Tenor', inv.tenor], ['Value Date', inv.valueDate], ['Maturity Date', inv.maturityDate],
                ['Status', (inv.status || 'active').toUpperCase()], ['Gross Return', fmt(grossReturn)],
                ['Tax Deducted', fmt(tax)], ['Net Return', fmt(netReturn)],
              ].map(([l, v], i, arr) => <DetailRow key={l} label={l} value={v} noBorder={i === arr.length - 1} />)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
                <button onClick={() => downloadCertificate(false)} style={{ padding: '13px', background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <Award size={14} /> CERTIFICATE
                </button>
                <button onClick={exportStatement} style={{ padding: '13px', background: 'rgba(13,27,53,0.07)', color: 'var(--navy)', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <Download size={14} /> STATEMENT
                </button>
              </div>
            </div>
          )}

          {/* Chart tab */}
          {tab === 'chart' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Growth Over Time</h3>
                <p style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 14 }}>Projected principal growth & cumulative ELI</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => '₦' + (v / 1e6).toFixed(1) + 'M'} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [fmt(v)]} />
                    <Legend />
                    <Area type="monotone" dataKey="value"     name="Total Value" stroke={color}       fill={`${color}18`} strokeWidth={2.5} />
                    <Area type="monotone" dataKey="principal" name="Principal"   stroke="var(--navy)" fill="rgba(13,27,53,0.05)" strokeWidth={1.5} strokeDasharray="4 2" />
                    <Area type="monotone" dataKey="eli"       name="Cumul. ELI"  stroke="var(--gold)" fill="rgba(232,184,75,0.08)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Monthly ELI Earnings</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => '₦' + (v / 1e3).toFixed(0) + 'K'} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [fmt(v), 'ELI']} />
                    <Bar dataKey="eli" name="Monthly ELI" fill={color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Transaction History</h3>
                <button onClick={exportStatement} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(13,27,53,0.07)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>
                  <Download size={12} /> Export CSV
                </button>
              </div>
              {(inv.history || []).length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 12 }}>No transaction history available.</div>}
              {(inv.history || []).map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{h.action}</div>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{h.date}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{fmt(h.amount || inv.amount)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Terminate tab */}
          {tab === 'terminate' && (
            <div>
              {termStep === 'done' ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <CheckCircle size={52} color="var(--green)" style={{ marginBottom: 14 }} />
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--navy)', marginBottom: 8 }}>Pre-Termination Submitted</div>
                  <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20, lineHeight: 1.6 }}>Your request has been submitted. You will be notified within 1–2 business days.</p>
                  <button onClick={() => downloadCertificate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', background: 'var(--gold)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, margin: '0 auto' }}>
                    <Award size={14} /> Download Termination Certificate
                  </button>
                </div>
              ) : termStep === 'confirm' ? (
                <div>
                  <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '16px', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <AlertTriangle size={16} color="var(--red)" />
                      <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--red)' }}>Confirm Pre-Termination</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--navy)', lineHeight: 1.7 }}>
                      You are requesting early termination of <strong>{inv.plan}</strong> with a principal of <strong>{fmt(inv.amount)}</strong>. Early termination may incur a penalty of up to <strong>25% of net returns</strong>.
                    </p>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6, fontWeight: 700 }}>Reason for Termination</div>
                    <textarea rows={3} placeholder="Explain your reason for early termination…" value={termReason} onChange={e => setTermReason(e.target.value)}
                      style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#1e293b', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = 'var(--red)'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button onClick={() => setTermStep(null)} style={{ padding: '13px', background: 'var(--gray-100)', color: 'var(--navy)', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12 }}>Cancel</button>
                    <button onClick={() => setTermStep('done')} style={{ padding: '13px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12 }}>Submit Request</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--red)', marginBottom: 8 }}>⚠ Pre-Termination / Early Exit</div>
                    <ul style={{ fontSize: 12, color: 'var(--navy)', lineHeight: 1.9, paddingLeft: 16, margin: 0 }}>
                      <li>Early termination is subject to a <strong>25% penalty on net returns</strong>.</li>
                      <li>Requests must be approved by compliance within 1–2 business days.</li>
                      <li>Principal is returned within <strong>5 business days</strong> of approval.</li>
                    </ul>
                  </div>
                  <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 10, padding: '14px', marginBottom: 18 }}>
                    {[['Investment', inv.plan], ['Principal', fmt(inv.amount)], ['Net Return', fmt(netReturn)], ['Penalty (est.)', fmt(netReturn * 0.25)], ['Net After Exit', fmt(inv.amount + netReturn * 0.75)]].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--gray-50)' }}>
                        <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setTermStep('confirm')} style={{ width: '100%', padding: '14px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <AlertTriangle size={15} /> REQUEST PRE-TERMINATION
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

export default function AssetPortfolio() {
  const { user, clientInvestments, plans } = useAppStore();
  const [drawer, setDrawer]           = useState(null);
  const [chartFilter, setChartFilter] = useState('all');
  const [chartType, setChartType]     = useState('area');
  const [statusFilter, setStatusFilter] = useState('all');

  const myInvs    = user?.role === 'admin' ? clientInvestments.filter(i => i.clientId === user?.clientId) : clientInvestments;
  const displayed = statusFilter === 'all' ? myInvs : myInvs.filter(i => i.status === statusFilter);

  const totalAUM   = myInvs.reduce((s, i) => s + i.amount, 0);
  const activeAUM  = myInvs.filter(i => i.status === 'active').reduce((s, i) => s + i.amount, 0);
  const activeCount = myInvs.filter(i => i.status === 'active').length;
  const avgRoi     = myInvs.length ? (myInvs.reduce((s, i) => s + i.roi, 0) / myInvs.length).toFixed(1) : 0;
  const totalNet   = myInvs.reduce((s, i) => { const g = (i.amount * i.roi) / 100; return s + g - ((g * (i.tax || 0)) / 100); }, 0);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const uniqueProducts = [...new Map(myInvs.map(i => [i.planId, { id: i.planId, name: i.plan, color: plans.find(p => p.id === i.planId)?.color || '#3b82f6' }])).values()];
  const displayedProducts = chartFilter === 'all' ? uniqueProducts : uniqueProducts.filter(p => p.id === chartFilter);

  const perProductData = useMemo(() => {
    const filtered = chartFilter === 'all' ? myInvs : myInvs.filter(i => i.planId === chartFilter);
    return MONTHS.map((month, mi) => {
      const row = { month };
      filtered.forEach(inv => {
        const plan = plans.find(p => p.id === inv.planId);
        const label = plan?.name || inv.plan;
        const pct = 0.6 + 0.4 * ((mi + 1) / 12);
        row[label] = (row[label] || 0) + Math.round(inv.amount * pct);
        row[label + '_roi'] = +((inv.roi * (mi + 1) / 12).toFixed(2));
      });
      return row;
    });
  }, [myInvs, plans, chartFilter]);

  const pieData = uniqueProducts.map(p => ({ name: p.name, value: myInvs.filter(i => i.planId === p.id).reduce((s, i) => s + i.amount, 0), color: p.color }));

  const kpiStats = [
    { label: 'Total Invested', val: fmt(totalAUM),    color: 'var(--navy)',  icon: DollarSign },
    { label: 'Active',         val: activeCount,       color: 'var(--green)', icon: TrendingUp },
    { label: 'Avg ROI',        val: `${avgRoi}%`,      color: 'var(--gold)',  icon: BarChart2 },
    { label: 'Net Returns',    val: fmt(totalNet),     color: '#22c55e',      icon: TrendingUp },
    { label: 'Products',       val: uniqueProducts.length, color: '#8b5cf6', icon: Layers },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Portfolio"
        subtitle={`Personal Investment Dashboard · ${myInvs.length} Position${myInvs.length !== 1 ? 's' : ''}`}
      />

      {/* AUM Hero */}
      <div style={{ background: 'var(--navy)', borderRadius: 16, padding: '26px 30px', marginBottom: 22, position: 'relative', overflow: 'hidden' }} className="animate-in delay-1">
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(232,184,75,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>Total Portfolio Value</p>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', color: 'white', letterSpacing: '-0.01em', marginBottom: 8 }}>{fmt(totalAUM)}</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <TrendingUp size={12} color="var(--green)" />
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>{avgRoi}% Avg ROI · {activeCount} Active</span>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'right' }}>
            {[['Active AUM', fmt(activeAUM)], ['Est. Net', fmt(totalNet)], ['Products', uniqueProducts.length]].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--gold)', marginTop: 2 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 22 }} className="animate-in delay-2">
        {kpiStats.map(s => <StatCard key={s.label} label={s.label} value={s.val} color={s.color} icon={s.icon} size="sm" />)}
      </div>

      {/* Portfolio growth chart */}
      {myInvs.length > 0 && (
        <SectionCard className="animate-in delay-2" title="Portfolio Growth by Product" style={{ marginBottom: 22 }}
          titleAction={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={chartFilter} onChange={e => setChartFilter(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 12px', fontSize: 11, color: 'var(--navy)', fontFamily: 'DM Sans,sans-serif', cursor: 'pointer', outline: 'none' }}>
                <option value="all">All Products</option>
                {uniqueProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {['area', 'line', 'bar'].map(t => (
                <button key={t} onClick={() => setChartType(t)} style={{ padding: '6px 11px', borderRadius: 7, border: `1.5px solid ${chartType === t ? 'var(--navy)' : '#e2e8f0'}`, background: chartType === t ? 'var(--navy)' : 'white', color: chartType === t ? 'white' : 'var(--navy)', fontSize: 10, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            {chartType === 'bar' ? (
              <BarChart data={perProductData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tickFormatter={v => '₦' + (v / 1e6).toFixed(1) + 'M'} tick={{ fontSize: 10 }} /><Tooltip formatter={v => [fmt(v)]} /><Legend />
                {displayedProducts.map(p => <Bar key={p.id} dataKey={p.name} fill={p.color} radius={[3, 3, 0, 0]} />)}
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={perProductData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tickFormatter={v => '₦' + (v / 1e6).toFixed(1) + 'M'} tick={{ fontSize: 10 }} /><Tooltip formatter={v => [fmt(v)]} /><Legend />
                {displayedProducts.map(p => <Line key={p.id} type="monotone" dataKey={p.name} stroke={p.color} strokeWidth={2.5} dot={{ r: 3 }} />)}
              </LineChart>
            ) : (
              <AreaChart data={perProductData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tickFormatter={v => '₦' + (v / 1e6).toFixed(1) + 'M'} tick={{ fontSize: 10 }} /><Tooltip formatter={v => [fmt(v)]} /><Legend />
                {displayedProducts.map(p => <Area key={p.id} type="monotone" dataKey={p.name} stroke={p.color} fill={p.color + '22'} strokeWidth={2} />)}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* Allocation pie */}
      {myInvs.length > 0 && pieData.length > 1 && (
        <SectionCard className="animate-in delay-3" title="Portfolio Allocation" style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <PieChart width={180} height={180}>
              <Pie data={pieData} cx={90} cy={90} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((p, i) => <Cell key={i} fill={p.color} />)}
              </Pie>
              <Tooltip formatter={v => [fmt(v)]} />
            </PieChart>
            <div style={{ flex: 1 }}>
              {pieData.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{fmt(p.value)}</span>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)', width: 40, textAlign: 'right' }}>{((p.value / totalAUM) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Holdings list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="animate-in delay-3">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Holdings</h3>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 12px', fontSize: 11, color: 'var(--navy)', fontFamily: 'DM Sans,sans-serif', cursor: 'pointer', outline: 'none' }}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="matured">Matured</option>
            <option value="pre_term">Pre-Term</option>
          </select>
        </div>
        {displayed.length === 0 && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', padding: '40px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
            No investments match filters. Contact your relationship manager to get started.
          </div>
        )}
        {displayed.map(inv => {
          const plan = plans.find(p => p.id === inv.planId);
          return <InvestmentCard key={inv.id} investment={inv} planColor={plan?.color} onOpen={setDrawer} />;
        })}
      </div>

      {drawer && <InvestmentDrawer inv={drawer} plans={plans} user={user} onClose={() => setDrawer(null)} />}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
