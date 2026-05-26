import React, { useState } from 'react';
import { Shield, Upload, CheckCircle, Clock, AlertTriangle, X, FileText } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { KYC_REQUIREMENTS } from '../../store/useAppStore';

const DOC_STATUS = {
  uploaded:  { color:'var(--green)', bg:'rgba(34,197,94,0.1)',  icon:CheckCircle, label:'Uploaded' },
  pending:   { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)',icon:Clock,       label:'Pending' },
  rejected:  { color:'var(--red)',   bg:'rgba(239,68,68,0.1)',  icon:AlertTriangle,label:'Rejected' },
};

export default function SecurityVault() {
  const { user, clients } = useAppStore();
  const client = clients.find(c => c.clientId === user?.clientId);
  const docs    = KYC_REQUIREMENTS.individual;

  const [docStates, setDocStates] = useState(() =>
    Object.fromEntries(docs.map(d => [d.key, 'pending']))
  );
  const [uploading, setUploading] = useState(null);
  const [viewDoc, setViewDoc]     = useState(null);

  const uploaded = docs.filter(d => docStates[d.key] === 'uploaded').length;
  const kycComplete = uploaded === docs.length;

  const handleUpload = (key) => {
    setUploading(key);
    setTimeout(() => {
      setDocStates(s => ({ ...s, [key]:'uploaded' }));
      setUploading(null);
    }, 1500);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Security Vault</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>KYC Document Management · Individual Account</p>
      </div>

      {/* KYC status hero */}
      <div style={{ background: kycComplete?'var(--green)':'var(--navy)',borderRadius:14,padding:'22px 26px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none' }} />
        <div style={{ display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' }}>
          <div style={{ width:48,height:48,borderRadius:12,background:'rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Shield size={22} color="white"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',marginBottom:3 }}>
              {kycComplete ? 'KYC Verification Complete' : 'KYC Documents Pending'}
            </div>
            <div style={{ fontSize:12,color:'rgba(255,255,255,0.65)' }}>
              {uploaded}/{docs.length} documents uploaded · Status: <span style={{ fontWeight:700,color:'white' }}>{client?.kyc||'pending'}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize:9,color:'rgba(255,255,255,0.5)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Completion</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:'var(--gold)' }}>{Math.round((uploaded/docs.length)*100)}%</div>
          </div>
        </div>
        <div style={{ marginTop:14,height:6,background:'rgba(255,255,255,0.15)',borderRadius:3,overflow:'hidden' }}>
          <div style={{ height:'100%',width:`${(uploaded/docs.length)*100}%`,background:'var(--gold)',borderRadius:3,transition:'width 0.5s ease' }}/>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22 }} className="animate-in delay-2">
        {[
          { label:'Uploaded',  val:uploaded,                              color:'var(--green)' },
          { label:'Pending',   val:docs.filter(d=>docStates[d.key]==='pending').length,   color:'var(--gold)' },
          { label:'Required',  val:docs.length,                           color:'var(--navy)' },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:24,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Documents */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ padding:'16px 22px',borderBottom:'1px solid var(--gray-100)' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Required Documents — Individual KYC</h3>
        </div>
        {docs.map((doc, i) => {
          const status = docStates[doc.key];
          const st     = DOC_STATUS[status];
          const Icon   = st.icon;
          const isUpl  = uploading === doc.key;
          return (
            <div key={doc.key} style={{ padding:'16px 22px',borderBottom:i<docs.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <div style={{ width:38,height:38,borderRadius:10,background:st.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                {isUpl ? (
                  <div style={{ width:16,height:16,borderRadius:'50%',border:'2px solid var(--gold)',borderTopColor:'transparent',animation:'spin 0.8s linear infinite' }}/>
                ) : <Icon size={16} color={st.color}/>}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--navy)',marginBottom:2 }}>{doc.label}</div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>{doc.required?'Required':'Optional'} · Individual KYC</div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.bg,padding:'3px 9px',borderRadius:4 }}>{st.label}</span>
                {status !== 'uploaded' && (
                  <button onClick={()=>handleUpload(doc.key)} disabled={isUpl} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                    <Upload size={11}/> {isUpl?'Uploading…':'Upload'}
                  </button>
                )}
                {status === 'uploaded' && (
                  <button onClick={()=>setViewDoc(doc)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(13,27,53,0.06)',color:'var(--navy)',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                    <FileText size={11}/> View
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice */}
      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'14px 18px',marginTop:18,fontSize:12,color:'var(--navy)',lineHeight:1.6 }} className="animate-in delay-3">
        <strong>Note:</strong> Uploaded documents are reviewed by our compliance team within 1–2 business days.
        All documents are encrypted and stored securely in compliance with NDPR and SEC regulations.
      </div>

      {/* View doc modal */}
      {viewDoc && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setViewDoc(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:420,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--green)',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'white',textTransform:'uppercase' }}>{viewDoc.label}</div>
              <button onClick={()=>setViewDoc(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.6)' }}><X size={16}/></button>
            </div>
            <div style={{ padding:'22px',textAlign:'center' }}>
              <div style={{ width:80,height:80,borderRadius:16,background:'rgba(34,197,94,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                <CheckCircle size={36} color="var(--green)"/>
              </div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'var(--navy)',marginBottom:6 }}>Document Verified</div>
              <div style={{ fontSize:12,color:'var(--gray-400)',marginBottom:16 }}>This document has been successfully uploaded and is under compliance review</div>
              {[['Document',viewDoc.label],['Status','Uploaded'],['Submitted',new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})],['Reviewed by','Compliance Team']].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)' }}>{l}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
