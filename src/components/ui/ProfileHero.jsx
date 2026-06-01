import React from 'react';
import { User, Building2, Shield, Copy, Check } from 'lucide-react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

/**
 * ProfileHero — dark navy identity card shown at top of profile page.
 *
 * Props:
 *   user         — user object
 *   totalAUM     — number
 *   activeCount  — number
 *   roleBadge    — { label, color, bg }
 *   copied       — bool
 *   onCopy       — () => void
 */
export default function ProfileHero({ user, totalAUM, activeCount, roleBadge, copied, onCopy }) {
  const isCorporate = user?.role === 'corporate';
  const isJoint     = user?.role === 'joint';

  return (
    <div style={{ background:'var(--navy)',borderRadius:16,padding:'28px 30px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
      <div style={{ position:'absolute',top:-50,right:-50,width:200,height:200,borderRadius:'50%',background:'rgba(232,184,75,0.06)',pointerEvents:'none' }}/>
      <div style={{ display:'flex',alignItems:'center',gap:20,flexWrap:'wrap' }}>
        <div style={{ width:68,height:68,borderRadius:'50%',background:'rgba(232,184,75,0.18)',border:'2px solid rgba(232,184,75,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          {isCorporate ? <Building2 size={28} color="var(--gold)"/> : isJoint ? <Shield size={28} color="var(--gold)"/> : <User size={28} color="var(--gold)"/>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4 }}>
            <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(16px,2.5vw,22px)',color:'white',margin:0 }}>{user?.name || 'Account Holder'}</h2>
            <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:roleBadge.color,background:roleBadge.bg,padding:'3px 10px',borderRadius:5 }}>{roleBadge.label}</span>
          </div>
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.55)' }}>{user?.email}</div>
          {(user?.clientId || user?.id) && (
            <button onClick={onCopy} style={{ marginTop:8,display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:7,padding:'5px 12px',cursor:'pointer',color:'rgba(255,255,255,0.7)',fontSize:11 }}>
              {copied ? <Check size={11} color="var(--green)"/> : <Copy size={11}/>}
              <span style={{ fontFamily:'DM Mono,monospace' }}>{user?.clientId || user?.id}</span>
            </button>
          )}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,textAlign:'right' }}>
          {[['Total AUM',fmt(totalAUM)],['Active Products',activeCount]].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase' }}>{l}</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,color:'var(--gold)',marginTop:2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
