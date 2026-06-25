import React, { useState, useEffect, useMemo } from 'react';
import { Shield, CheckCircle, Clock, Lock, Gavel, Users, ExternalLink } from 'lucide-react';
import useAppStore, { KYC_REQUIREMENTS, getJointHolders, getJointMandate } from '../../store/useAppStore';
import { kycApi } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import HolderBanner from '../../components/ui/HolderBanner';
import ProgressBar from '../../components/ui/ProgressBar';

const HOLDER_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6'];

const statusLabel = (status) => {
  if (!status) return 'pending';
  const norm = status.toString().toLowerCase();
  if (norm === 'verified' || norm === 'approved') return 'approved';
  if (norm === 'rejected') return 'rejected';
  return 'pending';
};

/* ── Mandate selector (read-only) ── */
function MandatePanel({ mandate, n }) {
  return (
    <div style={{ background:'white',borderRadius:12,border:'2px solid var(--navy)',padding:'18px 22px',marginBottom:18 }} className="animate-in delay-2">
      <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12,display:'flex',alignItems:'center',gap:6 }}>
        <Lock size={13}/> Mandate Type
        <span style={{ marginLeft:'auto',fontSize:9,fontWeight:700,letterSpacing:'0.08em',color:'var(--red)',background:'rgba(239,68,68,0.08)',padding:'3px 9px',borderRadius:4,display:'flex',alignItems:'center',gap:4 }}>
          <Lock size={9}/> LOCKED AT CREATION
        </span>
      </div>
      <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
        {[['AND',`All ${n} holders must co-authorise every transaction.`],['OR','Any single holder may authorise independently.']].map(([id,desc])=>(
          <div key={id} style={{ flex:'1 1 160px',padding:'14px',borderRadius:10,border:`2px solid ${mandate===id?'var(--navy)':'var(--gray-200)'}`,background:mandate===id?'var(--navy)':'var(--gray-50)',opacity:mandate===id?1:0.45 }}>
            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
              <div style={{ width:14,height:14,borderRadius:'50%',background:mandate===id?'var(--gold)':'var(--gray-300)',flexShrink:0 }}/>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:mandate===id?'var(--gold)':'var(--navy)' }}>{id} Mandate</div>
            </div>
            <div style={{ fontSize:11,color:mandate===id?'rgba(255,255,255,0.65)':'var(--gray-400)' }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12,fontSize:11,color:'var(--gray-400)',fontStyle:'italic' }}>
        Mandate was set at account creation and cannot be changed. Contact compliance to amend.
      </div>
    </div>
  );
}

/* ── Authority panel ── */
function AuthorityPanel({ holders, getPct, mandate, n }) {
  return (
    <div style={{ background:'rgba(13,27,53,0.03)',border:'1px solid var(--gray-200)',borderRadius:12,padding:'18px 22px',marginBottom:18 }} className="animate-in delay-2">
      <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:14,display:'flex',alignItems:'center',gap:6 }}>
        <Gavel size={13}/> Liquidation & Withdrawal Authority
      </div>
      <div style={{ display:'grid',gridTemplateColumns:`repeat(${Math.min(n,3)},1fr)`,gap:10,marginBottom:14 }}>
        {holders.map((h,i)=>{
          const pct = getPct(i);
          return (
            <div key={i} style={{ padding:'12px 14px',background:'white',borderRadius:10,border:`1px solid ${HOLDER_COLORS[i]}25` }}>
              <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:3 }}>{i===0?'Primary':i===1?'Secondary':'Third'} Holder</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.name}</div>
              <ProgressBar pct={pct} color={pct===100?'var(--green)':HOLDER_COLORS[i]} height={5} />
              <div style={{ fontSize:10,color:pct===100?'var(--green)':'var(--gold)',fontWeight:700,marginTop:4 }}>KYC {pct}% {pct===100?'✓ Authorised':'— Locked'}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding:'10px 14px',borderRadius:8,background:mandate==='AND'?'rgba(239,68,68,0.06)':'rgba(34,197,94,0.06)',border:`1px solid ${mandate==='AND'?'rgba(239,68,68,0.2)':'rgba(34,197,94,0.2)'}`,fontSize:12,color:'var(--navy)' }}>
        {mandate==='AND'
          ? <><strong>AND Mandate:</strong> All {n} signatories must approve liquidation and withdrawals.</>
          : <><strong>OR Mandate:</strong> Any single signatory may independently authorise transactions.</>
        }
      </div>
    </div>
  );
}

/* ── Doc row ── */
function DocRow({ doc, activeColor, onUpload, uploading, uploadError }) {
  const state = statusLabel(doc.status);
  const canView = Boolean(doc.fileUrl);
  const isUploading = uploading === doc.key;
  const uploadLabel = state === 'rejected' ? 'Re-upload' : 'Upload';

  return (
    <div style={{ padding:'13px 20px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',transition:'background 0.15s',borderBottom:'1px solid var(--gray-100)' }}>
      <div style={{ width:36,height:36,borderRadius:9,background:state === 'approved' ? 'rgba(34,197,94,0.1)' : state === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(232,184,75,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        {state === 'approved'
          ? <CheckCircle size={16} color="var(--green)" />
          : state === 'rejected'
            ? <Clock size={16} color="#ef4444" />
            : <Clock size={16} color="var(--gold)" />
        }
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)',marginBottom:1 }}>{doc.label}</div>
        <div style={{ fontSize:10,color:'var(--gray-400)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
          {doc.fileName || 'Required document'}{doc.uploadedAt ? ` · ${new Date(doc.uploadedAt).toLocaleDateString('en-GB')}` : ''}
        </div>
        {uploadError && uploading === doc.key && (
          <div style={{ marginTop:6,color:'var(--red)',fontSize:11 }}>{uploadError}</div>
        )}
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0,flexWrap:'wrap' }}>
        <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:state === 'approved' ? 'var(--green)' : state === 'rejected' ? 'var(--red)' : 'var(--gold)',background:state === 'approved' ? 'rgba(34,197,94,0.1)' : state === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(232,184,75,0.12)',padding:'3px 8px',borderRadius:4 }}>
          {state === 'approved' ? 'Verified' : state === 'rejected' ? 'Rejected' : 'Pending'}
        </span>
        {canView && (
          <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 10px',background:activeColor, color:'white',borderRadius:7,fontSize:11,fontWeight:700,textDecoration:'none' }}>
            <ExternalLink size={10} /> View
          </a>
        )}
        {onUpload && (
          <label style={{ display:'inline-flex',alignItems:'center',gap:6,background:'var(--navy)',color:'white',borderRadius:8,padding:'8px 12px',fontSize:11,fontWeight:700,cursor:'pointer',opacity:isUploading?0.7:1 }}>
            <input type="file" accept="image/*,.pdf" hidden onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(doc.key, file);
              }
              e.target.value = '';
            }} />
            {isUploading ? 'Uploading…' : uploadLabel}
          </label>
        )}
      </div>
    </div>
  );
}

export default function AccessControl() {
  const { user, clientProfile } = useAppStore();
  const client = clientProfile || user?.client || {};
  const holders = getJointHolders(client, user);
  const n = Math.max(holders.length, 2);
  const mandate = getJointMandate(client, user);

  const [activeIdx, setActiveIdx] = useState(0);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const refreshDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await kycApi.getMyKyc();
      setDocs(data?.documents || []);
    } catch (err) {
      setError(err?.message || 'Failed to load KYC documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDocs();
  }, []);

  const handleUploadDocument = async (docKey, file) => {
    setUploadingKey(docKey);
    setUploadError(null);
    try {
      await kycApi.uploadDocument(docKey, file);
      await refreshDocs();
    } catch (err) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  const groups = useMemo(() => holders.map((holder, idx) => {
    const suffix = `_p${idx + 1}`;
    const requirements = KYC_REQUIREMENTS.joint.filter(d => d.key.endsWith(suffix));
    const docsForHolder = requirements.map(doc => {
      const existing = docs.find(d => d.key === doc.key) || {};
      return {
        ...doc,
        ...existing,
        status: existing.status || 'pending',
      };
    });
    return { holder, docs: docsForHolder };
  }), [holders, docs]);

  const getPct = (idx) => {
    const group = groups[idx] || { docs: [] };
    if (!group.docs.length) return 0;
    return Math.round((group.docs.filter(d => statusLabel(d.status) === 'approved').length / group.docs.length) * 100);
  };

  const allVerified = groups.every(group => group.docs.every(d => statusLabel(d.status) === 'approved'));
  const verifiedHolderCount = groups.filter(group => group.docs.length && group.docs.every(d => statusLabel(d.status) === 'approved')).length;
  const overallPct = groups.length ? Math.round(groups.reduce((sum, _, idx) => sum + getPct(idx), 0) / groups.length) : 0;
  const activeGroup = groups[activeIdx] || groups[0] || { holder: { name: `Holder ${activeIdx + 1}`, email: '—' }, docs: [] };
  const verifiedCount = activeGroup.docs.filter(d => statusLabel(d.status) === 'approved').length;
  const holderNames = holders.map(h => h.name || 'Holder');

  return (
    <div>
      <PageHeader title="Access Control" subtitle={`${holders.length || 2}-Holder KYC · Mandate · Signatory Management`} />

      <HolderBanner holders={holderNames} mandate={mandate} />

      <div style={{ background: allVerified ? 'var(--green)' : 'var(--navy)',borderRadius:14,padding:'22px 26px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none' }}/>
        <div style={{ display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' }}>
          <div style={{ width:48,height:48,borderRadius:12,background:'rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Shield size={22} color="white"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',marginBottom:3 }}>
              {allVerified ? `All ${n} Holders Verified` : `KYC Incomplete — ${verifiedHolderCount}/${n} holders fully verified`}
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

      <MandatePanel mandate={mandate} n={n} />
      <AuthorityPanel holders={holders} getPct={getPct} mandate={mandate} n={n} />

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginBottom:18 }} className="animate-in delay-2">
        {holders.map((h, idx) => {
          const pct = getPct(idx);
          const status = pct === 100 ? 'Verified' : 'Pending';
          return (
            <div key={idx} style={{ background:'white',border:'1px solid var(--gray-200)',borderRadius:12,padding:'16px' }}>
              <div style={{ fontSize:11,fontWeight:700,color:'var(--gray-500)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10 }}>{idx === 0 ? 'Primary Holder' : idx === 1 ? 'Secondary Holder' : `Holder ${idx + 1}`}</div>
              <div style={{ fontSize:14,fontWeight:700,color:'var(--navy)',marginBottom:6 }}>{h.name}</div>
              <div style={{ fontSize:11,color:'var(--gray-500)',marginBottom:12,wordBreak:'break-word' }}>{h.email}</div>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <ProgressBar pct={pct} color={pct === 100 ? 'var(--green)' : HOLDER_COLORS[idx]} height={6} />
                <span style={{ fontSize:10,fontWeight:700,color: pct === 100 ? 'var(--green)' : 'var(--gold)' }}>{status}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }} className="animate-in delay-2">
        {holders.map((h,i) => (
          <button key={i} onClick={() => setActiveIdx(i)} style={{ flex:1,minWidth:120,display:'flex',alignItems:'center',gap:8,padding:'11px 14px',borderRadius:10,border:`2px solid ${activeIdx===i?HOLDER_COLORS[i]:'var(--gray-200)'}`,cursor:'pointer',background:activeIdx===i?HOLDER_COLORS[i]:'white',transition:'all 0.2s',textAlign:'left' }}>
            <div style={{ width:30,height:30,borderRadius:'50%',background:activeIdx===i?'rgba(255,255,255,0.2)':'var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:activeIdx===i?'white':HOLDER_COLORS[i],flexShrink:0 }}>{(h.name || 'Holder').charAt(0)}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:11,fontWeight:700,color:activeIdx===i?'white':'var(--navy)',fontFamily:'Syne,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.name.split(' ')[0]}</div>
              <div style={{ fontSize:9,color:activeIdx===i?'rgba(255,255,255,0.6)':'var(--gray-400)' }}>KYC {getPct(i)}%</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ background:'white',borderRadius:14,border:`1px solid ${HOLDER_COLORS[activeIdx]}30`,overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between',background:`${HOLDER_COLORS[activeIdx]}08` }}>
          <div>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:1 }}>
              {activeGroup.holder.name} — KYC Documents
            </h3>
            <div style={{ fontSize:10,color:'var(--gray-400)' }}>{activeGroup.holder.email}</div>
          </div>
          <span style={{ fontSize:11,fontWeight:700,color:HOLDER_COLORS[activeIdx] }}>{verifiedCount}/{activeGroup.docs.length} verified</span>
        </div>
        {loading ? (
          <div style={{ padding:'24px',textAlign:'center',color:'var(--gray-400)' }}>Loading KYC documents…</div>
        ) : error ? (
          <div style={{ padding:'24px',textAlign:'center',color:'var(--red)' }}>{error}</div>
        ) : activeGroup.docs.length === 0 ? (
          <div style={{ padding:'24px',textAlign:'center',color:'var(--gray-400)' }}>No joint KYC documents found. Upload documents using your onboarding journey or contact support.</div>
        ) : (
          activeGroup.docs.map((doc) => (
            <DocRow
              key={doc.key}
              doc={doc}
              activeColor={HOLDER_COLORS[activeIdx]}
              onUpload={handleUploadDocument}
              uploading={uploadingKey}
              uploadError={uploadError}
            />
          ))
        )}
      </div>

      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'14px 18px',marginTop:18,fontSize:12,color:'var(--navy)',lineHeight:1.7 }} className="animate-in delay-3">
        <div style={{ fontWeight:700,marginBottom:6,display:'flex',alignItems:'center',gap:6 }}><Users size={13}/> Joint Account Policy</div>
        <ul style={{ margin:0,paddingLeft:18 }}>
          <li>Mandate type (<strong>{mandate}</strong>) is permanently set at account creation.</li>
          <li>Under <strong>AND mandate</strong>: all {n} signatories must approve liquidation and withdrawals.</li>
          <li>Under <strong>OR mandate</strong>: any single signatory can independently authorise transactions.</li>
          <li>Full KYC verification is required from all signatories before any liquidation is processed.</li>
        </ul>
      </div>
      <style>{`@media(max-width:600px){div[style*="repeat"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
