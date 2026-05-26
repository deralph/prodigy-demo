import React, { useState, useMemo } from 'react';
import { ArrowRight, AlertTriangle, CheckCircle, XCircle, Clock, Filter, Search, X, ShoppingCart } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

export default function PreTermination() {
  const { preTermQueue, clientInvestments, clients, approvePreTerm, rejectPreTerm, sellPreTerm, user, addAuditEntry } = useAppStore();
  const [selected, setSelected]     = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterSearch,  setFilterSearch]  = useState('');
  const [sellOpen, setSellOpen]           = useState(null);
  const [sellForm, setSellForm]           = useState({ salePrice:'', buyer:'', note:'' });
  const [sellDone, setSellDone]           = useState(false);

  const isOps = ['super_admin','operations'].includes(user?.adminRole);

  const log = (action, target) => addAuditEntry({
    id:'AUD-'+Date.now(), adminId:user?.clientId, admin:user?.name, role:user?.adminRole,
    action, target, category:'operations',
    time: new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}), ip:'—',
  });

  const handleApprove = (item) => {
    approvePreTerm(item.id, user?.name);
    log('Approved Pre-Termination → Routed to Finance', `${item.client} — ${fmt(item.amount)}`);
    setSelected(null);
  };

  const handleReject = (item) => {
    rejectPreTerm(item.id, user?.name, rejectNote);
    log('Rejected Pre-Termination Request', `${item.client} — ${rejectNote}`);
    setRejectNote(''); setSelected(null);
  };

  const handleSell = (item) => {
    if (!sellForm.salePrice) return;
    sellPreTerm(item.id, { ...sellForm, soldBy: user?.name, soldAt: new Date().toISOString() });
    log('Instrument Sold (Pre-Termination)', `${item.client} — ${item.product} — Sale: ${fmt(Number(sellForm.salePrice))}`);
    setSellDone(true);
    setTimeout(() => { setSellOpen(null); setSellDone(false); setSellForm({ salePrice:'', buyer:'', note:'' }); }, 1800);
  };

  const allProducts = [...new Set(preTermQueue.map(i => i.product))];

  const filtered = useMemo(() => preTermQueue.filter(item => {
    const matchStatus  = filterStatus === 'all' || item.status === filterStatus;
    const matchProduct = !filterProduct || item.product === filterProduct;
    const matchSearch  = !filterSearch || item.client.toLowerCase().includes(filterSearch.toLowerCase()) || item.product.toLowerCase().includes(filterSearch.toLowerCase());
    return matchStatus && matchProduct && matchSearch;
  }), [preTermQueue, filterStatus, filterProduct, filterSearch]);

  const pending  = preTermQueue.filter(i => i.status === 'pending');
  const approved = preTermQueue.filter(i => i.status === 'approved_ops');
  const rejected = preTermQueue.filter(i => i.status === 'rejected');

  const getStatusStyle = (s) => ({
    color:      s==='pending'?'var(--gold)':s==='approved_ops'?'var(--green)':s==='rejected'?'var(--red)':'var(--gray-400)',
    background: s==='pending'?'rgba(232,184,75,0.12)':s==='approved_ops'?'rgba(34,197,94,0.1)':s==='rejected'?'rgba(239,68,68,0.1)':'var(--gray-100)',
  });

  const getLabel = (s) => s==='pending'?'Pending Review':s==='approved_ops'?'Sent to Finance':s==='rejected'?'Rejected':'—';

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Pre-Termination Queue</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Review early exit requests — approve routes to Finance Queue</p>
      </div>

      {/* Flow diagram */}
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:22,flexWrap:'wrap' }} className="animate-in delay-1">
        {[
          { label:'Client Request',   color:'#64748b', icon:Clock },
          { label:'Operations Review',color:'var(--navy)', icon:CheckCircle },
          { label:'Finance Disburse', color:'var(--green)', icon:ArrowRight },
        ].map((step, i) => (
          <React.Fragment key={step.label}>
            <div style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'white',border:'1px solid var(--gray-200)',borderRadius:8 }}>
              <step.icon size={13} color={step.color}/>
              <span style={{ fontSize:11,fontWeight:700,color:step.color,letterSpacing:'0.04em' }}>{step.label}</span>
            </div>
            {i < 2 && <ArrowRight size={14} color="var(--gray-300)"/>}
          </React.Fragment>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22 }} className="animate-in delay-2">
        {[
          { label:'Pending Review', val:pending.length, color:'var(--gold)',  total:fmt(pending.reduce((s,i)=>s+i.amount,0)) },
          { label:'Sent to Finance',val:approved.length,color:'var(--green)', total:fmt(approved.reduce((s,i)=>s+i.amount,0)) },
          { label:'Rejected',       val:rejected.length,color:'var(--red)',   total:fmt(rejected.reduce((s,i)=>s+i.amount,0)) },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:24,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:11,fontWeight:600,color:'var(--navy)' }}>{s.total}</div>
          </div>
        ))}
      </div>

      {!isOps && (
        <div style={{ background:'rgba(232,184,75,0.1)',border:'1px solid rgba(232,184,75,0.3)',borderRadius:9,padding:'12px 16px',marginBottom:18,fontSize:13,color:'var(--navy)' }}>
          View-only — Operations role required to approve/reject pre-termination requests
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'14px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }} className="animate-in delay-3">
        <Filter size={14} color="var(--gray-400)"/>
        <div style={{ position:'relative',flex:'1 1 180px' }}>
          <Search size={13} color="var(--gray-400)" style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
          <input placeholder="Search client or product…" value={filterSearch} onChange={e=>setFilterSearch(e.target.value)}
            style={{ width:'100%',border:'1px solid var(--gray-200)',borderRadius:7,padding:'8px 10px 8px 30px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',color:'var(--navy)' }}/>
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{ border:'1px solid var(--gray-200)',borderRadius:7,padding:'8px 10px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',background:'white',color:'var(--navy)',cursor:'pointer' }}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved_ops">Sent to Finance</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filterProduct} onChange={e=>setFilterProduct(e.target.value)}
          style={{ border:'1px solid var(--gray-200)',borderRadius:7,padding:'8px 10px',fontFamily:'DM Sans,sans-serif',fontSize:12,outline:'none',background:'white',color:'var(--navy)',cursor:'pointer' }}>
          <option value="">All Products</option>
          {allProducts.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        {(filterSearch||filterProduct||filterStatus!=='all') && (
          <button onClick={()=>{setFilterSearch('');setFilterProduct('');setFilterStatus('all');}} style={{ display:'flex',alignItems:'center',gap:4,padding:'7px 10px',background:'rgba(239,68,68,0.07)',color:'var(--red)',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
            <X size={11}/> Clear
          </button>
        )}
        <span style={{ marginLeft:'auto',fontSize:11,color:'var(--gray-400)',fontWeight:600 }}>{filtered.length} result{filtered.length!==1?'s':''}</span>
      </div>

      {/* Queue items */}
      <div style={{ display:'flex',flexDirection:'column',gap:12 }} className="animate-in delay-3">
        {filtered.map(item => {
          const inv = clientInvestments.find(i => i.id === item.investmentId);
          const st  = getStatusStyle(item.status);
          return (
            <div key={item.id} style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
              <div style={{ padding:'16px 20px',display:'flex',alignItems:'flex-start',gap:14,flexWrap:'wrap' }}>
                <div style={{ width:42,height:42,borderRadius:10,background:st.background,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <AlertTriangle size={18} color={st.color}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{item.client}</span>
                    <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:st.color,background:st.background,padding:'2px 8px',borderRadius:4 }}>
                      {getLabel(item.status)}
                    </span>
                  </div>
                  <div style={{ fontSize:12,color:'var(--gray-600)',marginBottom:2 }}>{item.product} · {item.tenor}</div>
                  <div style={{ fontSize:11,color:'var(--gray-400)',marginBottom:4 }}>Request date: {item.requestDate} · Maturity: {item.maturityDate}</div>
                  <div style={{ fontSize:12,color:'var(--navy)',fontWeight:500 }}>Reason: <span style={{ color:'var(--gray-600)',fontWeight:400 }}>{item.reason}</span></div>
                  {item.approvedBy && <div style={{ fontSize:11,color:'var(--green)',marginTop:4 }}>Approved by: {item.approvedBy}</div>}
                  {item.rejectedBy && <div style={{ fontSize:11,color:'var(--red)',marginTop:4 }}>Rejected by: {item.rejectedBy} — {item.rejectReason}</div>}
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--navy)',marginBottom:2 }}>{fmt(item.amount)}</div>
                  <div style={{ fontSize:11,color:'var(--red)' }}>Penalty: {fmt(item.penalty)}</div>
                  <div style={{ fontSize:12,color:'var(--green)',fontWeight:700,marginBottom:8 }}>Net: {fmt(item.amount-item.penalty)}</div>
                  <div style={{ display:'flex',gap:6,justifyContent:'flex-end',flexWrap:'wrap' }}>
                    {item.status === 'pending' && isOps && (
                      <button onClick={()=>setSelected(item)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 14px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11 }}>
                        Review <ArrowRight size={12}/>
                      </button>
                    )}
                    <button onClick={()=>setSellOpen(item)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'rgba(249,115,22,0.1)',color:'#f97316',border:'1px solid rgba(249,115,22,0.2)',borderRadius:7,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11 }}>
                      <ShoppingCart size={11}/> Sell
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>
            No pre-termination requests match the current filters
          </div>
        )}
      </div>

      {/* Sell interface modal */}
      {sellOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setSellOpen(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:480,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'#f97316',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'white',textTransform:'uppercase',display:'flex',alignItems:'center',gap:8 }}>
                <ShoppingCart size={16}/> Sell / Liquidate Position
              </div>
              <button onClick={()=>setSellOpen(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.7)' }}>✕</button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              <div style={{ background:'rgba(249,115,22,0.07)',border:'1px solid rgba(249,115,22,0.2)',borderRadius:9,padding:'12px 14px',marginBottom:18 }}>
                <div style={{ fontSize:11,color:'#c2410c',fontWeight:700,marginBottom:4 }}>EARLY EXIT — PENALTY APPLIES</div>
                <div style={{ fontSize:12,color:'var(--navy)' }}>Confirm sale/liquidation of <strong>{sellOpen.product}</strong> for <strong>{sellOpen.client}</strong></div>
              </div>
              {sellDone ? (
                <div style={{ textAlign:'center',padding:'20px 0' }}>
                  <CheckCircle size={40} color="var(--green)" style={{ marginBottom:10 }}/>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,color:'var(--green)' }}>Sale Recorded</div>
                  <div style={{ fontSize:12,color:'var(--gray-400)',marginTop:4 }}>Instrument sale saved and audit logged.</div>
                </div>
              ) : (
                <>
                  {[
                    ['Client',      sellOpen.client],
                    ['Product',     sellOpen.product],
                    ['Principal',   fmt(sellOpen.amount)],
                    ['Penalty',     fmt(sellOpen.penalty)],
                    ['Net Payout',  fmt(sellOpen.amount - sellOpen.penalty)],
                    ['Invest Date', sellOpen.investDate],
                    ['Maturity',    sellOpen.maturityDate],
                    ['Reason',      sellOpen.reason],
                  ].map(([l,v])=>(
                    <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--gray-100)' }}>
                      <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                      <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:14,display:'flex',flexDirection:'column',gap:10 }}>
                    {[
                      { label:'Sale Price (₦)', key:'salePrice', type:'number', placeholder:`e.g. ${sellOpen.amount - sellOpen.penalty}` },
                      { label:'Buyer / Counterparty', key:'buyer', type:'text', placeholder:'e.g. Zenith Bank, CBN/DMO' },
                      { label:'Note', key:'note', type:'text', placeholder:'Optional note…' },
                    ].map(f=>(
                      <div key={f.key}>
                        <div style={{ fontSize:9,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:4 }}>{f.label}</div>
                        <input type={f.type} placeholder={f.placeholder} value={sellForm[f.key]}
                          onChange={e=>setSellForm(x=>({...x,[f.key]:e.target.value}))}
                          style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'9px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',color:'var(--navy)' }}
                          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex',gap:10,marginTop:18 }}>
                    <button onClick={()=>setSellOpen(null)} style={{ flex:1,padding:'12px',background:'var(--gray-100)',color:'var(--navy)',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12 }}>CANCEL</button>
                    <button onClick={()=>handleSell(sellOpen)} disabled={!sellForm.salePrice}
                      style={{ flex:2,padding:'12px',background:'#f97316',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6,opacity:!sellForm.salePrice?0.5:1 }}>
                      <ShoppingCart size={14}/> CONFIRM SELL
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setSelected(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:500,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Review Pre-Termination</div>
              <button onClick={()=>setSelected(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:18 }}>✕</button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {[
                ['Client',       selected.client],
                ['Product',      selected.product],
                ['Tenor',        selected.tenor],
                ['Principal',    fmt(selected.amount)],
                ['Penalty',      fmt(selected.penalty)],
                ['Net Payout',   fmt(selected.amount-selected.penalty)],
                ['Reason',       selected.reason],
                ['Request Date', selected.requestDate],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:14,background:'rgba(239,68,68,0.05)',borderRadius:8,padding:'12px',border:'1px solid rgba(239,68,68,0.12)' }}>
                <div style={{ fontSize:10,color:'var(--red)',fontWeight:600,marginBottom:4,letterSpacing:'0.06em',textTransform:'uppercase' }}>Early Exit Penalty Applied</div>
                <div style={{ fontSize:12,color:'var(--gray-600)' }}>Client forfeits {fmt(selected.penalty)} for early exit before maturity</div>
              </div>
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Rejection Note (if rejecting)</div>
                <input placeholder="Reason for rejection…" value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
              </div>
              <div style={{ display:'flex',gap:10,marginTop:18 }}>
                <button onClick={()=>handleReject(selected)} style={{ flex:1,padding:'12px',background:'rgba(239,68,68,0.1)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                  <XCircle size={14}/> REJECT
                </button>
                <button onClick={()=>handleApprove(selected)} style={{ flex:1,padding:'12px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                  <CheckCircle size={14}/> APPROVE → FINANCE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
