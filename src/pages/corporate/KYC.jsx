import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, PenLine, FileText, X, ExternalLink, RefreshCw } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { kycApi } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/EmptyState';
import AlertBanner from '../../components/ui/AlertBanner';
import KycStatusPanel from '../../components/ui/KycStatusPanel';
import SignatoryRegistry from '../../components/ui/SignatoryRegistry';
import ModalOverlay from '../../components/ui/ModalOverlay';

const KYC_DOCS = [
  { key:'cacCert',     label:'CAC Certificate' },
  { key:'taxId',       label:'Tax ID / TIN' },
  { key:'scuml',       label:'SCUML' },
  { key:'utilityBill', label:'Utility Bill' },
  { key:'memart',      label:'MEMART' },
  { key:'sigMandate',  label:'Sig. Mandate' },
];

const ADDITIONAL_DOCS = [
  { key:'utility_bill', label:'Utility Bill',        hint:'Not older than 3 months · PDF/JPG/PNG' },
  { key:'directors_id', label:"Directors' Valid ID",  hint:'Government-issued ID for all directors' },
  { key:'cac_cert',     label:'CAC Certificate',      hint:'Certificate of Incorporation · PDF' },
  { key:'tax_id',       label:'Tax ID / TIN',         hint:'Federal Inland Revenue Service · PDF' },
  { key:'scuml',        label:'SCUML Certificate',    hint:'Special Control Unit against ML · PDF' },
  { key:'memart',       label:'MEMART',                hint:'Memorandum & Articles of Association · PDF' },
];

/* ── Signature upload block ── */
function SignatureBlock({ sigFile, onFileChange, onDrawOpen }) {
  return (
    <div className="card animate-in delay-2" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ padding:'16px 24px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:8 }}>
        <PenLine size={15} color="var(--navy)"/>
        <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>
          Authorised Signatory Signature
        </h3>
        {sigFile && <span style={{ marginLeft:'auto',fontSize:10,fontWeight:700,color:'var(--green)',background:'rgba(34,197,94,0.1)',padding:'3px 8px',borderRadius:4 }}>UPLOADED</span>}
      </div>
      <div style={{ padding:'20px 24px' }}>
        {sigFile ? (
          <div style={{ display:'flex',alignItems:'center',gap:12,background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:10,padding:'14px 16px' }}>
            <CheckCircle size={20} color="var(--green)"/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'var(--navy)' }}>Signature uploaded</div>
              <div style={{ fontSize:11,color:'var(--gray-400)' }}>{sigFile.name}</div>
            </div>
            <button onClick={() => onFileChange(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--gray-300)' }}><X size={16}/></button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize:12,color:'var(--gray-400)',marginBottom:14 }}>Upload a clear image of the authorised signatory's signature.</p>
            <div style={{ display:'flex',gap:10 }}>
              <label style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'12px',background:'var(--navy)',color:'white',borderRadius:9,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,letterSpacing:'0.06em' }}>
                <input type="file" accept=".png,.jpg,.jpeg,.pdf" style={{ display:'none' }} onChange={e => onFileChange(e.target.files?.[0] || null)}/>
                <Upload size={14}/> UPLOAD SIGNATURE
              </label>
              <button onClick={onDrawOpen} style={{ display:'flex',alignItems:'center',gap:7,padding:'12px 16px',background:'rgba(13,27,53,0.06)',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)' }}>
                <PenLine size={14}/> DRAW
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Supporting docs upload list ── */
function SupportingDocs({ docData, uploading, onUpload, fileRefs }) {
  return (
    <div className="card animate-in delay-3" style={{ padding:0,overflow:'hidden' }}>
      <div style={{ padding:'16px 24px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:8 }}>
        <FileText size={15} color="var(--navy)"/>
        <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Supporting Documents</h3>
      </div>
      <div style={{ padding:'8px 0' }}>
        {ADDITIONAL_DOCS.map((doc, i) => {
          const status   = docData[doc.key]?.status || 'NOT_UPLOADED';
          const info     = docData[doc.key];
          const isUpl    = uploading === doc.key;
          const uploaded = ['UPLOADED','VERIFIED'].includes(status);
          const canView  = info?.fileUrl && !info.fileUrl.startsWith('pending-cloud-upload://');
          return (
            <div key={doc.key} style={{ padding:'14px 24px',borderBottom:i<ADDITIONAL_DOCS.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:700,color:'var(--navy)',marginBottom:2 }}>{doc.label}</div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>{doc.hint}</div>
                {info?.fileName && <div style={{ fontSize:11,color:'var(--green)',fontWeight:600,marginTop:3 }}>✓ {info.fileName}</div>}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                {canView && (
                  <a href={info.fileUrl} target="_blank" rel="noreferrer" style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(13,27,53,0.06)',color:'var(--navy)',borderRadius:7,fontSize:11,fontWeight:700,textDecoration:'none' }}>
                    <ExternalLink size={11}/> View
                  </a>
                )}
                <label style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:uploaded?'rgba(34,197,94,0.1)':'var(--navy)',color:uploaded?'var(--green)':'white',borderRadius:8,cursor:isUpl?'not-allowed':'pointer',fontSize:11,fontWeight:700 }}>
                  <input ref={el=>fileRefs.current[doc.key]=el} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} disabled={isUpl} onChange={e=>onUpload(doc.key,e.target.files?.[0]||null)}/>
                  {isUpl?<>Uploading…</>:uploaded?<><CheckCircle size={12}/>{status==='VERIFIED'?'Verified':'Replace'}</>:<><Upload size={12}/>Upload</>}
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Draw signature modal ── */
function DrawSignatureModal({ onClose }) {
  return (
    <ModalOverlay onClose={onClose} maxWidth={460}
      headerContent={<div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'white',textTransform:'uppercase' }}>Draw Signature</div>}
    >
      <div style={{ border:'2px dashed var(--gray-200)',borderRadius:10,height:180,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gray-300)',fontSize:13,background:'#fafafa',marginBottom:16 }}>
        <div style={{ textAlign:'center' }}>
          <PenLine size={28} color="var(--gray-300)" style={{ marginBottom:8 }}/>
          <div>Signature pad — draw here</div>
          <div style={{ fontSize:11,marginTop:4 }}>(Canvas drawing coming soon — use file upload)</div>
        </div>
      </div>
      <button onClick={onClose} style={{ width:'100%',padding:'12px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12 }}>CLOSE</button>
    </ModalOverlay>
  );
}

export default function KYC() {
  const { user } = useAppStore();
  const kycRecord = user?.client?.kycRecord || {};
  const fileRefs  = useRef({});

  const [docData,     setDocData]     = useState({});
  const [sigFile,     setSigFile]     = useState(null);
  const [drawOpen,    setDrawOpen]    = useState(false);
  const [uploading,   setUploading]   = useState(null);
  const [toastMsg,    setToastMsg]    = useState(null);
  const [toastType,   setToastType]   = useState('success');

  const showToast = (type, msg) => { setToastType(type); setToastMsg(msg); setTimeout(() => setToastMsg(null), 4000); };

  useEffect(() => {
    kycApi.getMyKyc()
      .then(data => { const map = {}; (data?.documents||[]).forEach(d => { map[d.key] = d; }); setDocData(map); })
      .catch(() => {});
  }, []);

  const getStatus = key => docData[key]?.status || 'NOT_UPLOADED';

  const handleDocUpload = async (key, file) => {
    if (!file) return;
    setUploading(key);
    try {
      const result = await kycApi.uploadDocument(key, file);
      setDocData(prev => ({ ...prev, [key]: { ...prev[key], status:'UPLOADED', fileName:file.name, fileUrl:result?.fileUrl||null } }));
      showToast('success', `${file.name} uploaded successfully.`);
    } catch(e) {
      showToast('error', e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
      if (fileRefs.current[key]) fileRefs.current[key].value = '';
    }
  };

  const handleSigUpload = async (file) => {
    if (!file) { setSigFile(null); return; }
    setSigFile(file);
    try { await kycApi.uploadDocument('sig_upload', file); showToast('success','Signature uploaded successfully.'); }
    catch(e) { showToast('error', e.message||'Signature upload failed.'); }
  };

  const refreshStatus = () => {
    kycApi.getMyKyc()
      .then(data => { const map={}; (data?.documents||[]).forEach(d=>{map[d.key]=d;}); setDocData(map); })
      .catch(() => {});
  };

  const directors = [
    ...(user?.name ? [{ name:user.name, role:'Primary Signatory', expiry:'—', avatar:(user.name||'?').slice(0,2).toUpperCase() }] : []),
    ...(user?.secondaryName ? [{ name:user.secondaryName, role:'Secondary Signatory', expiry:'—', avatar:(user.secondaryName||'?').slice(0,2).toUpperCase() }] : []),
    ...(user?.directors || []),
  ];

  return (
    <div>
      <PageHeader title="Corporate KYC Registry" subtitle="Bespoke Asset Management System V2.0" />

      {toastMsg && <AlertBanner message={toastMsg} type={toastType} style={{ marginBottom:16 }} />}

      <div style={{ display:'grid',gridTemplateColumns:'1fr 300px',gap:24,alignItems:'start' }}>
        {/* Left column */}
        <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
          <SignatoryRegistry directors={directors} />
          <SignatureBlock sigFile={sigFile} onFileChange={handleSigUpload} onDrawOpen={() => setDrawOpen(true)} />
          <SupportingDocs docData={docData} uploading={uploading} onUpload={handleDocUpload} fileRefs={fileRefs} />
        </div>

        {/* Right column */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <KycStatusPanel
            docs={KYC_DOCS}
            getStatus={getStatus}
            extraItems={[{ label:'Signature', status: sigFile ? 'UPLOADED' : 'NOT_UPLOADED' }]}
            onRefresh={refreshStatus}
          />
          <div style={{ background:'rgba(232,184,75,0.07)',border:'1px solid rgba(232,184,75,0.2)',borderRadius:10,padding:'14px 16px',fontSize:12,color:'var(--navy)',lineHeight:1.6 }}>
            <div style={{ fontWeight:700,marginBottom:6 }}>Compliance Notice</div>
            All KYC documents must be current and valid. Utility bills must not be older than 3 months.
            <div style={{ marginTop:8,padding:'8px 10px',background:'rgba(239,68,68,0.07)',borderRadius:7,fontSize:11,color:'var(--red)',fontWeight:600 }}>
              ⚠ Liquidation, withdrawal and pre-termination are locked until all KYC items are approved.
            </div>
          </div>
        </div>
      </div>

      {drawOpen && <DrawSignatureModal onClose={() => setDrawOpen(false)} />}
      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 300px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
