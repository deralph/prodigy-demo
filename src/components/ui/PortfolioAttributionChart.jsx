import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Download } from 'lucide-react';
import EmptyState from '../EmptyState';
import { FileBarChart } from 'lucide-react';

/**
 * PortfolioAttributionChart — pie + legend showing investment allocation.
 * Used in Reports.jsx (root) and corporate/Reports.jsx.
 *
 * Props:
 *   data — array of { name, value, color }
 */
export default function PortfolioAttributionChart({ data = [] }) {
  return (
    <div className="card animate-in delay-1">
      <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:20, display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:14 }}>⏱</span> Product Performance Attribution
      </h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'center' }}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={data[i].color} />)}
            </Pie>
            <Tooltip formatter={v => `₦${v.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {data.length === 0 && <EmptyState icon={FileBarChart} title="No investment data" message="Your portfolio allocation will appear here once investments are booked." compact />}
          {data.map(p => (
            <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--navy)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize:11, color:'var(--gray-400)' }}>₦{p.value.toLocaleString()}</div>
              </div>
              <Download size={12} color="var(--gray-400)" style={{ cursor:'pointer', flexShrink:0 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
