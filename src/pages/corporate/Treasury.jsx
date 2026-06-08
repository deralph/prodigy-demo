import React, { useState, useMemo } from 'react';
import { PlusCircle, RefreshCcw, TrendingUp, ChevronDown, ChevronUp, Clock, Eye, Download, Award } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import DetailRow from '../../components/ui/DetailRow';
import SlideDrawer from '../../components/ui/SlideDrawer';
import TabBar from '../../components/ui/TabBar';
import ModalOverlay from '../../components/ui/ModalOverlay';
import PortfolioHero from '../../components/portfolio/PortfolioHero';
import PortfolioChart from '../../components/charts/PortfolioChart';
import TerminationFlow from '../../components/portfolio/TerminationFlow';
import ChartCard from '../../components/charts/ChartCard';
import SectionCard from '../../components/ui/SectionCard';

const fmt    = n => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 });
const fmtAUM = n => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TENOR_OPTIONS = ['30 Days','60 Days','90 Days','120 Days','150 Days','180 Days','210 Days','240 Days','270 Days','300 Days','330 Days','365 Days'];

/* ── Per-product drawer ──────────────────────────────── */
function CorpProductDrawer({ product, onClose }) {
  const [tab, setTab] = useState('overview');
  const net  = product.balance * 0.15;
  const tax  = net * 0.10;
  const netP = net - tax;

  const chartData = MONTHS.map((month, mi) => ({
    month,
    value:     Math.round(product.balance * (0.7 + 0.3 * ((mi + 1) / 12))),
    principal: Math.round(product.balance * (0.65 + 0.2 * ((mi + 1) / 12))),
    returns:   Math.round(product.balance * 0.0015 * (mi + 1)),
  }));

  const downloadCert = (terminated = false, reason = '') => {
    const date  = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const lines = [
      'PRODIGY FINANCE LIMITED',
      terminated ? 'CORPORATE TERMINATION CERTIFICATE' : 'CORPORATE INVESTMENT CERTIFICATE',
      '═'.repeat(54),
      `Certificate Ref : CERT-${product.id.toUpperCase()}-${Date.now()}${terminated ? '-TERM' : ''}`,
      `Issue Date      : ${date}`, '',
      `Product Name    : ${product.name}`,
      `Balance         : ${fmt(product.balance)}`,
      `Portfolio Weight: ${product.weight}`,
      `Est. Annual Ret : ${fmt(net)}`,
      `WHT (10%)       : ${fmt(tax)}`,
      `Net Return      : ${fmt(netP)}`,
      terminated ? `Termination Rsn : ${reason || 'Corporate decision'}` : '',
      '═'.repeat(54),
      'Prodigy Finance Limited · www.prodigyfinance.ng',
    ].filter(Boolean).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `corp-${terminated ? 'term' : 'cert'}-${product.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportStatement = () => {
    const headers = 'Month,Projected Value,Principal,Cumul. Returns';
    const rows    = chartData.map(r => `${r.month},${r.value},${r.principal},${r.returns}`);
    const blob    = new Blob([`CORPORATE PRODUCT STATEMENT\nProduct: ${product.name}\n\n${headers}\n${rows.join('\n')}`], { type: 'text/csv' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url; a.download = `corp-${product.id}-statement.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [{ key: 'overview', label: 'Overview' }, { key: 'chart', label: 'Chart' }, { key: 'terminate', label: '⚠ Terminate' }];

  return (
    <SlideDrawer
      onClose={onClose}
      headerColor={product.color}
      headerContent={
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Corporate Investment Dashboard</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'white' }}>{product.name}</div>
        </div>
      }
      headerStats={[
        { label: 'Balance',    val: fmt(product.balance) },
        { label: 'Weight',     val: product.weight },
        { label: 'Net Return', val: fmt(netP) },
      ]}
    >
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ padding: '22px 24px' }}>
        {tab === 'overview' && (
          <div>
            {[['Product', product.name], ['Balance', fmt(product.balance)], ['Portfolio Weight', product.weight], ['Est. Annual Return', fmt(net)], ['WHT (10%)', fmt(tax)], ['Net Return', fmt(netP)]].map(([l, v], i, arr) =>
              <DetailRow key={l} label={l} value={v} noBorder={i === arr.length - 1} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
              <button onClick={() => downloadCert(false)} style={{ padding: '12px', background: `${product.color}18`, color: product.color, border: `1px solid ${product.color}30`, borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Award size={14} /> CERTIFICATE
              </button>
              <button onClick={exportStatement} style={{ padding: '12px', background: 'rgba(13,27,53,0.07)', color: 'var(--navy)', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Download size={14} /> STATEMENT
              </button>
            </div>
          </div>
        )}
        {tab === 'chart' && (
          <div>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>12-Month Projected Growth</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => '₦' + (v / 1e6).toFixed(1) + 'M'} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [fmt(v)]} /><Legend />
                <Area type="monotone" dataKey="value"     name="Total Value" stroke={product.color}  fill={product.color + '18'} strokeWidth={2.5} />
                <Area type="monotone" dataKey="principal" name="Principal"   stroke="var(--navy)"    fill="rgba(13,27,53,0.05)" strokeWidth={1.5} strokeDasharray="4 2" />
                <Area type="monotone" dataKey="returns"   name="Returns"     stroke="var(--gold)"    fill="rgba(232,184,75,0.07)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {tab === 'terminate' && (
          <TerminationFlow
            productName={product.name}
            principal={product.balance}
            netReturn={netP}
            onDownloadCert={reason => downloadCert(true, reason)}
            mandateNote="Board resolution required. Processing begins within 2 business days."
            bullets={[
              '25% penalty on accrued net returns applies.',
              'Board resolution must be uploaded.',
              'Principal returned within 5 business days.',
              'Termination Certificate issued upon approval.',
            ]}
          />
        )}
      </div>
    </SlideDrawer>
  );
}

/* ── Subscribe Modal ─────────────────────────────── */
function SubscribeModal({ onClose }) {
  const { plans } = useAppStore();
  const [openId,  setOpenId]  = useState(null);
  const [amounts, setAmounts] = useState({});
  const [tenors,  setTenors]  = useState({});
  const [success, setSuccess] = useState({});

  const handleInvest = plan => {
    if (!plan.negotiated) {
      const amt = parseInt((amounts[plan.id] || '').replace(/[^0-9]/g, ''), 10) || 0;
      if (amt < plan.minInvest) { alert(`Minimum investment is ${fmt(plan.minInvest)}`); return; }
    }
    setSuccess(s => ({ ...s, [plan.id]: true }));
    setTimeout(() => { setSuccess(s => ({ ...s, [plan.id]: false })); setOpenId(null); }, 2200);
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={580} scrollable headerContent={
      <div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Invest in Prodigy</h2>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>Source: Corporate Wallet</p>
      </div>
    }>
      {plans.map(plan => {
        const isOpen = openId === plan.id;
        const isOk   = success[plan.id];
        return (
          <div key={plan.id} style={{ border: `1.5px solid ${isOpen ? plan.color + '55' : 'var(--gray-200)'}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden', background: isOpen ? `${plan.color}07` : 'white' }}>
            <button onClick={() => setOpenId(p => p === plan.id ? null : plan.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: plan.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                {plan.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.04em' }}>{plan.name.toUpperCase()}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: plan.tag ? '#8b5cf6' : 'var(--green)', marginTop: 2 }}>{plan.tag || plan.roi}</div>
              </div>
              {isOpen ? <ChevronUp size={16} color="var(--gray-400)" /> : <ChevronDown size={16} color="var(--gray-400)" />}
            </button>
            {isOpen && (
              <div style={{ padding: '0 18px 18px' }}>
                <p style={{ fontSize: 11, color: 'var(--gray-600)', lineHeight: 1.65, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{plan.desc}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  {[['Min. Invest', plan.negotiated ? 'NEGOTIATED' : fmt(plan.minInvest)], ['Lock-In', plan.lockIn]].map(([l, v]) => (
                    <div key={l} style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 4 }}>{l}</div>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {plan.hasTenor && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Select Tenor</div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '11px 14px', background: 'white' }}>
                      <Clock size={14} color="var(--gray-400)" style={{ flexShrink: 0 }} />
                      <select value={tenors[plan.id] || '30 Days'} onChange={e => setTenors(t => ({ ...t, [plan.id]: e.target.value }))} style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: 'var(--navy)', background: 'transparent', appearance: 'none', cursor: 'pointer' }}>
                        {TENOR_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={14} color="var(--gray-400)" style={{ pointerEvents: 'none' }} />
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 7 }}>Amount (₦)</div>
                  <input
                    type="text"
                    placeholder={plan.negotiated ? 'NEGOTIATED' : `MIN: ${fmt(plan.minInvest)}`}
                    value={amounts[plan.id] || ''}
                    onChange={e => setAmounts(a => ({ ...a, [plan.id]: e.target.value }))}
                    disabled={plan.negotiated}
                    style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '12px 14px', fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#1e293b', background: plan.negotiated ? 'var(--gray-50)' : 'white', outline: 'none' }}
                    onFocus={e => !plan.negotiated && (e.target.style.borderColor = plan.color)}
                    onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                  />
                </div>
                <button onClick={() => handleInvest(plan)} style={{ width: '100%', background: isOk ? 'var(--green)' : 'var(--gold)', color: isOk ? 'white' : 'var(--navy)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', border: 'none', borderRadius: 10, padding: '14px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {isOk ? '✓ INVESTMENT SUBMITTED' : <><PlusCircle size={14} /> INVEST NOW</>}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </ModalOverlay>
  );
}

/* ── Treasury page ───────────────────────────────── */
export default function Treasury() {
  const { user, clientInvestments, plans } = useAppStore();
  const [modal,          setModal]          = useState(null);
  const [drawerProduct,  setDrawerProduct]  = useState(null);
  const [chartFilter,    setChartFilter]    = useState('all');
  const [chartType,      setChartType]      = useState('area');

  const PORTFOLIO = useMemo(() => {
    const myInvs  = clientInvestments.filter(i => i.clientId === user?.clientId || i.clientId === user?.id);
    const total   = myInvs.reduce((s, i) => s + (i.amount || 0), 0);
    const grouped = {};
    myInvs.forEach(inv => {
      const plan = plans.find(p => p.id === inv.planId) || {};
      if (!grouped[inv.planId]) grouped[inv.planId] = { id: inv.planId, name: inv.plan || plan.name || 'Unknown', balance: 0, color: plan.color || '#3b82f6', roi: plan.roiMin || 0 };
      grouped[inv.planId].balance += (inv.amount || 0);
    });
    return Object.values(grouped).map(p => ({ ...p, weight: total > 0 ? ((p.balance / total) * 100).toFixed(1) + '%' : '0%' }));
  }, [clientInvestments, plans, user]);

  const totalAUM       = PORTFOLIO.reduce((s, p) => s + p.balance, 0);
  const pieData        = PORTFOLIO.map(p => ({ name: p.name, value: parseFloat(p.weight) }));
  const displayedProds = chartFilter === 'all' ? PORTFOLIO : PORTFOLIO.filter(p => p.id === chartFilter);

  const perProdData = useMemo(() => {
    const filtered = chartFilter === 'all' ? PORTFOLIO : PORTFOLIO.filter(p => p.id === chartFilter);
    return MONTHS.map((month, mi) => {
      const row = { month };
      filtered.forEach(p => {
        const monthlyRate = (p.roi || 0) / 1200;
        const accrued = p.balance * monthlyRate * (mi + 1);
        row[p.name] = Math.round(p.balance + accrued);
      });
      return row;
    });
  }, [chartFilter, PORTFOLIO]);

  const GROWTH_DATA = useMemo(() => {
    const weightedRoi = totalAUM > 0 ? PORTFOLIO.reduce((s, p) => s + (p.roi || 0) * p.balance, 0) / totalAUM : 0;
    const monthlyReturn = totalAUM * (weightedRoi / 100) / 12;
    return MONTHS.map((month, mi) => ({
      month,
      aum: Math.round(totalAUM),
      ret: Math.round(monthlyReturn * (mi + 1)),
    }));
  }, [totalAUM, PORTFOLIO]);

  return (
    <div>
      <PageHeader title="Treasury Portfolio Overview" subtitle="Bespoke Asset Management System V2.0" />

      <PortfolioHero
        label="Total Assets Under Management"
        value={fmtAUM(totalAUM)}
        sub={`${PORTFOLIO.length} Product${PORTFOLIO.length !== 1 ? 's' : ''} Active · Live Portfolio`}
        live
        actions={
          <>
            <button className="btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => setModal('subscribe')}>
              <PlusCircle size={14} /> Subscribe
            </button>
            <button className="btn-gold" onClick={() => setModal('redeem')}>
              <RefreshCcw size={14} /> Redeem
            </button>
          </>
        }
      />

      {/* Summary table + allocation pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 22, marginBottom: 24, alignItems: 'start' }} className="animate-in delay-2">
        <SectionCard title="Executive Investment Summary" noPadding
          titleAction={
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Status</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>{PORTFOLIO.length > 0 ? 'Active' : '—'}</div>
            </div>
          }
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)' }}>
                  {['Product', 'ROI', 'Risk', 'Balance (₦)', 'Weight'].map(h => (
                    <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon={TrendingUp} compact title="No active investments" message="Your booked products will appear here once confirmed." /></td></tr>
                ) : PORTFOLIO.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--gray-100)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>Active</span></td>
                    <td style={{ padding: '13px 18px' }}><span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '3px 7px', borderRadius: 4 }}>—</span></td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--navy)', fontWeight: 500 }}>{fmt(p.balance)}</td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--gray-600)' }}>{p.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="card" style={{ minWidth: 0 }}>
          <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Allocation</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PORTFOLIO[i]?.color || '#94a3b8'} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
            {PORTFOLIO.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--gray-600)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--navy)' }}>{p.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-product AUM mini cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 22 }} className="animate-in delay-3">
        {PORTFOLIO.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: `1px solid ${p.color}30`, borderLeft: `4px solid ${p.color}` }}>
            <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.name.replace('Prodigy ', '')}
            </div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: p.color }}>₦{(p.balance / 1e6).toFixed(1)}M</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>{p.weight} of total</div>
          </div>
        ))}
      </div>

      {/* AUM Growth chart */}
      <ChartCard title="Portfolio AUM & Returns Growth (Monthly)" subtitle="Total AUM vs. monthly interest/returns generated across all products" style={{ marginBottom: 22 }} className="animate-in delay-3">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={GROWTH_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '₦' + (v / 1e6).toFixed(0) + 'M'} />
            <Tooltip formatter={(v, n) => ['₦' + (v / 1e6).toFixed(2) + 'M', n]} />
            <Legend />
            <Area type="monotone" dataKey="aum" name="Total AUM"      stroke="var(--navy)" fill="rgba(13,27,53,0.07)"  strokeWidth={2.5} />
            <Area type="monotone" dataKey="ret" name="Monthly Return" stroke="var(--gold)" fill="rgba(232,184,75,0.1)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Per-product growth chart */}
      <PortfolioChart
        title="Per-Product Capital Growth"
        subtitle="Monthly projected growth per corporate treasury product"
        data={perProdData}
        products={PORTFOLIO}
        chartFilter={chartFilter}
        setChartFilter={setChartFilter}
        chartType={chartType}
        setChartType={setChartType}
      />

      {/* Balance bars */}
      <SectionCard title="Balance by Product" style={{ marginBottom: 22 }} className="animate-in delay-3">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...PORTFOLIO].sort((a, b) => b.balance - a.balance).map(p => {
            const pct = ((p.balance / totalAUM) * 100).toFixed(1);
            return (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)' }}>{p.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>₦{(p.balance / 1e6).toFixed(1)}M ({pct}%)</span>
                    <button onClick={() => setDrawerProduct(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: p.color + '18', border: `1px solid ${p.color}30`, borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700, color: p.color }}>
                      <Eye size={10} /> View
                    </button>
                  </div>
                </div>
                <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {modal === 'subscribe' && <SubscribeModal onClose={() => setModal(null)} />}
      {drawerProduct && <CorpProductDrawer product={drawerProduct} onClose={() => setDrawerProduct(null)} />}

      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 220px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
