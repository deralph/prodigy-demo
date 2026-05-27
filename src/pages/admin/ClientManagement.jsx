import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Ban, CheckCircle, X, Wallet, TrendingUp, FileText, User, Phone, MapPin, Calendar, Save, Users, ExternalLink } from 'lucide-react';
import useAppStore, { KYC_REQUIREMENTS } from '../../store/useAppStore';
import { adminClientApi, adminTransactionApi, kycApi } from '../../services/api';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

export default function ClientManagement() {
  const { clients, updateClient, allTransactions, clientInvestments } = useAppStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState('info');
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saveMsg, setSaveMsg] = useState('');
  const [kycDocs, setKycDocs] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const typeColors = { corporate:'#3b82f6', individual:'#22c55e', joint:'#8b5cf6' };

  // Get wallet transactions for a client
  const getClientTxns = (clientId) =>
    allTransactions.filter(t => {
      const cl = clients.find(c => c.clientId === clientId);
      return cl && t.client === cl.name;
    });

  // Get investments for a client
  const getClientInvestments = (clientId) =>
    clientInvestments.filter(inv => inv.clientId === clientId);

  // Get KYC docs for a client type
  const getKycDocs = (clientType) => KYC_REQUIREMENTS[clientType] || KYC_REQUIREMENTS.individual;

  // Open edit modal
  const openEdit = (c) => {
    setEditForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '', status: c.status, kyc: c.kyc });
    setEditModal(c);
    setSaveMsg('');
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editModal) return;
    updateClient(editModal.id, editForm);
    // Also try backend
    adminClientApi.updateStatus(editModal.clientId, editForm.status === 'verified' ? 'ACTIVE' : editForm.status === 'suspended' ? 'SUSPENDED' : 'PENDING_KYC').catch(() => {});
    setSaveMsg('Client updated successfully');
    setTimeout(() => { setSaveMsg(''); setEditModal(null); }, 1500);
  };

  // Open detail view
  const openDetail = (c) => {
    setSelected(c);
    setDetailTab('info');
    setKycDocs(null);
  };

  useEffect(() => {
    if (detailTab === 'kyc' && selected?.id) {
      setKycLoading(true);
      kycApi.getClientKyc(selected.id)
        .then(data => setKycDocs(data))
        .catch(() => setKycDocs(null))
        .finally(() => setKycLoading(false));
    }
  }, [detailTab, selected?.id]);

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Client Management</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>All registered clients across account types</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }} className="animate-in delay-1">
        <div style={{ position:'relative',flex:1,minWidth:220 }}>
          <Search size={14} color="var(--gray-400)" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} />
          <input type="text" placeholder="Search clients..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%',border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 12px 10px 36px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}
            onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'} />
        </div>
        {[
          { label:'Type', value:typeFilter, set:setTypeFilter, opts:['all','corporate','individual','joint'] },
          { label:'Status', value:statusFilter, set:setStatusFilter, opts:['all','verified','pending','suspended'] },
        ].map(f => (
          <div key={f.label} style={{ position:'relative' }}>
            <select value={f.value} onChange={e=>f.set(e.target.value)} style={{ border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 32px 10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white',appearance:'none',cursor:'pointer' }}>
              {f.opts.map(o => <option key={o} value={o}>{o === 'all' ? `All ${f.label}s` : o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
            </select>
            <span style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--gray-400)',fontSize:11 }}>▾</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f4f6fa' }}>
                {['Client','Type','Email','KYC','Balance','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'11px 18px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ fontWeight:700,fontSize:13,color:'var(--navy)' }}>{c.name}</div>
                    <div style={{ fontSize:11,color:'var(--gray-400)' }}>{c.id}</div>
                  </td>
                  <td style={{ padding:'14px 18px' }}>
                    <span style={{ fontSize:10,fontWeight:700,color:typeColors[c.type],background:`${typeColors[c.type]}15`,padding:'3px 8px',borderRadius:4,letterSpacing:'0.06em',textTransform:'uppercase' }}>{c.type}</span>
                  </td>
                  <td style={{ padding:'14px 18px',fontSize:12,color:'var(--gray-600)' }}>{c.email}</td>
                  <td style={{ padding:'14px 18px' }}><StatusBadge status={c.kyc} /></td>
                  <td style={{ padding:'14px 18px',fontSize:13,fontWeight:600,color:'var(--navy)',whiteSpace:'nowrap' }}>
                    {fmt(c.balance)}
                  </td>
                  <td style={{ padding:'14px 18px' }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex',gap:6 }}>
                      <button onClick={()=>openDetail(c)} title="View Details" style={{ background:'rgba(59,130,246,0.1)',border:'none',borderRadius:6,padding:'6px',cursor:'pointer',display:'flex',alignItems:'center',transition:'background 0.2s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.2)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(59,130,246,0.1)'}
                      ><Eye size={13} color="#3b82f6"/></button>
                      <button onClick={()=>openEdit(c)} title="Edit" style={{ background:'rgba(232,184,75,0.1)',border:'none',borderRadius:6,padding:'6px',cursor:'pointer',display:'flex',alignItems:'center',transition:'background 0.2s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(232,184,75,0.2)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(232,184,75,0.1)'}
                      ><Edit size={13} color="var(--gold)"/></button>
                      <button onClick={()=>updateClient(c.id,{status: c.status==='suspended'?'verified':'suspended'})} title={c.status==='suspended'?'Activate':'Suspend'} style={{ background:c.status==='suspended'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',border:'none',borderRadius:6,padding:'6px',cursor:'pointer',display:'flex',alignItems:'center',transition:'background 0.2s' }}>
                        {c.status==='suspended'?<CheckCircle size={13} color="var(--green)"/>:<Ban size={13} color="var(--red)"/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7}>
                  <EmptyState
                    icon={Users}
                    title={clients.length === 0 ? "No clients yet" : "No matching clients"}
                    message={clients.length === 0 ? "Client accounts will appear here once they register through the onboarding portal." : "Try adjusting your search or filters."}
                    compact
                  />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Full Detail Modal ── */}
      {selected && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setSelected(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:720,maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
              <div>
                <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white' }}>{selected.name}</h3>
                <p style={{ fontSize:10,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2 }}>{selected.id} · {selected.type} · {selected.status}</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex',borderBottom:'1px solid var(--gray-200)',background:'#fafbfd',flexShrink:0 }}>
              {[
                { key:'info', label:'Account Info', icon:User },
                { key:'wallet', label:'Wallet & Transactions', icon:Wallet },
                { key:'investments', label:'Investments', icon:TrendingUp },
                { key:'kyc', label:'KYC Documents', icon:FileText },
              ].map(t => (
                <button key={t.key} onClick={()=>setDetailTab(t.key)} style={{
                  flex:1, padding:'12px 8px', border:'none', cursor:'pointer', fontSize:11, fontWeight:detailTab===t.key?700:500,
                  color: detailTab===t.key ? 'var(--navy)' : 'var(--gray-400)', background:'transparent',
                  borderBottom: detailTab===t.key ? '2px solid var(--navy)' : '2px solid transparent',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 0.2s',
                  fontFamily:'DM Sans,sans-serif', letterSpacing:'0.04em', textTransform:'uppercase',
                }}>
                  <t.icon size={12}/> {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
              {/* ── Info Tab ── */}
              {detailTab === 'info' && (
                <div>
                  {[
                    ['Email', selected.email],
                    ['Phone', selected.phone || '—'],
                    ['Address', selected.address || '—'],
                    ['Account Type', selected.type?.toUpperCase()],
                    ['KYC Status', selected.kyc],
                    ['Account Status', selected.status],
                    ['Wallet Balance', fmt(selected.balance)],
                    ['Joined', selected.joined],
                    ...(selected.secondaryName ? [['Secondary Holder', selected.secondaryName]] : []),
                  ].map(([l,v]) => (
                    <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--gray-100)' }}>
                      <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                      <span style={{ fontSize:13,fontWeight:600,color:'var(--navy)' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex',gap:10,marginTop:20 }}>
                    <button onClick={()=>{ updateClient(selected.id,{kyc:'approved',status:'verified'}); setSelected({...selected,kyc:'approved',status:'verified'}); }} style={{ flex:1,background:'var(--green)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,border:'none',borderRadius:8,padding:'12px',cursor:'pointer' }}>Approve KYC</button>
                    <button onClick={()=>{ updateClient(selected.id,{kyc:'flagged',status:'suspended'}); setSelected({...selected,kyc:'flagged',status:'suspended'}); }} style={{ flex:1,background:'var(--red)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,border:'none',borderRadius:8,padding:'12px',cursor:'pointer' }}>Flag & Suspend</button>
                  </div>
                </div>
              )}

              {/* ── Wallet Tab ── */}
              {detailTab === 'wallet' && (() => {
                const txns = getClientTxns(selected.clientId);
                return (
                  <div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20 }}>
                      <div style={{ background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:12,padding:'16px' }}>
                        <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:4 }}>Wallet Balance</div>
                        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'var(--navy)' }}>{fmt(selected.balance)}</div>
                      </div>
                      <div style={{ background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:12,padding:'16px' }}>
                        <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:4 }}>Total Transactions</div>
                        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'var(--navy)' }}>{txns.length}</div>
                      </div>
                    </div>
                    {txns.length === 0 ? (
                      <div style={{ textAlign:'center',padding:'30px',color:'var(--gray-400)',fontSize:13 }}>No transactions found for this client</div>
                    ) : (
                      <div style={{ border:'1px solid var(--gray-200)',borderRadius:10,overflow:'hidden' }}>
                        <table style={{ width:'100%',borderCollapse:'collapse' }}>
                          <thead>
                            <tr style={{ background:'#f4f6fa' }}>
                              {['Ref','Type','Amount','Date','Status'].map(h=>(
                                <th key={h} style={{ padding:'9px 14px',textAlign:'left',fontSize:9,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txns.map(t => (
                              <tr key={t.id} style={{ borderTop:'1px solid var(--gray-100)' }}>
                                <td style={{ padding:'10px 14px',fontSize:12,fontWeight:600,color:'var(--navy)' }}>{t.id}</td>
                                <td style={{ padding:'10px 14px',fontSize:11,color:'var(--gray-600)' }}>{t.type.replace(/_/g,' ')}</td>
                                <td style={{ padding:'10px 14px',fontSize:12,fontWeight:600,color:'var(--navy)' }}>{fmt(t.amount)}</td>
                                <td style={{ padding:'10px 14px',fontSize:11,color:'var(--gray-400)' }}>{t.date}</td>
                                <td style={{ padding:'10px 14px' }}><StatusBadge status={t.status}/></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Investments Tab ── */}
              {detailTab === 'investments' && (() => {
                const invs = getClientInvestments(selected.clientId);
                return (
                  <div>
                    {invs.length === 0 ? (
                      <div style={{ textAlign:'center',padding:'30px',color:'var(--gray-400)',fontSize:13 }}>No investments found for this client</div>
                    ) : (
                      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                        {invs.map(inv => (
                          <div key={inv.id} style={{ border:'1px solid var(--gray-200)',borderRadius:12,padding:'16px',background:'#fafbfd' }}>
                            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                              <div>
                                <div style={{ fontWeight:700,fontSize:14,color:'var(--navy)' }}>{inv.plan}</div>
                                <div style={{ fontSize:11,color:'var(--gray-400)' }}>{inv.id}</div>
                              </div>
                              <StatusBadge status={inv.status}/>
                            </div>
                            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8 }}>
                              {[['Principal',fmt(inv.amount)],['ROI',`${inv.roi}%`],['Tenor',inv.tenor],['Value Date',inv.valueDate],['Maturity',inv.maturityDate],['Tax',`${inv.tax}%`]].map(([l,v])=>(
                                <div key={l}>
                                  <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:2 }}>{l}</div>
                                  <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{v}</div>
                                </div>
                              ))}
                            </div>
                            {inv.history && inv.history.length > 0 && (
                              <div style={{ marginTop:10,borderTop:'1px solid var(--gray-200)',paddingTop:8 }}>
                                <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:4 }}>History</div>
                                {inv.history.map((h,i) => (
                                  <div key={i} style={{ fontSize:11,color:'var(--gray-600)',marginBottom:2 }}>
                                    <span style={{ color:'var(--gray-400)',marginRight:6 }}>{h.date}</span> {h.action}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── KYC Documents Tab ── */}
              {detailTab === 'kyc' && (() => {
                const docs = kycDocs?.documents || [];
                const overall = kycDocs?.kycRecord?.status || selected.kyc || 'PENDING';
                return (
                  <div>
                    <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>KYC Status</div>
                        <StatusBadge status={overall === 'APPROVED' ? 'approved' : overall === 'REJECTED' ? 'rejected' : 'pending'} />
                      </div>
                      {kycDocs?.kycRecord?.submittedAt && (
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Submitted {new Date(kycDocs.kycRecord.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      )}
                    </div>

                    {kycLoading ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-400)', fontSize: 13 }}>Loading KYC documents…</div>
                    ) : docs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-400)', fontSize: 13 }}>No KYC documents found for this client.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {docs.map(doc => {
                          const canView = doc.fileUrl && !doc.fileUrl.startsWith('pending-cloud-upload://');
                          const st = doc.status === 'VERIFIED' ? 'verified' : doc.status === 'UPLOADED' ? 'pending' : doc.status === 'REJECTED' ? 'rejected' : 'pending';
                          const isApproved = st === 'verified';
                          return (
                            <div key={doc.key} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: isApproved ? 'rgba(34,197,94,0.04)' : '#f8fafc',
                              border: `1px solid ${isApproved ? 'rgba(34,197,94,0.2)' : 'var(--gray-200)'}`,
                              borderRadius: 10, padding: '12px 16px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                <FileText size={14} color={isApproved ? 'var(--green)' : 'var(--gray-400)'}/>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{doc.label || doc.docKey}</div>
                                  <div style={{ fontSize: 10, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {doc.fileName ? doc.fileName : (doc.required ? 'Required' : 'Optional')}
                                    {doc.uploadedAt && <> · {new Date(doc.uploadedAt).toLocaleDateString('en-GB')}</>}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <StatusBadge status={st} />
                                {canView && (
                                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: 6, fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>
                                    <ExternalLink size={10} /> View
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setEditModal(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:480,padding:0,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white' }}>Edit Client</h3>
                <p style={{ fontSize:10,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2 }}>{editModal.id} · {editModal.type}</p>
              </div>
              <button onClick={()=>setEditModal(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {saveMsg && (
                <div style={{ background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'var(--green)',fontWeight:600,display:'flex',alignItems:'center',gap:8 }}>
                  <CheckCircle size={14}/> {saveMsg}
                </div>
              )}
              <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                {[
                  { key:'name', label:'Client Name', icon:User },
                  { key:'email', label:'Email', icon:null },
                  { key:'phone', label:'Phone', icon:Phone },
                  { key:'address', label:'Address', icon:MapPin },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>{f.label}</div>
                    <input type="text" value={editForm[f.key]||''} onChange={e=>setEditForm(prev=>({...prev,[f.key]:e.target.value}))}
                      style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                      onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
                  </div>
                ))}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                  <div>
                    <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Account Status</div>
                    <select value={editForm.status||''} onChange={e=>setEditForm(prev=>({...prev,status:e.target.value}))}
                      style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>KYC Status</div>
                    <select value={editForm.kyc||''} onChange={e=>setEditForm(prev=>({...prev,kyc:e.target.value}))}
                      style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveEdit} style={{
                  background:'var(--navy)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,
                  border:'none',borderRadius:8,padding:'14px',cursor:'pointer',letterSpacing:'0.06em',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:7,marginTop:4,
                }}>
                  <Save size={14}/> SAVE CHANGES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
