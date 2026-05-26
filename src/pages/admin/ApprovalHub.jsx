import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, Filter, X, FileText, User, ExternalLink, Download, Inbox } from 'lucide-react';
import useAppStore, { KYC_REQUIREMENTS } from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

const TYPE_COLOR = {
  kyc_approval: '#8b5cf6',
  subscription: '#22c55e',
  redemption:   '#f97316',
  loan:         '#3b82f6',
};
const TYPE_LABEL = {
  kyc_approval: 'KYC',
  subscription: 'Subscription',
  redemption:   'Redemption',
  loan:         'Staff Loan',
};

export default function ApprovalHub() {
  const { approvals, updateApproval, user, addAuditEntry, clients } = useAppStore();
  const [filter, setFilter]   = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewing, setViewing] = useState(null);
  const [reviewTab, setReviewTab] = useState('details');
  const [rejectNote, setRejectNote] = useState('');

  const canApprove = ['super_admin','operations','compliance','investment'].includes(user?.adminRole);

  const log = (action, target) => addAuditEntry({
    id:'AUD-'+Date.now(), adminId:user?.clientId, admin:user?.name, role:user?.adminRole,
    action, target, category: target.includes('KYC')?'kyc':'operations',
    time: new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}), ip:'—',
  });

  const handleApprove = (a) => {
    updateApproval(a.id, { status:'approved', reviewedBy: user?.name, reviewedAt: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) });
    log(`Approved ${TYPE_LABEL[a.type]||a.type}`, `${a.clientName} — ${a.type}`);
    setViewing(null);
  };

  const handleReject = (a) => {
    updateApproval(a.id, { status:'rejected', reviewedBy: user?.name, rejectReason: rejectNote, reviewedAt: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) });
    log(`Rejected ${TYPE_LABEL[a.type]||a.type}`, `${a.clientName} — ${rejectNote}`);
    setRejectNote(''); setViewing(null);
  };

  const filtered = approvals.filter(a => {
    const mf = filter === 'all' || a.status === filter;
    const mt = typeFilter === 'all' || a.type === typeFilter;
    return mf && mt;
  });

  const tabs = [
    { key:'pending',  label:'Pending',  count: approvals.filter(a=>a.status==='pending').length },
    { key:'approved', label:'Approved', count: approvals.filter(a=>a.status==='approved').length },
    { key:'rejected', label:'Rejected', count: approvals.filter(a=>a.status==='rejected').length },
    { key:'all',      label:'All',      count: approvals.length },
  ];

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Approval Hub</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Maker-checker workflows — KYC, subscriptions, redemptions, loans</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {tabs.slice(0,3).map(t=>(
          <div key={t.key} style={{ background:'white',borderRadius:10,padding:'14px 16px',border:'1px solid var(--gray-200)',cursor:'pointer',borderTop:`3px solid ${t.key==='pending'?'var(--gold)':t.key==='approved'?'var(--green)':'var(--red)'}` }} onClick={()=>setFilter(t.key)}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:24,color:t.key==='pending'?'var(--gold)':t.key==='approved'?'var(--green)':'var(--red)',marginBottom:4 }}>{t.count}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center' }} className="animate-in delay-2">
        <div style={{ display:'flex',gap:6 }}>
          {tabs.map(t=>(
            <button key={t.key} onClick={()=>setFilter(t.key)} style={{ padding:'6px 13px',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',background:filter===t.key?'var(--navy)':'white',color:filter===t.key?'white':'var(--gray-400)',border:`1px solid ${filter===t.key?'var(--navy)':'var(--gray-200)'}`,transition:'all 0.2s' }}>
              {t.label} {t.count > 0 && <span>({t.count})</span>}
            </button>
          ))}
        </div>
        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:6 }}>
          <Filter size={13} color="var(--gray-400)"/>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ border:'1px solid var(--gray-200)',borderRadius:8,padding:'7px 12px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',background:'white',cursor:'pointer' }}>
            <option value="all">All Types</option>
            {Object.entries(TYPE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Approvals list */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={approvals.length === 0 ? "No approvals yet" : "No matching approvals"}
            message={approvals.length === 0 ? "Approval requests will appear here when clients submit KYC, investments, or staff loans." : "Try changing your filter criteria."}
            compact
          />
        ) : filtered.map((a,i)=>(
          <div key={a.id} style={{ padding:'16px 20px',borderBottom:i<filtered.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <div style={{ width:10,height:10,borderRadius:'50%',background:TYPE_COLOR[a.type]||'#64748b',flexShrink:0 }}/>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap' }}>
                <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{a.clientName}</span>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:TYPE_COLOR[a.type],background:`${TYPE_COLOR[a.type]}15`,padding:'2px 7px',borderRadius:4 }}>{TYPE_LABEL[a.type]||a.type}</span>
              </div>
              <div style={{ fontSize:12,color:'var(--gray-600)',marginBottom:2 }}>{a.details}</div>
              <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
                <span style={{ fontSize:11,color:'var(--gray-400)' }}>Submitted: {a.date}</span>
                {a.amount && <span style={{ fontSize:11,fontWeight:600,color:'var(--navy)' }}>{fmt(a.amount)}</span>}
                {a.reviewedBy && <span style={{ fontSize:11,color:'var(--gray-400)' }}>By: <strong style={{ color:'var(--navy)' }}>{a.reviewedBy}</strong></span>}
              </div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
              <StatusBadge status={a.status}/>
              <button onClick={()=>setViewing(a)} style={{ display:'flex',alignItems:'center',gap:4,padding:'7px 12px',background:'rgba(13,27,53,0.06)',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--navy)' }}>
                <Eye size={12}/> Review
              </button>
              {a.status === 'pending' && canApprove && (
                <div style={{ display:'flex',gap:6 }}>
                  <button onClick={()=>handleApprove(a)} style={{ background:'rgba(34,197,94,0.1)',border:'none',borderRadius:7,padding:'7px',cursor:'pointer',display:'flex',alignItems:'center' }}>
                    <CheckCircle size={14} color="var(--green)"/>
                  </button>
                  <button onClick={()=>{ setViewing(a); }} style={{ background:'rgba(239,68,68,0.1)',border:'none',borderRadius:7,padding:'7px',cursor:'pointer',display:'flex',alignItems:'center' }}>
                    <XCircle size={14} color="var(--red)"/>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal — Tabbed */}
      {viewing && (() => {
        const cl = clients.find(c => c.clientId === viewing.clientId) || {};
        const kycReqs = KYC_REQUIREMENTS[cl.type || cl.accountType || 'individual'] || KYC_REQUIREMENTS.individual;
        const uploadedDocs = viewing.kycDocs || [];

        return (
          <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>{setViewing(null);setReviewTab('details');}}>
            <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:640,maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
              {/* Header */}
              <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Review {TYPE_LABEL[viewing.type]||viewing.type}</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2 }}>{viewing.id} · {viewing.clientName}</div>
                </div>
                <button onClick={()=>{setViewing(null);setReviewTab('details');}} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
              </div>

              {/* Tabs */}
              <div style={{ display:'flex',borderBottom:'1px solid var(--gray-200)',background:'#fafbfd',flexShrink:0 }}>
                {[
                  { key:'details', label:'Details', icon:Eye },
                  { key:'documents', label:'Documents', icon:FileText },
                  { key:'client', label:'Client Info', icon:User },
                ].map(t => (
                  <button key={t.key} onClick={()=>setReviewTab(t.key)} style={{
                    flex:1, padding:'11px 8px', border:'none', cursor:'pointer', fontSize:11, fontWeight:reviewTab===t.key?700:500,
                    color: reviewTab===t.key ? 'var(--navy)' : 'var(--gray-400)', background:'transparent',
                    borderBottom: reviewTab===t.key ? '2px solid var(--navy)' : '2px solid transparent',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 0.2s',
                    fontFamily:'DM Sans,sans-serif', letterSpacing:'0.04em', textTransform:'uppercase',
                  }}>
                    <t.icon size={12}/> {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

                {/* ── Details Tab ── */}
                {reviewTab === 'details' && (
                  <div>
                    {[
                      ['Client',     viewing.clientName],
                      ['Type',       TYPE_LABEL[viewing.type]||viewing.type],
                      ['Details',    viewing.details],
                      ['Date',       viewing.date],
                      viewing.amount && ['Amount', fmt(viewing.amount)],
                      ['Status',     viewing.status],
                      viewing.reviewedBy && ['Reviewed By', viewing.reviewedBy],
                      viewing.reviewedAt && ['Reviewed At', viewing.reviewedAt],
                      viewing.rejectReason && ['Rejection Note', viewing.rejectReason],
                      viewing.bookedBy && ['Submitted By', viewing.bookedBy],
                    ].filter(Boolean).map(([l,v])=>(
                      <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--gray-100)' }}>
                        <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                        <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)',textTransform:'capitalize',maxWidth:'60%',textAlign:'right' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Documents Tab ── */}
                {reviewTab === 'documents' && (
                  <div>
                    <div style={{ fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:12,fontWeight:700 }}>
                      KYC Documents — {cl.type?.toUpperCase() || 'INDIVIDUAL'} Account
                    </div>
                    {uploadedDocs.length > 0 ? (
                      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                        {uploadedDocs.map((d,i)=>(
                          <div key={i} style={{
                            display:'flex',alignItems:'center',justifyContent:'space-between',
                            padding:'12px 16px',
                            background: d.status === 'uploaded' ? 'rgba(34,197,94,0.04)' : '#fff8f0',
                            border:`1px solid ${d.status === 'uploaded' ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)'}`,
                            borderRadius:10,
                          }}>
                            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                              <FileText size={15} color={d.status === 'uploaded' ? 'var(--green)' : '#f97316'}/>
                              <div>
                                <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{d.name}</div>
                                <div style={{ fontSize:10,color:'var(--gray-400)',marginTop:1 }}>
                                  {d.status === 'uploaded' ? 'Document uploaded' : 'Awaiting upload'}
                                </div>
                              </div>
                            </div>
                            <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                              <StatusBadge status={d.status === 'uploaded' ? 'approved' : 'pending'}/>
                              {d.status === 'uploaded' && (
                                <button title="View document" style={{
                                  background:'rgba(59,130,246,0.1)',border:'none',borderRadius:6,padding:'5px',cursor:'pointer',display:'flex',alignItems:'center',
                                }}>
                                  <ExternalLink size={12} color="#3b82f6"/>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize:11,color:'var(--gray-400)',marginBottom:10 }}>
                          Required documents for this account type:
                        </div>
                        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                          {kycReqs.map(doc => (
                            <div key={doc.key} style={{
                              display:'flex',alignItems:'center',justifyContent:'space-between',
                              padding:'12px 16px',background:'#f8fafc',
                              border:'1px solid var(--gray-200)',borderRadius:10,
                            }}>
                              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                                <FileText size={14} color="var(--gray-400)"/>
                                <div>
                                  <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{doc.label}</div>
                                  <div style={{ fontSize:10,color:'var(--gray-400)' }}>{doc.required ? 'Required' : 'Optional'}</div>
                                </div>
                              </div>
                              <StatusBadge status="pending"/>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {uploadedDocs.length > 0 && (
                      <div style={{ marginTop:14,padding:'12px 16px',background:'rgba(59,130,246,0.04)',border:'1px solid rgba(59,130,246,0.15)',borderRadius:10 }}>
                        <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4,fontWeight:700 }}>Summary</div>
                        <div style={{ fontSize:12,color:'var(--navy)' }}>
                          <strong>{uploadedDocs.filter(d=>d.status==='uploaded').length}</strong> of <strong>{uploadedDocs.length}</strong> documents uploaded
                          {uploadedDocs.some(d=>d.status!=='uploaded') && (
                            <span style={{ color:'#f97316',marginLeft:8 }}>⚠ Some documents are still pending</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Client Info Tab ── */}
                {reviewTab === 'client' && (
                  <div>
                    {cl.id ? (
                      <>
                        {[
                          ['Client Name', cl.name],
                          ['Client ID', cl.clientId],
                          ['Email', cl.email],
                          ['Phone', cl.phone || '—'],
                          ['Address', cl.address || '—'],
                          ['Account Type', (cl.type || cl.accountType || '').toUpperCase()],
                          ['KYC Status', cl.kyc],
                          ['Account Status', cl.status],
                          ['Wallet Balance', fmt(cl.balance || 0)],
                          ['Joined', cl.joined],
                          ...(cl.secondaryName ? [['Secondary Holder', cl.secondaryName]] : []),
                        ].map(([l,v]) => (
                          <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--gray-100)' }}>
                            <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                            <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{v}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={{ textAlign:'center',padding:'30px',color:'var(--gray-400)',fontSize:13 }}>
                        Client info not found for ID: {viewing.clientId}
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons (always visible at bottom for pending) */}
                {viewing.status === 'pending' && canApprove && (
                  <>
                    <div style={{ marginTop:18,borderTop:'1px solid var(--gray-200)',paddingTop:16 }}>
                      <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Rejection Reason (optional)</div>
                      <input placeholder="State reason if rejecting…" value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                        style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                        onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
                    </div>
                    <div style={{ display:'flex',gap:10,marginTop:14 }}>
                      <button onClick={()=>handleReject(viewing)} style={{ flex:1,padding:'12px',background:'rgba(239,68,68,0.1)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                        <XCircle size={14}/> REJECT
                      </button>
                      <button onClick={()=>handleApprove(viewing)} style={{ flex:1,padding:'12px',background:'var(--green)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                        <CheckCircle size={14}/> APPROVE
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
