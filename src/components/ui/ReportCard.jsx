import React from 'react';
import { Download } from 'lucide-react';

/**
 * ReportCard — a single downloadable report tile.
 * Used in Reports.jsx (root) and corporate/Reports.jsx.
 *
 * Props:
 *   icon     — Lucide icon component
 *   title    — report title
 *   desc     — report description
 *   color    — accent color
 *   onClick  — () => void
 */
export default function ReportCard({ icon: Icon, title, desc, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ border:'1px solid var(--gray-200)', borderRadius:10, padding:14, cursor:'pointer', transition:'all 0.2s', display:'flex', flexDirection:'column', gap:8 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=color; e.currentTarget.style.background=`${color}08`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.background='transparent'; }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Icon size={16} color={color} />
        <Download size={13} color="var(--gray-400)" />
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--navy)', lineHeight:1.4 }}>{title}</div>
      <div style={{ fontSize:10, color:'var(--gray-400)', lineHeight:1.4 }}>{desc}</div>
    </div>
  );
}
