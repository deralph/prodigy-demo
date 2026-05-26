import React, { useState } from 'react';
import { Shield, Upload, CheckCircle, Clock, Users, FileText, Lock, Gavel } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const HOLDER_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6'];

const HOLDER_DOCS = [
  { key:'valid_id',     label:'Valid Government ID',  required:true },
  { key:'nin',          label:'NIN Document',          required:true },
  { key:'passport',     label:'Passport Photo',        required:true },
  { key:'signature',    label:'Signature Sample',      required:true },
  { key:'utility',      label:'Utility Bill',          required:true },
];

function initDocState() {
  return Object.fromEntries(HOLDER_DOCS.map(d => [d.key, 'pending']));
}

export default function AccessControl() {
  const { user, clients, updateJointHolderKyc } = useAppStore();
  const client  = clients.find(c => c.clientId === user?.clientId);
  const holders = client?.holders || [];
  const n       = holders.length || 2;
  const mandate = client?.mandate || 'AND';

  const [activeIdx, setActiveIdx]   = useState(0);
  const [docStates, setDocStates]   = useState(() => Array.from({length:3}, initDocState));
  const [uploading, setUploading]   = useState({ idx:null, key:null });

  const getDocState  = (i) => docStates[i] || initDocState();
  const getUploaded  = (i) => HOLDER_DOCS.filter(d => getDocState(i)[d.key] === 'uploaded').length;
  const getPct       = (i) => Math.round((getUploaded(i) / HOLDER_DOCS.length) * 100);
  const allVerified  = Array.from({length:n}, (_,i) => getPct(i) === 100).every(Boolean);
  const overallPct   = Math.round(Array.from({length:n}, (_,i) => getPct(i)).reduce((s,v)=>s+v,0) / n);

  const handleUpload = (docKey) => {
    setUploading({ idx:activeIdx, key:docKey });
    setTimeout(() => {
      setDocStates(prev => {
        const next = [...prev];
        next[activeIdx] = { ...next[activeIdx], [docKey]:'uploaded' };
        return next;
      });
      setUploading({ idx:null, key:null });
      const h = holders[activeIdx];
      if (h) {
        const newPct = Math.round((HOLDER_DOCS.filter(d => {
          const updated = { ...getDocState(activeIdx), [docKey]:'uploaded' };
          return updated[d.key] === 'uploaded';
        }).length / HOLDER_DOCS.length) * 100);
        if (newPct === 100 && updateJointHolderKyc) updateJointHolderKyc(client?.clientId, h.email, true);
      }
    }, 1400);
  };

  const activeDocMap = getDocState(activeIdx);
  const activeHolder = holders[activeIdx] || { name:`Holder ${activeIdx+1}`, email:'', share: 100/n };
  const uploadedCount = getUploaded(activeIdx);

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Access Control</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>{n}-Holder KYC · Mandate · Signatory Management</p>
      </div>

      {/* KYC hero */}
      <div style={{ background:allVerified?'var(--green)':'var(--navy)',borderRadius:14,padding:'22px 26px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none' }} />
        <div style={{ display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' }}>
          <div style={{ width:48,height:48,borderRadius:12,background:'rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Shield size={22} color="white"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',marginBottom:3 }}>
              {allVerified ? `All ${n} Holders Verified` : `KYC Incomplete — ${Array.from({length:n},(_,i)=>getPct(i)===100).filter(Boolean).length}/${n} holders done`}
            </div>
            <div style={{ fontSize:12,color:'rgba(255,255,255,0.65)' }}>
              {holders.map((h,i) => `${h.name.split(' ')[0]}: ${getPct(i)}%`).join(' · ')} · Mandate: <span style={{ fontWeight:700,color:'var(--gold)' }}>{mandate}</span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Overall</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:'var(--gold)' }}>{overallPct}%</div>
          </div>
        </div>
      </div>

      {/* Mandate — LOCKED */}
      <div style={{ background:'white',borderRadius:12,border:'2px solid var(--navy)',padding:'18px 22px',marginBottom:18 }} className="animate-in delay-2">
        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12,display:'flex',alignItems:'center',gap:6 }}>
          <Lock size={13}/> Mandate Type
          <span style={{ marginLeft:'auto',fontSize:9,fontWeight:700,letterSpacing:'0.08em',color:'var(--red)',background:'rgba(239,68,68,0.08)',padding:'3px 9px',borderRadius:4,display:'flex',alignItems:'center',gap:4 }}>
            <Lock size={9}/> LOCKED AT CREATION
          </span>
        </div>
        <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
          {[
            { id:'AND', label:'AND Mandate', desc:`All ${n} holders must co-authorise every transaction and liquidation.` },
            { id:'OR',  label:'OR Mandate',  desc:'Any single holder may authorise transactions independently.' },
          ].map(m=>(
            <div key={m.id} style={{ flex:'1 1 160px',padding:'14px',borderRadius:10,border:`2px solid ${mandate===m.id?'var(--navy)':'var(--gray-200)'}`,background:mandate===m.id?'var(--navy)':'var(--gray-50)',opacity:mandate===m.id?1:0.45 }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                <div style={{ width:14,height:14,borderRadius:'50%',background:mandate===m.id?'var(--gold)':'var(--gray-300)',flexShrink:0 }}/>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:mandate===m.id?'var(--gold)':'var(--navy)' }}>{m.label}</div>
              </div>
              <div style={{ fontSize:11,color:mandate===m.id?'rgba(255,255,255,0.65)':'var(--gray-400)' }}>{m.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12,fontSize:11,color:'var(--gray-400)',fontStyle:'italic' }}>
          Mandate was set at account creation and cannot be changed. Contact compliance to amend.
        </div>
      </div>

      {/* Liquidation authority per holder */}
      <div style={{ background:'rgba(13,27,53,0.03)',border:'1px solid var(--gray-200)',borderRadius:12,padding:'18px 22px',marginBottom:18 }} className="animate-in delay-2">
        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:14,display:'flex',alignItems:'center',gap:6 }}>
          <Gavel size={13}/> Liquidation & Withdrawal Authority
        </div>
        <div style={{ display:'grid',gridTemplateColumns:`repeat(${Math.min(n,3)}, 1fr)`,gap:10,marginBottom:14 }}>
          {holders.map((h,i) => {
            const pct = getPct(i);
            return (
              <div key={i} style={{ padding:'12px 14px',background:'white',borderRadius:10,border:`1px solid ${HOLDER_COLORS[i]}25` }}>
                <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:3 }}>{i===0?'Primary':i===1?'Secondary':'Third'} Holder</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.name}</div>
                <div style={{ height:5,background:'var(--gray-100)',borderRadius:3,overflow:'hidden',marginBottom:4 }}>
                  <div style={{ height:'100%',width:`${pct}%`,background:pct===100?'var(--green)':HOLDER_COLORS[i],borderRadius:3,transition:'width 0.4s' }}/>
                </div>
                <div style={{ fontSize:10,color:pct===100?'var(--green)':'var(--gold)',fontWeight:700 }}>KYC {pct}% {pct===100?'✓ Authorised':'— Locked'}</div>
                <div style={{ fontSize:9,color:'var(--gray-400)',marginTop:2 }}>{(100/n).toFixed(2)}% equal share</div>
              </div>
            );
          })}
        </div>
        <div style={{ padding:'10px 14px',borderRadius:8,background:mandate==='AND'?'rgba(239,68,68,0.06)':'rgba(34,197,94,0.06)',border:`1px solid ${mandate==='AND'?'rgba(239,68,68,0.2)':'rgba(34,197,94,0.2)'}`,fontSize:12,color:'var(--navy)' }}>
          {mandate==='AND'
            ? <><strong>AND Mandate:</strong> All {n} signatories must co-authorise liquidation and withdrawals.</>
            : <><strong>OR Mandate:</strong> Any single signatory may independently authorise transactions.</>
          }
        </div>
      </div>

      {/* Holder tabs */}
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }} className="animate-in delay-2">
        {holders.map((h,i) => (
          <button key={i} onClick={()=>setActiveIdx(i)} style={{ flex:1,minWidth:120,display:'flex',alignItems:'center',gap:8,padding:'11px 14px',borderRadius:10,border:`2px solid ${activeIdx===i?HOLDER_COLORS[i]:'var(--gray-200)'}`,cursor:'pointer',background:activeIdx===i?HOLDER_COLORS[i]:'white',transition:'all 0.2s',textAlign:'left' }}>
            <div style={{ width:30,height:30,borderRadius:'50%',background:activeIdx===i?'rgba(255,255,255,0.2)':'var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:activeIdx===i?'white':HOLDER_COLORS[i],flexShrink:0 }}>{h.name.charAt(0)}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:11,fontWeight:700,color:activeIdx===i?'white':'var(--navy)',fontFamily:'Syne,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.name.split(' ')[0]}</div>
              <div style={{ fontSize:9,color:activeIdx===i?'rgba(255,255,255,0.6)':'var(--gray-400)' }}>KYC {getPct(i)}%</div>
            </div>
          </button>
        ))}
      </div>

      {/* Documents for active holder */}
      <div style={{ background:'white',borderRadius:14,border:`1px solid ${HOLDER_COLORS[activeIdx]}30`,overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between',background:`${HOLDER_COLORS[activeIdx]}08` }}>
          <div>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:1 }}>
              {activeHolder.name} — KYC Documents
            </h3>
            <div style={{ fontSize:10,color:'var(--gray-400)' }}>{activeHolder.email} · {(100/n).toFixed(2)}% equal share</div>
          </div>
          <span style={{ fontSize:11,fontWeight:700,color:HOLDER_COLORS[activeIdx] }}>{uploadedCount}/{HOLDER_DOCS.length} uploaded</span>
        </div>
        {HOLDER_DOCS.map((doc, i) => {
          const status = activeDocMap[doc.key] || 'pending';
          const isUploaded = status === 'uploaded';
          const isUpl = uploading.idx === activeIdx && uploading.key === doc.key;
          return (
            <div key={doc.key} style={{ padding:'13px 20px',borderBottom:i<HOLDER_DOCS.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <div style={{ width:36,height:36,borderRadius:9,background:isUploaded?'rgba(34,197,94,0.1)':'rgba(232,184,75,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                {isUpl
                  ? <div style={{ width:14,height:14,borderRadius:'50%',border:'2px solid var(--gold)',borderTopColor:'transparent',animation:'spin 0.8s linear infinite' }}/>
                  : isUploaded ? <CheckCircle size={16} color="var(--green)"/> : <Clock size={16} color="var(--gold)"/>
                }
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)',marginBottom:1 }}>{doc.label}</div>
                <div style={{ fontSize:10,color:'var(--gray-400)' }}>Required · {activeIdx===0?'Primary':activeIdx===1?'Secondary':'Third'} Holder KYC</div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:isUploaded?'var(--green)':'var(--gold)',background:isUploaded?'rgba(34,197,94,0.1)':'rgba(232,184,75,0.12)',padding:'3px 8px',borderRadius:4 }}>
                  {isUploaded?'Uploaded':'Pending'}
                </span>
                {!isUploaded && (
                  <button onClick={() => handleUpload(doc.key)} disabled={isUpl}
                    style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 11px',background:HOLDER_COLORS[activeIdx],color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,opacity:isUpl?0.6:1 }}>
                    <Upload size={11}/> {isUpl?'Uploading…':'Upload'}
                  </button>
                )}
                {isUploaded && (
                  <span style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 11px',background:'rgba(34,197,94,0.08)',color:'var(--green)',borderRadius:7,fontSize:11,fontWeight:700 }}>
                    <FileText size={11}/> Done
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Policy note */}
      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'14px 18px',marginTop:18,fontSize:12,color:'var(--navy)',lineHeight:1.7 }} className="animate-in delay-3">
        <div style={{ fontWeight:700,marginBottom:6,display:'flex',alignItems:'center',gap:6 }}><Users size={13}/> Joint Account Policy</div>
        <ul style={{ margin:0,paddingLeft:18 }}>
          <li>All {n} holders share the account equally — <strong>{(100/n).toFixed(2)}% each</strong>.</li>
          <li>Mandate type (<strong>{mandate}</strong>) is permanently set at account creation and governs all liquidation and withdrawal decisions.</li>
          <li>Under <strong>AND mandate</strong>: all {n} signatories must approve liquidation and withdrawals.</li>
          <li>Under <strong>OR mandate</strong>: any single signatory can independently authorise transactions.</li>
          <li>Full KYC verification is required from all signatories before any liquidation is processed.</li>
          <li>Investment booking may proceed regardless of KYC status; liquidation is KYC-gated.</li>
        </ul>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:600px){div[style*="repeat"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
