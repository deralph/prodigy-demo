import React, { useState } from 'react';
import { Calendar, RefreshCw, Upload, CheckCircle, PenLine, FileText, AlertCircle, X, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import useAppStore from '../../store/useAppStore';

const KYC_DOC_LABELS = [
  { key: 'cacCert',       label: 'CAC Certificate' },
  { key: 'taxId',         label: 'Tax ID / TIN' },
  { key: 'scuml',         label: 'SCUML' },
  { key: 'utilityBill',   label: 'Utility Bill' },
  { key: 'memart',        label: 'MEMART' },
  { key: 'sigMandate',    label: 'Sig. Mandate' },
];

export default function KYC() {
  const { user } = useAppStore();
  const kycRecord = user?.client?.kycRecord || {};

  const kycItems = KYC_DOC_LABELS.map(d => {
    const url = kycRecord[d.key];
    const approved = !!url;
    return { label: d.label, status: approved ? 'Verified' : 'Pending', color: approved ? 'var(--green)' : 'var(--gold)' };
  });

  const directorsList = user?.directors || [];
  const primaryHolder = user?.name ? [{ name: user.name, role: 'Primary Signatory', expiry: '—', avatar: (user.name||'?').slice(0,2).toUpperCase() }] : [];
  const secondaryHolder = user?.secondaryName ? [{ name: user.secondaryName, role: 'Secondary Signatory', expiry: '—', avatar: (user.secondaryName||'?').slice(0,2).toUpperCase() }] : [];
  const directors = [...primaryHolder, ...secondaryHolder, ...directorsList];
  const [sigFile, setSigFile]           = useState(null);
  const [sigDrawOpen, setSigDrawOpen]   = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [saved, setSaved]               = useState(false);

  const handleDocUpload = (key, file) => {
    setUploadedDocs(prev => ({ ...prev, [key]: file }));
  };

  const handleSigUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) { setSigFile(file); setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  const additionalDocs = [
    { key: 'utility_bill', label: 'Utility Bill', hint: 'Not older than 3 months · PDF/JPG/PNG' },
    { key: 'directors_id', label: "Directors' Valid ID", hint: 'Government-issued ID for all directors' },
  ];

  return (
    <div>
      <PageHeader title="Corporate KYC Registry" subtitle="Bespoke Asset Management System V2.0" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Directors Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card animate-in delay-1" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>✍️</span>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Director & Signatory Identity Registry
              </h3>
              <span className="badge-verified" style={{ marginLeft: 'auto' }}>Status: Verified</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {directors.length === 0 && <EmptyState icon={Users} title="No signatories on record" message="Registered directors and signatories will appear here after KYC approval." />}
              {directors.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: i < directors.length - 1 ? '1px solid var(--gray-100)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'Syne, sans-serif', flexShrink: 0 }}>{d.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 2 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.role}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Expiry Date</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                      <Calendar size={12} color="var(--gray-400)" />{d.expiry}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature Upload Section */}
          <div className="card animate-in delay-2" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PenLine size={15} color="var(--navy)" />
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Authorised Signatory Signature
              </h3>
              {sigFile && <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, color:'var(--green)', background:'rgba(34,197,94,0.1)', padding:'3px 8px', borderRadius:4 }}>UPLOADED</span>}
            </div>
            <div style={{ padding: '20px 24px' }}>
              {sigFile ? (
                <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10, padding:'14px 16px' }}>
                  <CheckCircle size={20} color="var(--green)" />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)' }}>Signature uploaded successfully</div>
                    <div style={{ fontSize:11, color:'var(--gray-400)' }}>{sigFile.name}</div>
                  </div>
                  <button onClick={() => setSigFile(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gray-300)' }}><X size={16}/></button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize:12, color:'var(--gray-400)', marginBottom:14 }}>Upload a clear image of the authorised signatory's signature. Accepted: PNG, JPG, or PDF.</p>
                  <div style={{ display:'flex', gap:10 }}>
                    <label style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'12px', background:'var(--navy)', color:'white', borderRadius:9, cursor:'pointer', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, letterSpacing:'0.06em' }}>
                      <input type="file" accept=".png,.jpg,.jpeg,.pdf" style={{ display:'none' }} onChange={handleSigUpload} />
                      <Upload size={14}/> UPLOAD SIGNATURE FILE
                    </label>
                    <button onClick={() => setSigDrawOpen(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'12px 16px', background:'rgba(13,27,53,0.06)', border:'1px solid var(--gray-200)', borderRadius:9, cursor:'pointer', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, color:'var(--navy)' }}>
                      <PenLine size={14}/> DRAW
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Documents Upload */}
          <div className="card animate-in delay-3" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={15} color="var(--navy)" />
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Supporting Documents</h3>
            </div>
            <div style={{ padding: '8px 0' }}>
              {additionalDocs.map((doc, i) => (
                <div key={doc.key} style={{ padding: '14px 24px', borderBottom: i < additionalDocs.length - 1 ? '1px solid var(--gray-100)' : 'none', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)', marginBottom:2 }}>{doc.label}</div>
                    <div style={{ fontSize:11, color:'var(--gray-400)' }}>{doc.hint}</div>
                    {uploadedDocs[doc.key] && <div style={{ fontSize:11, color:'var(--green)', fontWeight:600, marginTop:3 }}>✓ {uploadedDocs[doc.key].name}</div>}
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background: uploadedDocs[doc.key] ? 'rgba(34,197,94,0.1)' : 'var(--navy)', color: uploadedDocs[doc.key] ? 'var(--green)' : 'white', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleDocUpload(doc.key, e.target.files?.[0]||null)} />
                    {uploadedDocs[doc.key] ? <><CheckCircle size={12}/> Uploaded</> : <><Upload size={12}/> Upload</>}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Corporate Entity KYC Status */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background: 'var(--navy)', borderRadius: 12, padding: 24 }} className="animate-in delay-2">
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 12, color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
              Corporate Entity KYC
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
              {kycItems.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: item.color, background: item.status === 'Verified' ? 'rgba(34,197,94,0.15)' : 'rgba(232,184,75,0.15)', padding: '3px 8px', borderRadius: 4 }}>
                    {item.status}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Signature</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: sigFile ? 'var(--green)' : 'var(--gold)', background: sigFile ? 'rgba(34,197,94,0.15)' : 'rgba(232,184,75,0.15)', padding: '3px 8px', borderRadius: 4 }}>
                  {sigFile ? 'Uploaded' : 'Pending'}
                </span>
              </div>
            </div>
            {saved && <div style={{ background:'rgba(34,197,94,0.15)', borderRadius:7, padding:'8px 12px', marginBottom:12, fontSize:11, color:'var(--green)', fontWeight:600 }}>✓ Document saved successfully</div>}
            <button style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, padding: '12px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              <RefreshCw size={13} /> Update Documents
            </button>
          </div>

          {/* Compliance note */}
          <div style={{ background:'rgba(232,184,75,0.07)', border:'1px solid rgba(232,184,75,0.2)', borderRadius:10, padding:'14px 16px', fontSize:12, color:'var(--navy)', lineHeight:1.6 }}>
            <div style={{ fontWeight:700, marginBottom:6 }}>Compliance Notice</div>
            All KYC documents must be current and valid. Utility bills must not be older than 3 months. Signature mandate must match MEMART-listed signatories.
            <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(239,68,68,0.07)', borderRadius:7, fontSize:11, color:'var(--red)', fontWeight:600 }}>
              ⚠ Liquidation, withdrawal and pre-termination are locked until all KYC items are approved.
            </div>
          </div>
        </div>
      </div>

      {/* Draw signature modal placeholder */}
      {sigDrawOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(13,27,53,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:20 }} onClick={() => setSigDrawOpen(false)}>
          <div style={{ background:'white', borderRadius:16, width:'100%', maxWidth:460, overflow:'hidden', boxShadow:'0 32px 80px rgba(13,27,53,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ background:'var(--navy)', padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:14, color:'white', textTransform:'uppercase' }}>Draw Signature</div>
              <button onClick={() => setSigDrawOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'24px' }}>
              <div style={{ border:'2px dashed var(--gray-200)', borderRadius:10, height:180, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-300)', fontSize:13, background:'#fafafa', marginBottom:16 }}>
                <div style={{ textAlign:'center' }}>
                  <PenLine size={28} color="var(--gray-300)" style={{ marginBottom:8 }} />
                  <div>Signature pad — draw here</div>
                  <div style={{ fontSize:11, marginTop:4 }}>(Canvas drawing coming soon — use file upload)</div>
                </div>
              </div>
              <button onClick={() => setSigDrawOpen(false)} style={{ width:'100%', padding:'12px', background:'var(--navy)', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12 }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:900px){
          div[style*="grid-template-columns: 1fr 300px"]{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}
