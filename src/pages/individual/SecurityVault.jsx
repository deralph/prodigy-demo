import React, { useState, useEffect, useRef } from 'react';
import { Shield, Upload, CheckCircle, Clock, AlertTriangle, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { KYC_REQUIREMENTS } from '../../store/useAppStore';
import { kycApi } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import AlertBanner from '../../components/ui/AlertBanner';
import ProgressBar from '../../components/ui/ProgressBar';

const STATUS_CFG = {
  NOT_UPLOADED: { color:'var(--gold)',  bg:'rgba(232,184,75,0.12)', Icon:Clock,         label:'Pending' },
  UPLOADED:     { color:'#3b82f6',      bg:'rgba(59,130,246,0.1)',  Icon:FileText,      label:'Under Review' },
  VERIFIED:     { color:'var(--green)', bg:'rgba(34,197,94,0.1)',   Icon:CheckCircle,   label:'Verified' },
  REJECTED:     { color:'var(--red)',   bg:'rgba(239,68,68,0.1)',   Icon:AlertTriangle, label:'Rejected' },
};

/* ── KYC hero banner ── */
function KycHeroBanner({ uploaded, total, kycComplete }) {
  const pct = total ? Math.round((uploaded / total) * 100) : 0;
  return (
    <div style={{ background:kycComplete?'var(--green)':'var(--navy)', borderRadius:14, padding:'22px 26px', marginBottom:22, position:'relative', overflow:'hidden' }} className="animate-in delay-1">
      <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Shield size={22} color="white"/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16, color:'white', marginBottom:3 }}>
            {kycComplete ? 'All Documents Submitted — Pending Review' : 'KYC Documents Required'}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)' }}>
            {uploaded}/{total} documents submitted · Select each document below to upload
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Completion</div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--gold)' }}>{pct}%</div>
        </div>
      </div>
      <ProgressBar pct={pct} color="var(--gold)" height={6} style={{ marginTop:14 }} />
    </div>
  );
}

/* ── Single doc row ── */
function DocRow({ doc, status, isUploading, info, onUpload, fileRef, isLast }) {
  const cfg    = STATUS_CFG[status] || STATUS_CFG.NOT_UPLOADED;
  const { Icon } = cfg;
  const canView  = info?.fileUrl && !info.fileUrl.startsWith('pending-cloud-upload://');

  return (
    <div
      style={{ padding:'16px 22px', borderBottom:isLast?'none':'1px solid var(--gray-100)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', transition:'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      <div style={{ width:38, height:38, borderRadius:10, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {isUploading
          ? <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid var(--gold)', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
          : <Icon size={16} color={cfg.color}/>
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--navy)', marginBottom:2 }}>{doc.label}</div>
        <div style={{ fontSize:11, color:'var(--gray-400)' }}>
          {doc.required?'Required':'Optional'} · PDF, JPG, PNG accepted
          {info?.fileName && <span style={{ color:'var(--navy)', fontWeight:600 }}> · {info.fileName}</span>}
        </div>
        {status === 'REJECTED' && info?.rejectionReason && (
          <div style={{ fontSize:11, color:'var(--red)', fontWeight:600, marginTop:3 }}>Rejected: {info.rejectionReason}</div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:cfg.color, background:cfg.bg, padding:'3px 9px', borderRadius:4 }}>{cfg.label}</span>
        {status !== 'VERIFIED' && (
          <label style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background:status==='UPLOADED'?'rgba(59,130,246,0.1)':status==='REJECTED'?'rgba(239,68,68,0.1)':'var(--navy)', color:status==='UPLOADED'?'#3b82f6':status==='REJECTED'?'var(--red)':'white', borderRadius:7, cursor:isUploading?'not-allowed':'pointer', fontSize:11, fontWeight:700 }}>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} disabled={isUploading} onChange={e => onUpload(doc.key, e.target.files?.[0] || null)}/>
            <Upload size={11}/> {isUploading?'Uploading…':status==='UPLOADED'?'Replace':status==='REJECTED'?'Re-upload':'Upload'}
          </label>
        )}
        {canView && (
          <a href={info.fileUrl} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background:'rgba(13,27,53,0.06)', color:'var(--navy)', borderRadius:7, fontSize:11, fontWeight:700, textDecoration:'none' }}>
            <ExternalLink size={11}/> View
          </a>
        )}
      </div>
    </div>
  );
}

export default function SecurityVault() {
  const { user } = useAppStore();
  const clientType = user?.clientType?.toLowerCase() || 'individual';
  const docs       = KYC_REQUIREMENTS[clientType] || KYC_REQUIREMENTS.individual;

  const [docData,   setDocData]   = useState({});
  const [uploading, setUploading] = useState(null);
  const [toast,     setToast]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const fileRefs = useRef({});

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const loadKyc = () => {
    setLoading(true);
    kycApi.getMyKyc()
      .then(data => {
        const map = {};
        (data?.documents || []).forEach(d => { map[d.key] = d; });
        setDocData(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadKyc(); }, []);

  const getStatus = key => docData[key]?.status || 'NOT_UPLOADED';

  const handleFileChange = async (key, file) => {
    if (!file) return;
    setUploading(key);
    try {
      const result = await kycApi.uploadDocument(key, file);
      setDocData(prev => ({ ...prev, [key]: { ...prev[key], status:'UPLOADED', fileName:file.name, fileUrl:result?.fileUrl || null } }));
      showToast('success', `${file.name} uploaded successfully. Pending compliance review.`);
    } catch (e) {
      showToast('error', e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
      if (fileRefs.current[key]) fileRefs.current[key].value = '';
    }
  };

  const uploaded    = docs.filter(d => ['UPLOADED','VERIFIED'].includes(getStatus(d.key))).length;
  const kycComplete = uploaded === docs.length;

  const kpiStats = [
    { label:'Submitted', val:uploaded,                                                                 color:'var(--green)' },
    { label:'Pending',   val:docs.filter(d => getStatus(d.key) === 'NOT_UPLOADED').length,            color:'var(--gold)' },
    { label:'Required',  val:docs.filter(d => d.required).length,                                     color:'var(--navy)' },
  ];

  return (
    <div>
      <PageHeader
        title="Security Vault"
        subtitle="KYC Document Management"
        action={{ label:'Refresh', icon:RefreshCw, onClick:loadKyc }}
      />

      {toast && <AlertBanner message={toast.msg} type={toast.type} style={{ marginBottom:16 }} />}

      <KycHeroBanner uploaded={uploaded} total={docs.length} kycComplete={kycComplete} />

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }} className="animate-in delay-2">
        {kpiStats.map(s => (
          <div key={s.label} style={{ background:'white', borderRadius:10, padding:'14px 16px', border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:24, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Documents list */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid var(--gray-200)', overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--gray-100)' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color:'var(--navy)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Required KYC Documents</h3>
        </div>
        {loading
          ? <div style={{ padding:32, textAlign:'center', color:'var(--gray-400)', fontSize:13 }}>Loading documents…</div>
          : docs.map((doc, i) => (
            <DocRow
              key={doc.key}
              doc={doc}
              status={getStatus(doc.key)}
              isUploading={uploading === doc.key}
              info={docData[doc.key]}
              onUpload={handleFileChange}
              fileRef={el => fileRefs.current[doc.key] = el}
              isLast={i === docs.length - 1}
            />
          ))
        }
      </div>

      <div style={{ background:'rgba(232,184,75,0.08)', border:'1px solid rgba(232,184,75,0.25)', borderRadius:10, padding:'14px 18px', marginTop:18, fontSize:12, color:'var(--navy)', lineHeight:1.6 }} className="animate-in delay-3">
        <strong>Note:</strong> Uploaded documents are reviewed by our compliance team within 1–2 business days. All documents are encrypted and stored securely in compliance with NDPR and SEC regulations.
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
