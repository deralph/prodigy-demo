import React from 'react';

/**
 * AccountInfoCard — icon + label + value list card.
 * Used in ProfilePage contact info and portfolio summary panels.
 *
 * Props:
 *   title   — card section heading
 *   icon    — Lucide icon component
 *   rows    — array of { icon, label, val }
 */
export default function AccountInfoCard({ title, icon: TitleIcon, rows = [] }) {
  return (
    <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
      <div style={{ padding:'13px 20px',borderBottom:'1px solid var(--gray-100)',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--navy)',display:'flex',alignItems:'center',gap:7 }}>
        {TitleIcon && <TitleIcon size={13} />} {title}
      </div>
      {rows.map(({ icon: Icon, label, val }) => (
        <div key={label} style={{ display:'flex',alignItems:'center',gap:12,padding:'13px 20px',borderBottom:'1px solid var(--gray-50)' }}>
          {Icon && (
            <div style={{ width:32,height:32,borderRadius:8,background:'rgba(13,27,53,0.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Icon size={14} color="var(--navy)" />
            </div>
          )}
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:1 }}>{label}</div>
            <div style={{ fontSize:13,fontWeight:600,color:'var(--navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{val || '—'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
