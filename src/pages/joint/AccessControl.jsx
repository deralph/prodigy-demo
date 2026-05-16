import React, { useState } from 'react';
import { Shield, Upload, CheckCircle, Clock, AlertTriangle, Users, X, FileText, Lock } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { KYC_REQUIREMENTS } from '../../store/useAppStore';

const DOC_STATUS = {
  uploaded: { color:'var(--green)', bg:'rgba(34,197,94,0.1)',  icon:CheckCircle,   label:'Uploaded' },
  pending:  { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)',icon:Clock,         label:'Pending' },
  rejected: { color:'var(--red)',   bg:'rgba(239,68,68,0.1)', icon:AlertTriangle, label:'Rejected' },
};

const MANDATE_TYPES = [
  { id:'AND', label:'AND Mandate', desc:'Both holders must authorise all transactions' },
  { id:'OR',  label:'OR Mandate',  desc:'Either holder may authorise transactions independently' },
];

export default function AccessControl() {
  const { user, clients } = useAppStore();
  const client  = clients.find(c => c.clientId === user?.clientId);
  const docs    = KYC_REQUIREMENTS?.individual || [];

  const [primaryDocs,   setPrimaryDocs]   = useState(() => Object.fromEntries(docs.map((d,i)=>[d.key, i<3?'uploaded':'pending'])));
  const [secondaryDocs, setSecondaryDocs] = useState(() => Object.fromEntries(docs.map((d,i)=>[d.key, i<2?'uploaded':'pending'])));
  const [uploading,     setUploading]     = useState({ holder:null, key:null });
  const [mandate,       setMandate]       = useState('AND');
  const [activeHolder,  setActiveHolder]  = useState('primary');

  const docMap   = activeHolder==='primary' ? primaryDocs : secondaryDocs;
  const setDocMap= activeHolder==='primary' ? setPrimaryDocs : setSecondaryDocs;
  const uploaded = docs.filter(d=>docMap[d.key]==='uploaded').length;

  const handleUpload = (key) => {
    setUploading({ holder:activeHolder, key });
    setTimeout(() => {
      setDocMap(s=>({...s,[key]:'uploaded'}));
      setUploading({ holder:null, key:null });
    }, 1500);
  };

  const primaryPct  = docs.length ? Math.round((docs.filter(d=>primaryDocs[d.key]==='uploaded').length/docs.length)*100)   : 0;
  const secondaryPct= docs.length ? Math.round((docs.filter(d=>secondaryDocs[d.key]==='uploaded').length/docs.length)*100) : 0;
  const kycOk       = primaryPct===100 && secondaryPct===100;

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Access Control</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Dual-Holder KYC · Mandate · Signatory Management</p>
      </div>

      {/* KYC hero */}
      <div style={{ background:kycOk?'var(--green)':'var(--navy)',borderRadius:14,padding:'22px 26px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none' }} />
        <div style={{ display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' }}>
          <div style={{ width:48,height:48,borderRadius:12,background:'rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Shield size={22} color="white"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',marginBottom:3 }}>{kycOk?'Both Holders Verified':'KYC Incomplete for Joint Account'}</div>
            <div style={{ fontSize:12,color:'rgba(255,255,255,0.65)' }}>Primary: {primaryPct}% · Secondary: {secondaryPct}% · Mandate: <span style={{ fontWeight:700,color:'var(--gold)' }}>{mandate}</span></div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Overall</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:'var(--gold)' }}>{Math.round((primaryPct+secondaryPct)/2)}%</div>
          </div>
        </div>
      </div>

      {/* Mandate */}
      <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'18px 22px',marginBottom:18 }} className="animate-in delay-2">
        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12,display:'flex',alignItems:'center',gap:6 }}>
          <Lock size={13}/> Mandate Type
        </div>
        <div style={{ display:'flex',gap:12 }}>
          {MANDATE_TYPES.map(m=>(
            <div key={m.id} onClick={()=>setMandate(m.id)} style={{ flex:1,padding:'14px',borderRadius:10,border:`2px solid ${mandate===m.id?'var(--navy)':'var(--gray-200)'}`,cursor:'pointer',background:mandate===m.id?'var(--navy)':'white',transition:'all 0.2s' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:mandate===m.id?'var(--gold)':'var(--navy)',marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:11,color:mandate===m.id?'rgba(255,255,255,0.6)':'var(--gray-400)' }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Holder tabs */}
      <div style={{ display:'flex',gap:8,marginBottom:16 }} className="animate-in delay-2">
        {[['primary',user?.name||'Primary Holder',primaryPct],['secondary',client?.secondaryName||'Secondary Holder',secondaryPct]].map(([id,name,pct])=>(
          <button key={id} onClick={()=>setActiveHolder(id)} style={{ flex:1,display:'flex',alignItems:'center',gap:8,padding:'12px 16px',borderRadius:10,border:`2px solid ${activeHolder===id?'var(--navy)':'var(--gray-200)'}`,cursor:'pointer',background:activeHolder===id?'var(--navy)':'white',transition:'all 0.2s',textAlign:'left' }}>
            <div style={{ width:32,height:32,borderRadius:'50%',background:activeHolder===id?'var(--gold)':'var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:activeHolder===id?'var(--navy)':'var(--gray-400)',flexShrink:0 }}>{(name||'H').charAt(0)}</div>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:activeHolder===id?'white':'var(--navy)',fontFamily:'Syne,sans-serif' }}>{name}</div>
              <div style={{ fontSize:10,color:activeHolder===id?'rgba(255,255,255,0.5)':'var(--gray-400)' }}>{id==='primary'?'Primary':'Secondary'} · KYC {pct}%</div>
            </div>
          </button>
        ))}
      </div>

      {/* Documents for active holder */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ padding:'16px 22px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>
            {activeHolder==='primary'?(user?.name||'Primary'):(client?.secondaryName||'Secondary')} — KYC Documents
          </h3>
          <span style={{ fontSize:11,fontWeight:700,color:'var(--navy)' }}>{uploaded}/{docs.length} uploaded</span>
        </div>
        {docs.map((doc,i)=>{
          const status = docMap[doc.key];
          const st     = DOC_STATUS[status];
          const Icon   = st.icon;
          const isUpl  = uploading.holder===activeHolder && uploading.key===doc.key;
          return (
            <div key={doc.key} style={{ padding:'14px 22px',borderBottom:i<docs.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <div style={{ width:38,height:38,borderRadius:10,background:st.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                {isUpl?<div style={{ width:16,height:16,borderRadius:'50%',border:'2px solid var(--gold)',borderTopColor:'transparent',animation:'spin 0.8s linear infinite' }}/>:<Icon size={16} color={st.color}/>}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--navy)',marginBottom:2 }}>{doc.label}</div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>{doc.required?'Required':'Optional'} · {activeHolder==='primary'?'Primary':'Secondary'} Holder KYC</div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.bg,padding:'3px 9px',borderRadius:4 }}>{st.label}</span>
                {status!=='uploaded' && (
                  <button onClick={()=>handleUpload(doc.key)} disabled={isUpl} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                    <Upload size={11}/> {isUpl?'Uploading…':'Upload'}
                  </button>
                )}
                {status==='uploaded' && (
                  <span style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(34,197,94,0.08)',color:'var(--green)',borderRadius:7,fontSize:11,fontWeight:700 }}>
                    <FileText size={11}/> Verified
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'14px 18px',marginTop:18,fontSize:12,color:'var(--navy)',lineHeight:1.6 }} className="animate-in delay-3">
        <strong>Joint Account Policy:</strong> Under an <strong>AND mandate</strong>, both signatories must authenticate every withdrawal and investment instruction.
        Documents for both holders are required for full account activation.
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
