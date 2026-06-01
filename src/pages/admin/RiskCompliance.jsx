import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, XCircle, RefreshCw, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { kycApi } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import AlertBanner from '../../components/ui/AlertBanner';
import ModalOverlay from '../../components/ui/ModalOverlay';
import KycDocViewer from '../../components/ui/KycDocViewer';

/* ── Status helper ── */
const statusStyle = s => {
  if (!s || s==='NOT_UPLOADED') return { color:'var(--gray-300)', bg:'rgba(156,163,175,0.1)', label:'—' };
  if (s==='UPLOADED')   return { color:'#3b82f6',        bg:'rgba(59,130,246,0.1)',  label:'Review' };
  if (s==='VERIFIED')   return { color:'var(--green)',   bg:'rgba(34,197,94,0.1)',   label:'Verified' };
  if (s==='REJECTED')   return { color:'var(--red)',     bg:'rgba(239,68,68,0.1)',   label:'Rejected' };
  if (s==='APPROVED')   return { color:'var(--green)',   bg:'rgba(34,197,94,0.1)',   label:'Approved' };
  if (s==='PENDING')    return { color:'var(--gold)',    bg:'rgba(232,184,75,0.1)',  label:'Pending' };
  return { color:'var(--gold)', bg:'rgba(232,184,75,0.1)', label: s };
};

/* ── KPI stat tile ── */
function ComplianceStat({ label, count, Icon, color }) {
  return (
    <div style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)',display:'flex',alignItems:'center',gap:12 }}>
      <Icon size={22} color={color} strokeWidth={1.8} />
      <div>
        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color }}>{count}</div>
        <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Client compliance row ── */
function ClientComplianceRow({ client, acting, canAct, expanded, onToggle, onApprove, onRejectOpen }) {
  const kyc    = client.kycRecord || {};
  const docs   = client.kycDocuments || [];
  const ovSt   = statusStyle(kyc.status || 'PENDING');
  const isActing = acting === client.id;
  const hasDocs  = docs.length > 0;

  return (
    <div style={{ borderTop:'1px solid var(--gray-100)' }}>
      <div
        style={{ padding:'14px 22px',display:'flex',alignItems:'center',gap:12,cursor:hasDocs?'pointer':'default',transition:'background 0.15s' }}
        onClick={() => hasDocs && onToggle(client.id)}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ color:'var(--gray-300)',flexShrink:0 }}>
          {hasDocs ? (expanded ? <ChevronDown size={15}/> : <ChevronRight size={15}/>) : <span style={{ display:'inline-block',width:15 }}/>}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontWeight:700,fontSize:13,color:'var(--navy)' }}>{client.name}</div>
          <div style={{ fontSize:11,color:'var(--gray-400)',marginTop:2 }}>
            {client.email} · <span style={{ textTransform:'uppercase',fontWeight:600 }}>{client.type}</span>
            {kyc.submittedAt && <span> · Submitted {new Date(kyc.submittedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>}
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
          <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:ovSt.color,background:ovSt.bg,padding:'3px 9px',borderRadius:4 }}>{ovSt.label}</span>
          {canAct && (
            <>
              <button onClick={e => { e.stopPropagation(); onApprove(client.id); }} disabled={isActing}
                style={{ padding:'6px 12px',background:'rgba(34,197,94,0.1)',color:'var(--green)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                {isActing ? '…' : '✓ Approve'}
              </button>
              <button onClick={e => { e.stopPropagation(); onRejectOpen(client.id); }} disabled={isActing}
                style={{ padding:'6px 12px',background:'rgba(239,68,68,0.08)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
                ✗ Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded docs */}
      {expanded && hasDocs && (
        <div style={{ background:'#f8fafc',borderTop:'1px solid var(--gray-100)',padding:'12px 22px 12px 50px' }}>
          <KycDocViewer
            docs={docs.map(d => ({ ...d, key: d.id || d.docKey, label: d.label || d.docKey }))}
            kycStatus={kyc.status}
          />
          {kyc.reviewNotes && (
            <div style={{ marginTop:10,padding:'8px 12px',background:'rgba(239,68,68,0.06)',borderRadius:7,fontSize:11,color:'var(--red)',fontWeight:600 }}>
              Rejection note: {kyc.reviewNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Reject modal ── */
function RejectModal({ onClose, onConfirm, acting }) {
  const [reason, setReason] = useState('');
  return (
    <ModalOverlay onClose={onClose} maxWidth={420}
      headerContent={<div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'white',textTransform:'uppercase' }}>Reject KYC</div>}
      headerColor="var(--red)"
    >
      <p style={{ fontSize:13,color:'var(--gray-400)',marginBottom:14 }}>Provide a rejection reason. The client will be notified.</p>
      <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Utility bill is older than 3 months…"
        style={{ width:'100%',minHeight:90,padding:'10px 12px',border:'1px solid var(--gray-200)',borderRadius:8,fontSize:13,color:'var(--navy)',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box',outline:'none' }}
        onFocus={e => e.target.style.borderColor='var(--red)'} onBlur={e => e.target.style.borderColor='var(--gray-200)'}
      />
      <div style={{ display:'flex',gap:10,marginTop:16 }}>
        <button onClick={onClose} style={{ flex:1,padding:'11px',background:'rgba(13,27,53,0.06)',border:'1px solid var(--gray-200)',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700,color:'var(--navy)' }}>Cancel</button>
        <button onClick={() => onConfirm(reason)} disabled={!reason.trim() || acting}
          style={{ flex:1,padding:'11px',background:'var(--red)',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700,color:'white',opacity:reason.trim()?1:0.5 }}>
          {acting ? 'Rejecting…' : 'Confirm Reject'}
        </button>
      </div>
    </ModalOverlay>
  );
}

export default function RiskCompliance() {
  const [board,       setBoard]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [expanded,    setExpanded]    = useState({});
  const [acting,      setActing]      = useState(null);
  const [toast,       setToast]       = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const loadBoard = () => {
    setLoading(true);
    kycApi.getComplianceBoard()
      .then(data => setBoard(Array.isArray(data) ? data : []))
      .catch(() => setBoard([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBoard(); }, []);

  const toggleExpand = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleApprove = async (clientId) => {
    setActing(clientId);
    try { await kycApi.approveKyc(clientId); showToast('success', 'KYC approved successfully.'); loadBoard(); }
    catch (e) { showToast('error', e.message || 'Approval failed.'); }
    finally { setActing(null); }
  };

  const handleReject = async (reason) => {
    if (!rejectModal) return;
    setActing(rejectModal);
    try { await kycApi.rejectKyc(rejectModal, reason); showToast('success', 'KYC rejected.'); setRejectModal(null); loadBoard(); }
    catch (e) { showToast('error', e.message || 'Rejection failed.'); }
    finally { setActing(null); }
  };

  const approved = board.filter(c => c.kycRecord?.status === 'APPROVED').length;
  const pending  = board.filter(c => ['PENDING','KYC_SUBMITTED'].includes(c.kycRecord?.status) || c.status === 'KYC_SUBMITTED').length;
  const rejected = board.filter(c => c.kycRecord?.status === 'REJECTED').length;

  return (
    <div>
      <PageHeader
        title="Risk & Compliance"
        subtitle="KYC document review and compliance monitoring"
        action={{ label:'Refresh', icon:RefreshCw, onClick:loadBoard }}
      />

      {toast && <AlertBanner message={toast.msg} type={toast.type} style={{ marginBottom:16 }} />}

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:24 }} className="animate-in delay-1">
        <ComplianceStat label="Fully Verified"  count={approved}     Icon={CheckCircle}   color="var(--green)" />
        <ComplianceStat label="Pending Review"  count={pending}      Icon={AlertTriangle} color="var(--gold)" />
        <ComplianceStat label="Rejected / AML"  count={rejected}     Icon={XCircle}       color="var(--red)" />
        <ComplianceStat label="Total Clients"   count={board.length} Icon={ShieldAlert}   color="#3b82f6" />
      </div>

      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
        <div style={{ padding:'16px 22px',borderBottom:'1px solid var(--gray-100)' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>KYC Compliance Board</h3>
        </div>
        {loading ? (
          <div style={{ padding:32,textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>Loading compliance data…</div>
        ) : board.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No clients yet" message="Clients will appear here once accounts are created." />
        ) : board.map(client => (
          <ClientComplianceRow
            key={client.id}
            client={client}
            acting={acting}
            canAct={['PENDING','KYC_SUBMITTED'].includes(client.kycRecord?.status) || client.status === 'KYC_SUBMITTED'}
            expanded={expanded[client.id]}
            onToggle={toggleExpand}
            onApprove={handleApprove}
            onRejectOpen={setRejectModal}
          />
        ))}
      </div>

      {rejectModal && (
        <RejectModal onClose={() => setRejectModal(null)} onConfirm={handleReject} acting={acting === rejectModal} />
      )}
    </div>
  );
}
