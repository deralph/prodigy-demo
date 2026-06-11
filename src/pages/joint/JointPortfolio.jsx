import React, { useState, useMemo } from 'react';
import { TrendingUp, Users, Eye, Download, Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import InvestmentCard from '../../components/ui/InvestmentCard';
import SectionCard from '../../components/ui/SectionCard';
import DetailRow from '../../components/ui/DetailRow';
import SlideDrawer from '../../components/ui/SlideDrawer';
import TabBar from '../../components/ui/TabBar';
import PortfolioHero from '../../components/portfolio/PortfolioHero';
import PortfolioChart from '../../components/charts/PortfolioChart';
import AllocationPie from '../../components/charts/AllocationPie';
import TerminationFlow from '../../components/portfolio/TerminationFlow';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const fmtSmart = v => {
  if (!v && v !== 0) return '₦0';
  const abs = Math.abs(v);
  if (abs >= 1e9) return '₦' + (v / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return '₦' + (v / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return '₦' + (v / 1e3).toFixed(1) + 'K';
  return '₦' + v.toFixed(0);
};
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildGrowth(inv) {
  const principal = inv.amount;
  const monthlyRate = (inv.roi || 0) / 1200;
  const monthlyELI = principal * monthlyRate;
  const tenorMonths = Math.max(1, Math.round((inv.tenorDays || 365) / 30));
  const startDate = inv._valueDate;
  const maturityDate = inv._maturityDate;
  const months = [];

  if (!startDate || isNaN(startDate)) {
    const label = new Date().toLocaleString('en-US', { month: 'short', year: '2-digit' });
    return [{ month: label, principal: Math.round(principal), monthlyEli: 0, eli: 0, value: Math.round(principal) }];
  }

  const getMonthStart = d => new Date(d.getFullYear(), d.getMonth(), 1);
  const monthDiff = (a, b) => (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
  const startMonth = getMonthStart(startDate);
  const today = getMonthStart(new Date());
  let endMonth;
  if (maturityDate && !isNaN(maturityDate)) {
    endMonth = getMonthStart(maturityDate);
  } else {
    endMonth = new Date(startMonth);
    endMonth.setMonth(startMonth.getMonth() + tenorMonths - 1);
  }
  endMonth = new Date(Math.max(endMonth, today));
  const count = Math.max(1, monthDiff(endMonth, startMonth) + 1);

  for (let mi = 0; mi < count; mi++) {
    const monthDate = new Date(startMonth);
    monthDate.setMonth(startMonth.getMonth() + mi);
    const elapsed = monthDiff(monthDate, startMonth) + 1;
    const capped = Math.min(elapsed, tenorMonths);
    const cumulativeELI = monthlyELI * capped;
    months.push({
      month: monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      principal: Math.round(principal),
      monthlyEli: Math.round(monthlyELI),
      eli: Math.round(cumulativeELI),
      value: Math.round(principal + cumulativeELI),
    });
  }
  return months;
}

function JointInvestmentDrawer({ inv, plans, user, client, onClose }) {
  const plan    = plans.find(p => p.id === inv.planId);
  const color   = plan?.color || 'var(--navy)';
  const gross   = (inv.amount * inv.roi) / 100;
  const tax     = (gross * (inv.tax || 0)) / 100;
  const net     = gross - tax;
  const penaltyRate = plan?.earlyExitPenalty ? Number(plan.earlyExitPenalty) / 100 : 0.1;
  const penaltyPct  = Math.round(penaltyRate * 100);
  const chart   = buildGrowth(inv);
  const [tab, setTab] = useState('overview');

  const holders = client?.holders || [
    { name: user?.name || 'Primary Holder' },
    { name: client?.secondaryName || 'Secondary Holder' },
  ];

  const TABS = [
    { key: 'overview',  label: 'Overview' },
    { key: 'chart',     label: 'Chart' },
    { key: 'history',   label: 'History' },
    { key: 'terminate', label: '⚠ Terminate' },
  ];

  const downloadCert = (terminated = false, reason = '') => {
    const date  = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const lines = [
      'PRODIGY FINANCE LIMITED',
      terminated ? 'JOINT TERMINATION CERTIFICATE' : 'JOINT INVESTMENT CERTIFICATE',
      '═'.repeat(54), '',
      `Certificate Ref : CERT-${inv.id}${terminated ? '-TERM' : ''}`,
      `Issue Date      : ${date}`, '',
      '── JOINT ACCOUNT HOLDERS ────────────────────────────',
      ...holders.map((h, i) => `Holder ${i + 1}        : ${h.name} · ${i === 0 ? 'Primary' : 'Secondary'}`),
      `Mandate         : ${client?.mandate || 'AND'}`, '',
      '── INVESTMENT DETAILS ───────────────────────────────',
      `Product         : ${inv.plan}`,
      `Principal       : ${fmt(inv.amount)}`,
      `ROI Rate        : ${inv.roi}% per annum`,
      `Tenor           : ${inv.tenor}`,
      `Value Date      : ${inv.valueDate}`,
      `Maturity Date   : ${inv.maturityDate}`, '',
      '── RETURNS ──────────────────────────────────────────',
      `Gross Return    : ${fmt(gross)}`,
      `Tax Deducted    : ${fmt(tax)}`,
      `Net Return      : ${fmt(net)}`,
      terminated ? `Reason          : ${reason || 'Client request'}` : '',
      '═'.repeat(54),
      'Prodigy Finance Limited · www.prodigyfinance.ng',
    ].filter(Boolean).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `joint-${terminated ? 'term' : 'cert'}-${inv.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportStatement = () => {
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const rows = (inv.history || []).map(h => `"${h.date}","${h.action}","${fmt(inv.amount)}","${inv.status}"`);
    const blob = new Blob([`JOINT ACCOUNT STATEMENT — ${inv.plan}\nGenerated: ${date}\nHolders: ${holders.map(h => h.name).join(' & ')}\n\nDate,Action,Amount,Status\n${rows.join('\n')}`], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `joint-${inv.plan.replace(/\s/g, '_')}-${inv.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SlideDrawer
      onClose={onClose}
      headerColor={color}
      headerContent={
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Joint Investment Dashboard</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'white' }}>{inv.plan}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
            {holders.map(h => h.name.split(' ')[0]).join(' & ')} · {client?.mandate || 'AND'} Mandate
          </div>
        </div>
      }
      headerStats={[
        { label: 'Principal',  val: fmt(inv.amount) },
        { label: 'Net Return', val: fmt(net) },
        { label: 'ROI Rate',   val: `${inv.roi}% p.a.` },
      ]}
    >
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ padding: '22px 24px' }}>
        {tab === 'overview' && (
          <div>
            {/* Holders */}
            <div style={{ marginBottom: 16 }}>
              {holders.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--gray-50)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0 }}>{h.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{h.name}</span>{' '}
                    <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{i === 0 ? '· Primary' : '· Secondary'}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 4 }}>Joint Holder</span>
                </div>
              ))}
            </div>
            {[['Investment ID', inv.id], ['Product', inv.plan], ['Principal', fmt(inv.amount)], ['ROI Rate', `${inv.roi}% p.a.`], ['Tax', `${inv.tax || 0}%`], ['Tenor', inv.tenor], ['Value Date', inv.valueDate], ['Maturity', inv.maturityDate], ['Status', (inv.status || 'active').toUpperCase()], ['Gross Return', fmt(gross)], ['Tax Deducted', fmt(tax)], ['Net Return', fmt(net)], ['Mandate', client?.mandate || 'AND']].map(([l, v], i, arr) =>
              <DetailRow key={l} label={l} value={v} noBorder={i === arr.length - 1} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              <button onClick={() => downloadCert(false)} style={{ padding: '13px', background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Award size={14} /> CERTIFICATE
              </button>
              <button onClick={exportStatement} style={{ padding: '13px', background: 'rgba(13,27,53,0.07)', color: 'var(--navy)', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Download size={14} /> STATEMENT
              </button>
            </div>
          </div>
        )}
        {tab === 'chart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Growth Over Time</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tickFormatter={fmtSmart} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [fmt(v)]} /><Legend />
                  <Area type="monotone" dataKey="value"     name="Total Value" stroke={color}           fill={`${color}18`} strokeWidth={2.5} />
                  <Area type="monotone" dataKey="principal" name="Principal"   stroke="var(--navy)"     fill="rgba(13,27,53,0.05)" strokeWidth={1.5} strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="eli"       name="Cumul. ELI"  stroke="var(--gold)"     fill="rgba(232,184,75,0.08)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Monthly ELI</h3>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tickFormatter={v => '₦' + (v / 1e3).toFixed(0) + 'K'} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [fmt(v), 'ELI']} />
                  <Bar dataKey="monthlyEli" name="Monthly ELI" fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {tab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Transaction History</h3>
              <button onClick={exportStatement} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(13,27,53,0.07)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>
                <Download size={12} /> Export
              </button>
            </div>
            {inv.preTermination && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', marginBottom: 8, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 9 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
                    Pre-Termination Request — {inv.preTermStatus === 'pending_ops' ? 'Awaiting Ops Review' : inv.preTermStatus === 'pending_finance' ? 'Approved — Pending Disbursement' : inv.preTermStatus === 'disbursed' ? 'Disbursed' : inv.preTermStatus === 'rejected' ? 'Rejected' : 'Submitted'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                    {inv.preTermination.requestedAt ? new Date(inv.preTermination.requestedAt).toLocaleDateString('en-GB') : '—'} · Ref: {inv.preTermination.preTermRef || '—'}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>−{fmt(Number(inv.preTermination.penaltyKobo || 0) / 100)} penalty</div>
              </div>
            )}
            {(inv.history || []).length === 0 && !inv.preTermination && <div style={{ padding: '28px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 12 }}>No history available.</div>}
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
        {tab === 'terminate' && (
          inv.preTermStatus ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              {inv.preTermStatus === 'pending_ops' && <><Clock size={48} color="var(--gold)" style={{ marginBottom: 14 }} /><div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>Request Pending Review</div><p style={{ fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.6 }}>Your pre-termination request is awaiting operations review. You will be notified within 1–2 business days.</p></> }
              {inv.preTermStatus === 'pending_finance' && <><CheckCircle size={48} color="var(--green)" style={{ marginBottom: 14 }} /><div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>Approved — Pending Disbursement</div><p style={{ fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.6 }}>Operations has approved your request. Finance is processing your payout within 5 business days.</p></> }
              {inv.preTermStatus === 'disbursed' && <><CheckCircle size={48} color="var(--green)" style={{ marginBottom: 14 }} /><div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>Disbursed</div><p style={{ fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.6 }}>Your principal has been returned to your wallet.</p></> }
              {inv.preTermStatus === 'rejected' && <><XCircle size={48} color="var(--red)" style={{ marginBottom: 14 }} /><div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>Request Rejected</div><p style={{ fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.6 }}>{inv.preTermination?.rejectionReason || 'Your pre-termination request was rejected. Please contact support.'}</p></> }
            </div>
          ) : (
            <TerminationFlow
              productName={inv.plan}
              principal={inv.amount}
              netReturn={net}
              penaltyRate={penaltyRate}
              onDownloadCert={reason => downloadCert(true, reason)}
              onSubmit={async (reason) => {
                const { requestPreTermination } = useAppStore.getState();
                await requestPreTermination(inv.id, reason);
              }}
              mandateNote={client?.mandate === 'AND'
                ? `All ${holders.length} holders must co-authorise this termination.`
                : 'Any holder may authorise this termination.'}
              bullets={[
                `${penaltyPct}% penalty on principal applies for early exit.`,
                `Under ${client?.mandate || 'AND'} mandate: ${client?.mandate === 'AND' ? `all ${holders.length} signatories must co-authorise` : 'any signatory may initiate'}.`,
                'Principal returned within 5 business days of approval.',
                'Termination Certificate issued upon processing.',
              ]}
            />
          )
        )}
      </div>
    </SlideDrawer>
  );
}

export default function JointPortfolio() {
  const { user, clientInvestments, clients, plans } = useAppStore();
  const client  = clients.find(c => c.clientId === user?.clientId);
  const holders = client?.holders || [
    { name: user?.name || 'Primary Holder' },
    { name: client?.secondaryName || 'Secondary Holder' },
  ];
  const [drawer,       setDrawer]       = useState(null);
  const [chartFilter,  setChartFilter]  = useState('all');
  const [chartType,    setChartType]    = useState('area');
  const [statusFilter, setStatusFilter] = useState('all');

  const myInvs    = clientInvestments.filter(i => i.preTermStatus !== 'disbursed');
  const displayed = statusFilter === 'all' ? myInvs : myInvs.filter(i => i.status === statusFilter);
  const totalAUM  = myInvs.reduce((s, i) => s + i.amount, 0);
  const activeAUM = myInvs.filter(i => i.status === 'active').reduce((s, i) => s + i.amount, 0);
  const avgRoi    = myInvs.length ? (myInvs.reduce((s, i) => s + i.roi, 0) / myInvs.length).toFixed(1) : 0;
  const totalNet  = myInvs.reduce((s, i) => { const g = (i.amount * i.roi) / 100; return s + g - (g * (i.tax || 0)) / 100; }, 0);

  const uniqueProducts = [...new Map(myInvs.map(i => [i.planId, { id: i.planId, name: i.plan, color: plans.find(p => p.id === i.planId)?.color || '#3b82f6' }])).values()];

  const perProductData = useMemo(() => {
    const activeInvs = myInvs.filter(i => i.status === 'active');
    const filtered = chartFilter === 'all' ? activeInvs : activeInvs.filter(i => i.planId === chartFilter);
    if (!filtered.length) return [];

    const getMonthStart = d => new Date(d.getFullYear(), d.getMonth(), 1);
    const monthDiff = (a, b) => (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
    const valid = filtered.filter(i => i._valueDate && !isNaN(i._valueDate));
    if (!valid.length) return [];

    const startDates = valid.map(i => getMonthStart(i._valueDate));
    const maturityDates = valid.map(i => i._maturityDate && !isNaN(i._maturityDate) ? getMonthStart(i._maturityDate) : getMonthStart(new Date()));
    const todayStart = getMonthStart(new Date());
    const earliest = new Date(Math.min(...startDates));
    const latest = new Date(Math.max(...maturityDates, todayStart));
    const monthCount = Math.max(1, monthDiff(latest, earliest) + 1);

    const productNames = [...new Set(valid.map(i => {
      const plan = plans.find(p => p.id === i.planId);
      return plan?.name || i.plan || 'Unknown';
    }))];

    const rows = [];
    for (let mi = 0; mi < monthCount; mi++) {
      const monthDate = new Date(earliest);
      monthDate.setMonth(earliest.getMonth() + mi);
      const row = { month: monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }) };
      productNames.forEach(name => {
        const invs = valid.filter(i => { const plan = plans.find(p => p.id === i.planId); return (plan?.name || i.plan || 'Unknown') === name; });
        let total = 0;
        invs.forEach(inv => {
          const invStart = getMonthStart(inv._valueDate);
          if (monthDate >= invStart) {
            const elapsed = monthDiff(monthDate, invStart) + 1;
            const tenorMonths = Math.max(1, Math.round((inv.tenorDays || 365) / 30));
            const capped = Math.min(elapsed, tenorMonths);
            const monthlyRate = (inv.roi || 0) / 1200;
            total += inv.amount + inv.amount * monthlyRate * capped;
          }
        });
        row[name] = Math.round(total);
      });
      rows.push(row);
    }
    return rows;
  }, [myInvs, plans, chartFilter]);

  const pieData    = uniqueProducts.map(p => ({ name: p.name, value: myInvs.filter(i => i.planId === p.id).reduce((s, i) => s + i.amount, 0), color: p.color }));
  const kpiStats   = [
    { label: 'Joint AUM',   value: fmt(totalAUM),  color: 'var(--navy)',  icon: TrendingUp },
    { label: 'Active',      value: myInvs.filter(i => i.status === 'active').length, color: 'var(--green)', icon: TrendingUp },
    { label: 'Avg ROI',     value: `${avgRoi}%`,   color: 'var(--gold)',  icon: TrendingUp },
    { label: 'Net Returns', value: fmt(totalNet),  color: '#22c55e',      icon: TrendingUp },
    { label: 'Products',    value: uniqueProducts.length, color: '#8b5cf6', icon: TrendingUp },
  ];

  return (
    <div>
      <PageHeader title="Asset Portfolio" subtitle={`Joint Investment Dashboard · ${holders.length} Holders`} />

      {/* Holders banner */}
      <div style={{ background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.25)', borderRadius: 10, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }} className="animate-in">
        <Users size={14} color="var(--gold)" />
        <span style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>
          {holders.map((h, i) => <span key={i}>{i > 0 ? ' · ' : ''}<strong>{h.name}</strong></span>)}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold)', background: 'rgba(232,184,75,0.12)', padding: '3px 9px', borderRadius: 4 }}>
          {client?.mandate || 'AND'} Mandate
        </span>
      </div>

      <PortfolioHero
        label="Joint Portfolio Value"
        value={fmt(totalAUM)}
        sub={`${avgRoi}% Avg ROI · ${myInvs.filter(i => i.status === 'active').length} Active`}
        stats={[{ label: 'Active AUM', val: fmt(activeAUM) }, { label: 'Est. Net', val: fmt(totalNet) }, { label: 'Products', val: uniqueProducts.length }]}
        live
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 22 }} className="animate-in delay-2">
        {kpiStats.map(s => <StatCard key={s.label} label={s.label} value={s.value} color={s.color} icon={s.icon} size="sm" />)}
      </div>

      {myInvs.length > 0 && (
        <PortfolioChart
          title="Joint Portfolio Growth by Product"
          subtitle="Monthly capital growth per investment product"
          data={perProductData}
          products={uniqueProducts}
          chartFilter={chartFilter}
          setChartFilter={setChartFilter}
          chartType={chartType}
          setChartType={setChartType}
        />
      )}

      {myInvs.length > 0 && pieData.length > 1 && (
        <AllocationPie data={pieData} totalValue={totalAUM} title="Portfolio Allocation" />
      )}

      {/* Holdings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="animate-in delay-3">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Shared Holdings</h3>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '7px 12px', fontSize: 11, color: 'var(--navy)', fontFamily: 'DM Sans,sans-serif', cursor: 'pointer', outline: 'none' }}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="matured">Matured</option>
            <option value="pre_term">Pre-Term</option>
          </select>
        </div>
        {displayed.length === 0 && <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', padding: '40px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>No joint investments found.</div>}
        {displayed.map(inv => {
          const plan = plans.find(p => p.id === inv.planId);
          return <InvestmentCard key={inv.id} investment={inv} planColor={plan?.color} onOpen={setDrawer} />;
        })}
      </div>

      {drawer && <JointInvestmentDrawer inv={drawer} plans={plans} user={user} client={client} onClose={() => setDrawer(null)} />}
    </div>
  );
}
