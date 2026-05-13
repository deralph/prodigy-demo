import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import StatusBadge from '../../components/shared/StatusBadge';

export default function ApprovalsQueue() {
  const { approvals, updateApproval } = useAppStore();
  const [filter, setFilter] = useState('pending');
  const [note, setNote] = useState('');
  const [reviewing, setReviewing] = useState(null);

  const filtered = filter === 'all' ? approvals : approvals.filter(a => a.status === filter);

  const typeIcon = { kyc:'📋', subscription:'📈', redemption:'🔄', loan:'💼' };
  const typeColor = { kyc:'#8b5cf6', subscription:'#22c55e', redemption:'#f97316', loan:'#3b82f6' };

  const handleDecision = (id, decision) => {
    updateApproval(id, decision);
    setReviewing(null);
    setNote('');
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Approvals Queue</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Review and action all pending requests</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Pending',  count: approvals.filter(a=>a.status==='pending').length,  color:'var(--gold)' },
          { label:'Approved', count: approvals.filter(a=>a.status==='approved').length, color:'var(--green)' },
          { label:'Rejected', count: approvals.filter(a=>a.status==='rejected').length, color:'var(--red)' },
          { label:'Total',    count: approvals.length,                                   color:'#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)',cursor:'pointer',transition:'all 0.2s' }}
            onClick={()=>setFilter(s.label.toLowerCase()==='total'?'all':s.label.toLowerCase())}
          >
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:24,color:s.color }}>{s.count}</div>
            <div style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase',marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex',gap:8,marginBottom:18,flexWrap:'wrap' }} className="animate-in delay-2">
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'7px 16px',borderRadius:8,border:'none',cursor:'pointer',
            fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.06em',textTransform:'uppercase',
            background: filter===f ? 'var(--navy)' : 'white',
            color: filter===f ? 'white' : 'var(--gray-400)',
            border: `1px solid ${filter===f?'var(--navy)':'var(--gray-200)'}`,
            transition:'all 0.2s',
          }}>{f}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ display:'flex',flexDirection:'column',gap:12 }} className="animate-in delay-3">
        {filtered.map(a => (
          <div key={a.id} style={{ background:'white',borderRadius:12,padding:'18px 22px',border:'1px solid var(--gray-200)',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(13,27,53,0.08)'}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
          >
            <div style={{ width:40,height:40,borderRadius:10,background:`${typeColor[a.type]}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>
              {typeIcon[a.type]}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap' }}>
                <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{a.client}</span>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:typeColor[a.type],background:`${typeColor[a.type]}15`,padding:'2px 7px',borderRadius:4 }}>{a.type}</span>
                <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:a.priority==='high'?'var(--red)':a.priority==='medium'?'var(--gold)':'var(--gray-400)',background:a.priority==='high'?'rgba(239,68,68,0.1)':a.priority==='medium'?'rgba(232,184,75,0.12)':'var(--gray-100)',padding:'2px 7px',borderRadius:4 }}>{a.priority} priority</span>
              </div>
              <div style={{ fontSize:12,color:'var(--gray-600)',marginBottom:2 }}>{a.detail}</div>
              <div style={{ fontSize:11,color:'var(--gray-400)',display:'flex',alignItems:'center',gap:4 }}><Clock size={11}/> {a.date}</div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
              <StatusBadge status={a.status} />
              {a.status === 'pending' && (
                <div style={{ display:'flex',gap:8 }}>
                  <button onClick={()=>setReviewing(a)} style={{ background:'rgba(59,130,246,0.1)',border:'none',borderRadius:7,padding:'7px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'#3b82f6',transition:'background 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(59,130,246,0.1)'}
                  ><Eye size={13}/> Review</button>
                  <button onClick={()=>handleDecision(a.id,'approved')} style={{ background:'rgba(34,197,94,0.1)',border:'none',borderRadius:7,padding:'7px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'var(--green)',transition:'background 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.1)'}
                  ><CheckCircle size={13}/> Approve</button>
                  <button onClick={()=>handleDecision(a.id,'rejected')} style={{ background:'rgba(239,68,68,0.1)',border:'none',borderRadius:7,padding:'7px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'var(--red)',transition:'background 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                  ><XCircle size={13}/> Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ background:'white',borderRadius:12,padding:'48px',textAlign:'center',border:'1px solid var(--gray-200)' }}>
            <p style={{ color:'var(--gray-400)',fontSize:13 }}>No {filter} approvals</p>
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewing && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setReviewing(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:500,boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.25s ease',overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',textTransform:'uppercase' }}>Review Request</h3>
              <button onClick={()=>setReviewing(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><XCircle size={18}/></button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {[['Reference',reviewing.id],['Client',reviewing.client],['Type',reviewing.type],['Details',reviewing.detail],['Date',reviewing.date],['Priority',reviewing.priority]].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)',textTransform:l==='Type'||l==='Priority'?'capitalize':'none' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:18 }}>
                <div style={{ fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8 }}>Decision Note (Optional)</div>
                <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note for this decision..." rows={3} style={{ width:'100%',border:'1px solid var(--gray-200)',borderRadius:10,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',resize:'vertical' }} />
              </div>
              <div style={{ display:'flex',gap:10,marginTop:16 }}>
                <button onClick={()=>handleDecision(reviewing.id,'approved')} style={{ flex:1,background:'var(--green)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,border:'none',borderRadius:8,padding:'13px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                  <CheckCircle size={14}/> APPROVE
                </button>
                <button onClick={()=>handleDecision(reviewing.id,'rejected')} style={{ flex:1,background:'var(--red)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,border:'none',borderRadius:8,padding:'13px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                  <XCircle size={14}/> REJECT
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
