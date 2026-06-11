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
  { key:'cac_cert',    label:'CAC Certificate' },
  { key:'tax_id',      label:'Tax ID / TIN' },
  { key:'scuml',       label:'SCUML' },
  { key:'utility_bill',label:'Utility Bill' },
  { key:'memart',      label:'MEMART' },
  { key:'sig_mandate', label:'Sig. Mandate' },
  { key:'directors_id',label:"Directors' ID" },
  { key:'sig_upload',  label:'Signature' },
];

const ADDITIONAL_DOCS = [
  { key:'cac_cert',     label:'CAC Certificate',      hint:'Certificate of Incorporation · PDF' },
  { key:'memart',       label:'MEMART',                hint:'Memorandum & Articles of Association · PDF' },
  { key:'scuml',        label:'SCUML Certificate',    hint:'Special Control Unit against ML · PDF' },
  { key:'tax_id',       label:'Tax ID / TIN',         hint:'Federal Inland Revenue Service · PDF' },
  { key:'utility_bill', label:'Utility Bill',        hint:'Not older than 3 months · PDF/JPG/PNG' },
  { key:'directors_id', label:"Directors' Valid ID",  hint:'Government-issued ID for all directors' },
  { key:'sig_mandate',  label:'Signature Mandate',    hint:'Authorised signatories mandate form specifying signing arrangement · PDF' },
];

/* ── Signature upload block ── */
function SignatureBlock({ sigDoc, uploading, onFileChange }) {
  const isUploaded = sigDoc && ['UPLOADED','VERIFIED'].includes(sigDoc.status);
  const isVerified = sigDoc?.status === 'VERIFIED';
  const isUpl      = uploading === 'sig_upload';
  const canView    = sigDoc?.fileUrl && !sigDoc.fileUrl.startsWith('pending-cloud-upload://');
  return (
    <div className="card animate-in delay-2" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ padding:'16px 24px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:8 }}>
        <PenLine size={15} color="var(--navy)"/>
        <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>
          Authorised Signatory Signature
        </h3>
        {isVerified && <span style={{ marginLeft:'auto',fontSize:9,fontWeight:700,color:'var(--green)',background:'rgba(34,197,94,0.1)',padding:'3px 8px',borderRadius:4,letterSpacing:'0.06em' }}>VERIFIED</span>}
        {isUploaded && !isVerified && <span style={{ marginLeft:'auto',fontSize:9,fontWeight:700,color:'#3b82f6',background:'rgba(59,130,246,0.1)',padding:'3px 8px',borderRadius:4,letterSpacing:'0.06em' }}>UPLOADED</span>}
      </div>
      <div style={{ padding:'20px 24px' }}>
        {isUploaded ? (
          <div style={{ display:'flex',alignItems:'center',gap:12,background:isVerified?'rgba(34,197,94,0.06)':'rgba(59,130,246,0.05)',border:`1px solid ${isVerified?'rgba(34,197,94,0.2)':'rgba(59,130,246,0.2)'}`,borderRadius:10,padding:'14px 16px' }}>
            <CheckCircle size={20} color={isVerified?'var(--green)':'#3b82f6'}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'var(--navy)' }}>Signature {isVerified?'verified':'uploaded'}</div>
              <div style={{ fontSize:11,color:'var(--gray-400)' }}>{sigDoc.fileName || 'Signature file'}</div>
            </div>
            <div style={{ display:'flex',gap:8,alignItems:'center' }}>
              {canView && (
                <a href={sigDoc.fileUrl} target="_blank" rel="noreferrer" style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(13,27,53,0.06)',color:'var(--navy)',borderRadius:7,fontSize:11,fontWeight:700,textDecoration:'none' }}>
                  <ExternalLink size={11}/> View
                </a>
              )}
              {!isVerified && (
                <label style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 12px',background:'rgba(59,130,246,0.1)',color:'#3b82f6',borderRadius:7,fontSize:11,fontWeight:700,cursor:isUpl?'not-allowed':'pointer' }}>
                  <input type="file" accept=".png,.jpg,.jpeg,.pdf" style={{ display:'none' }} disabled={isUpl} onChange={e=>onFileChange(e.target.files?.[0]||null)}/>
                  {isUpl?'Uploading…':<><Upload size={12}/> Replace</>}
                </label>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize:12,color:'var(--gray-400)',marginBottom:14 }}>Upload a clear image of the authorised signatory's signature.</p>
            <label style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'12px',background:isUpl?'rgba(13,27,53,0.4)':'var(--navy)',color:'white',borderRadius:9,cursor:isUpl?'not-allowed':'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,letterSpacing:'0.06em' }}>
              <input type="file" accept=".png,.jpg,.jpeg,.pdf" style={{ display:'none' }} disabled={isUpl} onChange={e=>onFileChange(e.target.files?.[0]||null)}/>
              {isUpl?'Uploading…':<><Upload size={14}/> UPLOAD SIGNATURE</>}
            </label>
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
          const isVer    = status === 'VERIFIED';
          const isRej    = status === 'REJECTED';
          const canView  = info?.fileUrl && !info.fileUrl.startsWith('pending-cloud-upload://');
          return (
            <div key={doc.key} style={{ padding:'14px 24px',borderBottom:i<ADDITIONAL_DOCS.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'flex-start',gap:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:'var(--navy)',marginBottom:2 }}>{doc.label}</div>
                  {isVer && <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--green)',background:'rgba(34,197,94,0.1)',padding:'2px 7px',borderRadius:4 }}>Verified</span>}
                  {isRej && <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--red)',background:'rgba(239,68,68,0.1)',padding:'2px 7px',borderRadius:4 }}>Rejected</span>}
                </div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>{doc.hint}</div>
                {info?.fileName && <div style={{ fontSize:11,color:isRej?'var(--red)':'var(--green)',fontWeight:600,marginTop:3 }}>{isRej?'✗':'✓'} {info.fileName}</div>}
                {isRej && info?.rejectionReason && (
                  <div style={{ marginTop:6,padding:'6px 10px',background:'rgba(239,68,68,0.07)',borderRadius:6,fontSize:11,color:'var(--red)',fontWeight:600 }}>
                    Rejected: {info.rejectionReason}
                  </div>
                )}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0,marginTop:2 }}>
                {canView && (
                  <a href={info.fileUrl} target="_blank" rel="noreferrer" style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(13,27,53,0.06)',color:'var(--navy)',borderRadius:7,fontSize:11,fontWeight:700,textDecoration:'none' }}>
                    <ExternalLink size={11}/> View
                  </a>
                )}
                {!isVer && (
                  <label style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:uploaded?'rgba(59,130,246,0.1)':isRej?'rgba(239,68,68,0.1)':'var(--navy)',color:uploaded?'#3b82f6':isRej?'var(--red)':'white',borderRadius:8,cursor:isUpl?'not-allowed':'pointer',fontSize:11,fontWeight:700 }}>
                    <input ref={el=>fileRefs.current[doc.key]=el} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} disabled={isUpl} onChange={e=>onUpload(doc.key,e.target.files?.[0]||null)}/>
                    {isUpl?<>Uploading…</>:uploaded?<><Upload size={12}/>Replace</>:isRej?<><Upload size={12}/>Re-upload</>:<><Upload size={12}/>Upload</>}
                  </label>
                )}
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
    if (!file) return;
    setUploading('sig_upload');
    try {
      const result = await kycApi.uploadDocument('sig_upload', file);
      setDocData(prev => ({ ...prev, sig_upload: { ...prev.sig_upload, status:'UPLOADED', fileName:file.name, fileUrl:result?.fileUrl||null } }));
      showToast('success','Signature uploaded successfully.');
    } catch(e) {
      showToast('error', e.message||'Signature upload failed.');
    } finally {
      setUploading(null);
    }
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
          <SignatureBlock sigDoc={docData['sig_upload']} uploading={uploading} onFileChange={handleSigUpload} />
          <SupportingDocs docData={docData} uploading={uploading} onUpload={handleDocUpload} fileRefs={fileRefs} />
        </div>

        {/* Right column */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <KycStatusPanel
            docs={KYC_DOCS}
            getStatus={getStatus}
            extraItems={[{ label:'Signature', status: docData['sig_upload']?.status || 'NOT_UPLOADED' }]}
            onRefresh={refreshStatus}
          />
          <div style={{ background:'rgba(232,184,75,0.07)',border:'1px solid rgba(232,184,75,0.2)',borderRadius:10,padding:'14px 16px',fontSize:12,color:'var(--navy)',lineHeight:1.6 }}>
            <div style={{ fontWeight:700,marginBottom:6 }}>Compliance Notice</div>
            All KYC documents must be current and valid. Utility bills must not be older than 3 months.
            {ADDITIONAL_DOCS.some(d => docData[d.key]?.status !== 'VERIFIED') && (
              <div style={{ marginTop:8,padding:'8px 10px',background:'rgba(239,68,68,0.07)',borderRadius:7,fontSize:11,color:'var(--red)',fontWeight:600 }}>
                ⚠ Liquidation, withdrawal and pre-termination are locked until all KYC items are approved.
              </div>
            )}
          </div>
        </div>
      </div>

      {drawOpen && <DrawSignatureModal onClose={() => setDrawOpen(false)} />}
      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 300px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
