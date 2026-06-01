import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import SectionCard from '../ui/SectionCard';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

/**
 * AllocationPie — pie chart + legend card.
 * Used in AssetPortfolio, JointPortfolio, and Treasury.
 *
 * Props:
 *   data       — array of { name, value, color }
 *   totalValue — total for percentage calculation
 *   title      — card title (default 'Portfolio Allocation')
 *   compact    — smaller size (default false)
 */
export default function AllocationPie({ data = [], totalValue, title = 'Portfolio Allocation', compact = false }) {
  const total = totalValue || data.reduce((s, d) => s + d.value, 0);
  const size  = compact ? 140 : 180;
  const outer = compact ? 60 : 80;
  const inner = compact ? 38 : 50;

  return (
    <SectionCard title={title} style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <PieChart width={size} height={size}>
          <Pie data={data} cx={size / 2} cy={size / 2} innerRadius={inner} outerRadius={outer} dataKey="value" paddingAngle={3}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={v => [fmt(v)]} />
        </PieChart>
        <div style={{ flex: 1, minWidth: 0 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: d.color, flexShrink: 0 }}>{fmt(d.value)}</span>
              <span style={{ fontSize: 10, color: 'var(--gray-400)', width: 42, textAlign: 'right', flexShrink: 0 }}>
                {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
