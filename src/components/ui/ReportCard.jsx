import React from 'react';
import { Download, Eye, FileType } from 'lucide-react';

/**
 * ReportCard — a single downloadable report tile.
 * Used in Reports.jsx (root) and corporate/Reports.jsx.
 *
 * Props:
 *   icon          — Lucide icon component
 *   title         — report title
 *   desc          — report description
 *   color         — accent color
 *   onPreview     — () => void (preview report)
 *   onPdfDownload — () => void (download PDF)
 *   loading       — boolean
 *   key           — report key for API
 */
export default function ReportCard({ icon: Icon, title, desc, color, onPreview, onPdfDownload, loading, key }) {
  return (
    <div
      style={{ border:'1px solid var(--gray-200)', borderRadius:10, padding:14, cursor:'pointer', transition:'all 0.2s', display:'flex', flexDirection:'column', gap:8 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=color; e.currentTarget.style.background=`${color}08`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.background='transparent'; }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Icon size={16} color={color} />
        <div style={{ display:'flex',gap:6 }}>
          <button onClick={onPreview} disabled={loading} style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 10px',background:`${color}12`,color:color,border:`1px solid ${color}30`,borderRadius:6,cursor:'pointer',fontSize:10,fontWeight:700,opacity: loading ? 0.7 : 1 }}>
            <Eye size={11}/> Preview
          </button>
          <button onClick={onPdfDownload} disabled={loading} style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 10px',background:`${color}12`,color:color,border:`1px solid ${color}30`,borderRadius:6,cursor:'pointer',fontSize:10,fontWeight:700,opacity: loading ? 0.7 : 1 }}>
            <FileType size={11}/> PDF
          </button>
        </div>
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--navy)', lineHeight:1.4 }}>{title}</div>
      <div style={{ fontSize:10, color:'var(--gray-400)', lineHeight:1.4 }}>{desc}</div>
    </div>
  );
}
