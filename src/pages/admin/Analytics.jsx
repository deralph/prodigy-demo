import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, ComposedChart } from 'recharts';
import { Filter, TrendingUp, TrendingDown, Users, DollarSign, BarChart2, Activity } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import KpiGrid from '../../components/charts/KpiGrid';
import ChartCard from '../../components/charts/ChartCard';
import TabBar from '../../components/ui/TabBar';

const fmt  = n => '₦' + (n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Number(n).toLocaleString('en-NG'));
const fmtM = n => `₦${(n / 1000000).toFixed(1)}M`;

/* ── Sub-components for each tab ─────────────────── */
function AumPieCard({ title, data, totalAUM }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '22px', border: '1px solid var(--gray-200)' }}>
      <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
              {data.map((p, i) => <Cell key={i} fill={p.color} />)}
            </Pie>
            <Tooltip formatter={v => fmtM(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
          {data.sort((a, b) => b.value - a.value).map(p => (
            <div key={p.name}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--gray-600)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', paddingLeft: 14 }}>{fmtM(p.value)}</div>
              {totalAUM > 0 && (
                <div style={{ height: 4, background: 'var(--gray-100)', borderRadius: 2, marginTop: 3, marginLeft: 14 }}>
                  <div style={{ height: '100%', width: `${((p.value / totalAUM) * 100).toFixed(0)}%`, background: p.color, borderRadius: 2 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EliTypeCard({ type, label, color, byType, avgRate }) {
  const aum = byType[type.trim()] || 0;
  const rate = avgRate || 0;
  const rows = [
    ['AUM', fmt(aum)],
    ['Avg. Rate', `${rate.toFixed(1)}% p.a.`],
    ['Monthly ELI', fmt(aum * (rate / 100) / 12)],
    ['Annual ELI', fmt(aum * (rate / 100))],
    ['Net (post-tax)', fmt(aum * (rate / 100) * 0.88)],
  ];
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '20px', border: '1px solid var(--gray-200)', borderTop: `4px solid ${color}` }}>
      <h4 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>{label}</h4>
      {rows.map(([l, v]) => (
        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
          <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{l}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Tab panels ──────────────────────────────────── */
function OverviewTab({ pieData, planPie, aumTrend, totalAUM }) {
  const hasAum = aumTrend.length > 0 && aumTrend.some(d => d.total > 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }} className="animate-in">
      <ChartCard title="AUM Trend by Account Type (₦M)" subtitle="Stacked growth of corporate, individual and joint AUM over 8 months">
        {hasAum ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={aumTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}M`} />
              <Tooltip formatter={(v, n) => [`₦${v}M`, n]} /><Legend />
              <Area type="monotone" dataKey="corporate"  name="Corporate"  stackId="1" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
              <Area type="monotone" dataKey="individual" name="Individual" stackId="1" stroke="#22c55e" fill="#22c55e20" strokeWidth={2} />
              <Area type="monotone" dataKey="joint"      name="Joint"      stackId="1" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No AUM data" message="Charts will appear once investments are active." />
        )}
      </ChartCard>
      <ChartCard title="Total AUM Growth Line" subtitle="Consolidated AUM trajectory — all account types combined">
        {hasAum ? (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={aumTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₦${v}M`} />
              <Tooltip formatter={(v, n) => [`₦${v}M`, n]} />
              <Line type="monotone" dataKey="total" name="Total AUM" stroke="var(--navy)" strokeWidth={3} dot={{ r: 5, fill: 'var(--gold)' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No AUM data" message="Charts will appear once investments are active." />
        )}
      </ChartCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <AumPieCard title="AUM by Account Type" data={pieData} totalAUM={totalAUM} />
        <AumPieCard title="AUM by Product"       data={planPie} totalAUM={totalAUM} />
      </div>
    </div>
  );
}

function GrowthTab({ data }) {
  const hasData = data.length > 0 && data.some(d => d.capital > 0);
  const totalReturn = data[data.length - 1]?.cumReturn || 0;
  const summaryStats = hasData ? [
    { label: 'Starting AUM',    val: fmt(data[0].capital),               color: 'var(--gray-600)' },
    { label: 'Current AUM',     val: fmt(data[data.length - 1].capital), color: 'var(--navy)' },
    { label: 'AUM Growth',      val: `+₦${((data[data.length-1].capital - data[0].capital) / 1e6).toFixed(1)}M`, color: 'var(--green)' },
    { label: 'Starting ELI/mo', val: fmt(data[0].eli),                   color: 'var(--gray-600)' },
    { label: 'Latest ELI/mo',   val: fmt(data[data.length - 1].eli),     color: 'var(--gold)' },
    { label: 'Cumul. Return',   val: fmt(totalReturn),                    color: '#8b5cf6' },
  ] : [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }} className="animate-in">
      <ChartCard title="Total AUM + Cumulative Return Over Time" subtitle="How total capital has grown alongside cumulative interest generated">
        {hasData ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <Tooltip formatter={(v, n) => [fmt(v), n]} /><Legend />
              <Area type="monotone" dataKey="capital"   name="Principal AUM" stroke="var(--navy)"  fill="rgba(13,27,53,0.07)"  strokeWidth={2.5} />
              <Area type="monotone" dataKey="cumReturn" name="Cumul. Return"  stroke="var(--green)" fill="rgba(34,197,94,0.08)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No growth data" message="Charts will appear once investments are active." />
        )}
      </ChartCard>
      <ChartCard title="Monthly ELI (Earnings) Line Chart" subtitle="Monthly interest earned trending upward as AUM grows">
        {hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <Tooltip formatter={(v, n) => [fmt(v), n]} /><Legend />
              <Line type="monotone" dataKey="eli"    name="Monthly ELI"   stroke="var(--gold)" strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="roiPct" name="Blended ROI %" stroke="#8b5cf6"     strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No ELI data" message="Charts will appear once investments are active." />
        )}
      </ChartCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {summaryStats.map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: s.color, marginBottom: 4 }}>{s.val}</div>
            <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsTab({ roiByProduct, perProductGrowth, plans }) {
  const activeKeys = useMemo(() => {
    const keys = new Set();
    perProductGrowth.forEach(row => Object.keys(row).forEach(k => { if (k !== 'month') keys.add(k); }));
    return Array.from(keys);
  }, [perProductGrowth]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }} className="animate-in">
      {roiByProduct.length === 0 && <EmptyState icon={BarChart2} title="No product data yet" message="Charts will appear once investments are active." />}
      <ChartCard title="AUM per Product (₦M)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={roiByProduct} margin={{ bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="product" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}M`} />
            <Tooltip formatter={(v, n) => [`₦${v}M`, n]} />
            <Bar dataKey="aum" name="AUM (₦M)" radius={[4, 4, 0, 0]}>
              {roiByProduct.map((p, i) => <Cell key={i} fill={p.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Per-Product AUM Growth Over Time (₦M)" subtitle="How each product's AUM has grown month-on-month">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={perProductGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₦${v}M`} />
            <Tooltip formatter={(v, n) => [`₦${v}M`, n]} /><Legend />
            {activeKeys.map(key => {
              const plan = plans.find(p => p.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') === key);
              return (
                <Line key={key} type="monotone" dataKey={key} name={plan?.name || key} stroke={plan?.color || '#3b82f6'} strokeWidth={2} dot={{ r: 3 }} />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Gross ROI vs Net ROI by Product (%)" subtitle="Side-by-side comparison of advertised vs after-tax net return">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={roiByProduct} margin={{ bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="product" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v, n) => [`${v}%`, n]} /><Legend />
            <Bar dataKey="roi"    name="Gross ROI %" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="netRoi" name="Net ROI %"   fill="#22c55e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
        {roiByProduct.map(p => (
          <div key={p.product} style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
            <div style={{ height: 4, background: p.color }} />
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product}</div>
              {[['AUM', `₦${p.aum}M`], ['Gross ROI', `${p.roi}%`], ['Net ROI', `${p.netRoi}%`]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--gray-50)' }}>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{l}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EliTab({ portfolioGrowth, byType, avgRates }) {
  const hasData = portfolioGrowth.length > 0 && portfolioGrowth.some(d => d.capital > 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }} className="animate-in">
      <ChartCard title="ELI (Earnings) vs Capital — Combined Chart" subtitle="Bars = monthly ELI earned · Line = total AUM (capital deployed)">
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={portfolioGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left"  tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <Tooltip formatter={(v, n) => [fmt(v), n]} /><Legend />
              <Bar yAxisId="left" dataKey="eli" name="Monthly ELI" fill="rgba(232,184,75,0.7)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="capital" name="Total Capital" stroke="var(--navy)" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No ELI data" message="Charts will appear once investments are active." />
        )}
      </ChartCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[['corporate', 'Corporate', '#3b82f6'], ['individual', 'Individual', '#22c55e'], ['joint', 'Joint', '#8b5cf6']].map(([type, label, color]) => (
          <EliTypeCard key={type} type={type} label={label} color={color} byType={byType} avgRate={avgRates?.[type] || 0} />
        ))}
      </div>
    </div>
  );
}

function ClientGrowthTab({ data }) {
  const hasData = data.length > 0 && data.some(d => d.total > 0);
  const monthlyNew = data.map((d, i, arr) => ({
    month: d.month,
    corporate:  i === 0 ? d.corporate  : d.corporate  - arr[i - 1].corporate,
    individual: i === 0 ? d.individual : d.individual - arr[i - 1].individual,
    joint:      i === 0 ? d.joint      : d.joint      - arr[i - 1].joint,
  }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }} className="animate-in">
      <ChartCard title="Client Growth by Account Type" subtitle="Cumulative count of clients onboarded per account type">
        {hasData ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="total"      name="Total Clients" stroke="var(--navy)"  strokeWidth={3} dot={{ r: 5, fill: 'var(--gold)' }} />
              <Line type="monotone" dataKey="corporate"  name="Corporate"     stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="individual" name="Individual"    stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="joint"      name="Joint"         stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No client data" message="Client growth charts will appear once clients are onboarded." />
        )}
      </ChartCard>
      <ChartCard title="New Client Additions per Month (Bar)">
        {hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyNew}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip /><Legend />
              <Bar dataKey="corporate"  name="Corporate"  fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="individual" name="Individual" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="joint"      name="Joint"      fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No client data" message="Client growth charts will appear once clients are onboarded." />
        )}
      </ChartCard>
    </div>
  );
}

function PrtTab({ principalRateTime, roiByProduct }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }} className="animate-in">
      {principalRateTime.length === 0 && <EmptyState icon={DollarSign} title="No investment data yet" message="Data will populate once clients have active investments." />}
      <ChartCard title="Principal, Rate & Tenor Breakdown" subtitle="Per-product: principal deployed, annual ROI rate, tenor, and expected net return">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                {['Product', 'Principal', 'Rate (p.a.)', 'Tenor', 'Net Return', 'Yield %', 'Annualised'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {principalRateTime.map((row, i) => {
                const annualised = ((row.netReturn / row.principal) * (12 / row.months) * 100).toFixed(1);
                return (
                  <tr key={row.product} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--navy)' }}>{row.product}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--navy)' }}>{fmt(row.principal)}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ fontWeight: 700, color: 'var(--green)' }}>{row.rate}%</span></td>
                    <td style={{ padding: '10px 12px', color: 'var(--gray-600)' }}>{row.months} mo.</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--green)' }}>{fmt(row.netReturn)}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ background: 'rgba(232,184,75,0.12)', color: 'var(--gold)', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{((row.netReturn / row.principal) * 100).toFixed(1)}%</span></td>
                    <td style={{ padding: '10px 12px' }}><span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{annualised}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
      <ChartCard title="Net Return by Product (₦)">
        {principalRateTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={principalRateTime} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="product" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <Tooltip formatter={(v, n) => [fmt(v), n]} />
              <Bar dataKey="netReturn" name="Net Return" radius={[4, 4, 0, 0]}>
                {principalRateTime.map((_, i) => <Cell key={i} fill={['#22c55e', '#ec4899', '#3b82f6', '#6366f1', '#14b8a6', '#f97316', '#0d1b35'][i % 7]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No data" message="Charts will appear once investments are active." />
        )}
      </ChartCard>
      <ChartCard title="Rate Comparison Across Products" subtitle="Gross rate vs net annualised — spot where tax erodes the most">
        {roiByProduct.length > 0 ? (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={roiByProduct} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="product" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 35]} />
              <Tooltip formatter={(v, n) => [`${v}%`, n]} /><Legend />
              <Bar dataKey="roi"    name="Gross Rate %" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="netRoi" name="Net Rate %"   fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="tax"    name="Tax (%)"      fill="rgba(239,68,68,0.6)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No data" message="Charts will appear once investments are active." />
        )}
      </ChartCard>
    </div>
  );
}

/* ── Analytics page ───────────────────────────────── */
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'growth',   label: 'Fund Growth' },
  { key: 'products', label: 'By Product' },
  { key: 'eli',      label: 'ELI vs Capital' },
  { key: 'clients',  label: 'Client Growth' },
  { key: 'prt',      label: 'Principal / Rate / Time' },
];

export default function Analytics() {
  const { clients, clientInvestments, plans, allTransactions } = useAppStore();
  const [tab,           setTab]           = useState('overview');
  const [filterType,    setFilterType]    = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');

  const getClientType = (clientId) => {
    if (!clientId || !clients) return 'individual';
    const c = clients.find(c => c.id === clientId || c.clientId === clientId);
    return c?.type || 'individual';
  };

  const activeInvs = clientInvestments.filter(i => i.status === 'active');
  const totalAUM   = activeInvs.reduce((s, i) => s + i.amount, 0);
  const byType = {
    corporate:  activeInvs.filter(i => getClientType(i.clientId) === 'corporate').reduce((s, i) => s + i.amount, 0),
    individual: activeInvs.filter(i => getClientType(i.clientId) === 'individual').reduce((s, i) => s + i.amount, 0),
    joint:      activeInvs.filter(i => getClientType(i.clientId) === 'joint').reduce((s, i) => s + i.amount, 0),
  };

  const avgRoiByType = (type) => {
    const typeInvs = activeInvs.filter(i => getClientType(i.clientId) === type);
    if (!typeInvs.length) return 0;
    const total = typeInvs.reduce((s, i) => s + i.amount, 0);
    return total > 0 ? typeInvs.reduce((s, i) => s + (i.roi || 0) * i.amount, 0) / total : 0;
  };

  const pieData = [
    { name: 'Corporate',  value: byType.corporate,  color: '#3b82f6' },
    { name: 'Individual', value: byType.individual, color: '#22c55e' },
    { name: 'Joint',      value: byType.joint,      color: '#8b5cf6' },
  ];

  const planPie = plans.map(p => ({
    name:  p.name,
    value: activeInvs.filter(inv => inv.planId === p.id).reduce((s, inv) => s + inv.amount, 0),
    color: p.color,
  })).filter(p => p.value > 0);

  const roiByProduct = plans.map(p => {
    const aumVal = activeInvs.filter(i => i.planId === p.id).reduce((s, i) => s + i.amount, 0);
    const roi    = p.roiMin || p.roi || 0;
    const tax    = p.tax || p.wht || 10;
    return { product: p.name, roi, tax, netRoi: +(roi - roi * (tax / 100)).toFixed(2), color: p.color || '#3b82f6', aum: +(aumVal / 1e6).toFixed(1) };
  }).filter(p => p.aum > 0);

  const principalRateTime = plans.map(p => {
    const invs      = activeInvs.filter(i => i.planId === p.id);
    const principal = invs.reduce((s, i) => s + i.amount, 0);
    const rate      = p.roiMin || p.roi || 0;
    const months    = p.tenor || 12;
    const netReturn = Math.round(principal * (rate / 100) * (months / 12) * (1 - (p.tax || p.wht || 10) / 100));
    return { product: p.name, principal, rate, months, netReturn };
  }).filter(p => p.principal > 0);

  const kycPending     = clients?.filter(c => c.kyc === 'pending').length || 0;
  const liveCumReturn  = activeInvs.reduce((s, i) => s + (i.returns || i.accruedReturn || 0), 0);
  const liquidityBal   = activeInvs.filter(i => i.planId === 'liquidity').reduce((s, i) => s + i.amount, 0);

  /* ── Computed monthly chart data ───────────────── */
  const aumTrend = useMemo(() => {
    const months = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      const activeByMonth = clientInvestments.filter(inv => inv.status === 'active' && inv._valueDate && inv._valueDate <= monthEnd);
      const corporate  = activeByMonth.filter(inv => getClientType(inv.clientId) === 'corporate').reduce((s, inv) => s + inv.amount, 0) / 1e6;
      const individual = activeByMonth.filter(inv => getClientType(inv.clientId) === 'individual').reduce((s, inv) => s + inv.amount, 0) / 1e6;
      const joint      = activeByMonth.filter(inv => getClientType(inv.clientId) === 'joint').reduce((s, inv) => s + inv.amount, 0) / 1e6;
      months.push({
        month: label,
        corporate:  Math.round(corporate  * 10) / 10,
        individual: Math.round(individual * 10) / 10,
        joint:      Math.round(joint      * 10) / 10,
        total:      Math.round((corporate + individual + joint) * 10) / 10,
      });
    }
    return months;
  }, [clientInvestments, clients]);

  const clientGrowth = useMemo(() => {
    const months = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString('en-GB', { month: 'short' });
      const activeClients = (clients || []).filter(c => c.createdAt && new Date(c.createdAt) <= monthEnd);
      months.push({
        month: label,
        corporate:  activeClients.filter(c => c.type === 'corporate').length,
        individual: activeClients.filter(c => c.type === 'individual').length,
        joint:      activeClients.filter(c => c.type === 'joint').length,
        total:      activeClients.length,
      });
    }
    return months;
  }, [clients]);

  const portfolioGrowth = useMemo(() => {
    const months = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString('en-GB', { month: 'short' });
      const activeByMonth = clientInvestments.filter(inv => inv.status === 'active' && inv._valueDate && inv._valueDate <= monthEnd);
      const capital = activeByMonth.reduce((s, inv) => s + inv.amount, 0);
      const eli = activeByMonth.reduce((s, inv) => s + (inv.amount * (inv.roi || 0) / 1200), 0);
      const weightedRoi = capital > 0 ? activeByMonth.reduce((s, inv) => s + (inv.roi || 0) * inv.amount, 0) / capital : 0;
      const cumReturn = activeByMonth.reduce((s, inv) => {
        if (!inv._valueDate) return s;
        const monthsActive = Math.max(0,
          (monthEnd.getFullYear() - inv._valueDate.getFullYear()) * 12 +
          (monthEnd.getMonth() - inv._valueDate.getMonth()) + 1
        );
        const tenorMonths = Math.max(1, Math.round((inv.tenorDays || 365) / 30));
        const elapsed = Math.min(monthsActive, tenorMonths);
        return s + (inv.amount * (inv.roi || 0) / 1200) * elapsed;
      }, 0);
      months.push({
        month: label,
        capital,
        eli: Math.round(eli),
        cumReturn: Math.round(cumReturn),
        roiPct: Math.round(weightedRoi * 10) / 10,
      });
    }
    return months;
  }, [clientInvestments]);

  const perProductGrowth = useMemo(() => {
    const months = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const label = d.toLocaleDateString('en-GB', { month: 'short' });
      const row = { month: label };
      plans.forEach(p => {
        const aum = clientInvestments
          .filter(inv => inv.status === 'active' && inv.planId === p.id && inv._valueDate && inv._valueDate <= monthEnd)
          .reduce((s, inv) => s + inv.amount, 0) / 1e6;
        if (aum > 0) {
          const key = p.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
          row[key] = Math.round(aum * 10) / 10;
        }
      });
      months.push(row);
    }
    return months;
  }, [clientInvestments, plans]);

  const kpis = [
    { label: 'Total AUM',         val: fmt(totalAUM),                                                                         color: 'var(--navy)',  icon: DollarSign },
    { label: 'Active Investors',  val: activeInvs.length,                                                                     color: '#3b82f6',     icon: Users },
    { label: 'Avg. Investment',   val: fmt(activeInvs.length ? Math.round(totalAUM / activeInvs.length) : 0),                 color: '#8b5cf6',     icon: BarChart2 },
    { label: 'Total Return (YTD)',val: fmt(liveCumReturn),                                                                     color: 'var(--green)',icon: TrendingUp },
    { label: 'Liquidity Pool',    val: fmt(liquidityBal),                                                                     color: '#f97316',     icon: Activity },
    { label: 'Products Active',   val: plans.length,                                                                          color: 'var(--gold)', icon: BarChart2 },
    { label: 'Pending KYC',       val: kycPending,                                                                            color: 'var(--red)',  icon: TrendingDown },
    { label: 'Clients Total',     val: clients?.length || 0,                                                                  color: '#14b8a6',     icon: Users },
  ];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Deep portfolio intelligence · Growth trends · Per-product & per-account breakdown" />

      {/* Filter bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }} className="animate-in">
        <Filter size={13} color="var(--gray-400)" />
        {[
          { value: filterType,    set: setFilterType,    options: [{ value: 'all', label: 'All Account Types' }, { value: 'corporate', label: 'Corporate' }, { value: 'individual', label: 'Individual' }, { value: 'joint', label: 'Joint' }] },
          { value: filterProduct, set: setFilterProduct, options: [{ value: 'all', label: 'All Products' }, ...plans.map(p => ({ value: p.id, label: p.name }))] },
        ].map((f, i) => (
          <select key={i} value={f.value} onChange={e => f.set(e.target.value)} style={{ border: '1px solid var(--gray-200)', borderRadius: 7, padding: '7px 10px', fontFamily: 'DM Sans,sans-serif', fontSize: 12, outline: 'none', background: 'white', color: 'var(--navy)', cursor: 'pointer' }}>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '7px 14px' }}>
          <TrendingUp size={13} color="var(--green)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>
            Liquidity Pool: <span style={{ color: 'var(--green)' }}>{fmt(liquidityBal)}</span>
          </span>
        </div>
      </div>

      <KpiGrid kpis={kpis} className="animate-in delay-1" />

      <TabBar tabs={TABS} active={tab} onChange={setTab} variant="pill" />
      <div style={{ marginTop: 20 }}>
        {tab === 'overview'  && <OverviewTab pieData={pieData} planPie={planPie} aumTrend={aumTrend} totalAUM={totalAUM} />}
        {tab === 'growth'    && <GrowthTab data={portfolioGrowth} />}
        {tab === 'products'  && <ProductsTab roiByProduct={roiByProduct} perProductGrowth={perProductGrowth} plans={plans} />}
        {tab === 'eli'       && <EliTab portfolioGrowth={portfolioGrowth} byType={byType} avgRates={{ corporate: avgRoiByType('corporate'), individual: avgRoiByType('individual'), joint: avgRoiByType('joint') }} />}
        {tab === 'clients'   && <ClientGrowthTab data={clientGrowth} />}
        {tab === 'prt'       && <PrtTab principalRateTime={principalRateTime} roiByProduct={roiByProduct} />}
      </div>

      <style>{`@media(max-width:700px){div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}div[style*="1fr 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
