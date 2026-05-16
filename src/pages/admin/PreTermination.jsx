import React, { useState } from 'react';
import { ArrowRight, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

export default function PreTermination() {
  const { preTermQueue, clientInvestments, approvePreTerm, rejectPreTerm, user, addAuditEntry } = useAppStore();
  const [selected, setSelected]   = useState(null);
  const [rejectNote, setRejectNote] = useState('');

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

      {/* Queue items */}
      <div style={{ display:'flex',flexDirection:'column',gap:12 }} className="animate-in delay-3">
        {preTermQueue.map(item => {
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
                  <div style={{ fontSize:11,color:'var(--gray-400)',marginBottom:4 }}>Request date: {item.requestDate}</div>
                  <div style={{ fontSize:12,color:'var(--navy)',fontWeight:500 }}>Reason: <span style={{ color:'var(--gray-600)',fontWeight:400 }}>{item.reason}</span></div>
                  {item.approvedBy && <div style={{ fontSize:11,color:'var(--green)',marginTop:4 }}>Approved by: {item.approvedBy}</div>}
                  {item.rejectedBy && <div style={{ fontSize:11,color:'var(--red)',marginTop:4 }}>Rejected by: {item.rejectedBy} — {item.rejectReason}</div>}
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--navy)',marginBottom:2 }}>{fmt(item.amount)}</div>
                  <div style={{ fontSize:11,color:'var(--red)' }}>Penalty: {fmt(item.penalty)}</div>
                  <div style={{ fontSize:12,color:'var(--green)',fontWeight:700 }}>Net: {fmt(item.amount-item.penalty)}</div>
                  {item.status === 'pending' && isOps && (
                    <button onClick={()=>setSelected(item)} style={{ marginTop:10,display:'flex',alignItems:'center',gap:5,padding:'7px 14px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11 }}>
                      Review <ArrowRight size={12}/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {preTermQueue.length === 0 && (
          <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>
            No pre-termination requests
          </div>
        )}
      </div>

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
