import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { CheckCircle, XCircle, DollarSign, Clock, ArrowRight, Inbox } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

export default function FinanceQueue() {
  const { financeQueue, approveFinanceItem, rejectFinanceItem, user, addAuditEntry } = useAppStore();
  const [selected, setSelected] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const isFinance = user?.adminRole === 'finance' || user?.adminRole === 'super_admin';

  const log = (action, target) => addAuditEntry({
    id:'AUD-'+Date.now(), adminId:user?.clientId, admin:user?.name, role:user?.adminRole,
    action, target, category:'finance',
    time: new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}), ip:'—',
  });

  const handleApprove = (item) => {
    approveFinanceItem(item.id, user?.name);
    log('Finance Approval — Disbursed', `${item.client} — ${fmt(item.amount)}`);
    setSelected(null);
  };

  const handleReject = (item) => {
    rejectFinanceItem(item.id, user?.name, rejectNote);
    log('Finance Rejection', `${item.client} — ${fmt(item.amount)} — ${rejectNote}`);
    setRejectNote(''); setSelected(null);
  };

  const pending  = financeQueue.filter(i => i.status === 'pending');
  const approved = financeQueue.filter(i => i.status === 'approved');
  const rejected = financeQueue.filter(i => i.status === 'rejected');

  const getColor = s => s==='pending'?'var(--gold)':s==='approved'?'var(--green)':'var(--red)';
  const getBg    = s => s==='pending'?'rgba(232,184,75,0.1)':s==='approved'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)';

  return (
    <div>
      <PageHeader
        title="Finance Queue"
        subtitle="Pre-termination & redemption disbursements awaiting finance approval"
      />

      {!isFinance && (
        <div style={{ background:'rgba(232,184,75,0.1)',border:'1px solid rgba(232,184,75,0.3)',borderRadius:10,padding:'14px 18px',marginBottom:20,fontSize:13,color:'var(--navy)' }}>
          View-only access — Finance Manager approval required for disbursements
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Pending', val:pending.length, color:'var(--gold)', total:fmt(pending.reduce((s,i)=>s+i.amount,0)) },
          { label:'Approved', val:approved.length, color:'var(--green)', total:fmt(approved.reduce((s,i)=>s+i.amount,0)) },
          { label:'Rejected', val:rejected.length, color:'var(--red)', total:fmt(rejected.reduce((s,i)=>s+i.amount,0)) },
        ].map(s=>(
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:24,color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:11,fontWeight:600,color:'var(--navy)' }}>{s.total}</div>
          </div>
        ))}
      </div>

      {/* Queue */}
      <div style={{ display:'flex',flexDirection:'column',gap:12 }} className="animate-in delay-2">
        {financeQueue.map(item => (
          <div key={item.id} style={{ background:'white',borderRadius:12,border:`1px solid var(--gray-200)`,overflow:'hidden' }}>
            <div style={{ padding:'16px 20px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' }}>
              <div style={{ width:42,height:42,borderRadius:10,background:getBg(item.status),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                {item.status==='pending' ? <Clock size={18} color={getColor(item.status)}/> : item.status==='approved' ? <CheckCircle size={18} color={getColor(item.status)}/> : <XCircle size={18} color={getColor(item.status)}/>}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:2,flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{item.client}</span>
                  <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:getColor(item.status),background:getBg(item.status),padding:'2px 7px',borderRadius:4 }}>{item.status}</span>
                  <span style={{ fontSize:10,fontWeight:700,color:'#8b5cf6',background:'rgba(139,92,246,0.1)',padding:'2px 7px',borderRadius:4,letterSpacing:'0.04em' }}>{item.type}</span>
                </div>
                <div style={{ fontSize:12,color:'var(--gray-600)',marginBottom:2 }}>{item.product} · {item.reason}</div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>Requested: {item.requestDate} · {item.requestedBy}</div>
                {item.approvedBy && <div style={{ fontSize:11,color:'var(--green)' }}>Approved by: {item.approvedBy}</div>}
                {item.rejectedBy && <div style={{ fontSize:11,color:'var(--red)' }}>Rejected by: {item.rejectedBy} — {item.rejectReason}</div>}
              </div>
              <div style={{ textAlign:'right',flexShrink:0 }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--navy)' }}>{fmt(item.amount)}</div>
                {item.penalty && <div style={{ fontSize:11,color:'var(--red)' }}>Penalty: {fmt(item.penalty)}</div>}
                {item.status==='pending' && isFinance && (
                  <button onClick={()=>setSelected(item)} style={{ marginTop:8,display:'flex',alignItems:'center',gap:5,padding:'7px 14px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11 }}>
                    Review <ArrowRight size={12}/>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {financeQueue.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="Finance queue is empty"
            message="Pre-termination and redemption requests will appear here when clients submit them."
            compact
          />
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setSelected(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:500,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Finance Disbursement Review</div>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {[
                ['Client',       selected.client],
                ['Product',      selected.product],
                ['Type',         selected.type],
                ['Amount',       fmt(selected.amount)],
                ['Penalty',      selected.penalty ? fmt(selected.penalty) : 'None'],
                ['Net Payout',   fmt(selected.amount-(selected.penalty||0))],
                ['Reason',       selected.reason],
                ['Requested By', selected.requestedBy],
                ['Request Date', selected.requestDate],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Rejection Reason (if rejecting)</div>
                <input placeholder="e.g. Insufficient documentation…" value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
              </div>
              <div style={{ display:'flex',gap:10,marginTop:18 }}>
                <button onClick={()=>handleReject(selected)} style={{ flex:1,padding:'12px',background:'rgba(239,68,68,0.1)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                  <XCircle size={14}/> REJECT
                </button>
                <button onClick={()=>handleApprove(selected)} style={{ flex:1,padding:'12px',background:'var(--green)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                  <CheckCircle size={14}/> APPROVE & DISBURSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
