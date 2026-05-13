import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Ban, CheckCircle, X } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import StatusBadge from '../../components/shared/StatusBadge';

export default function ClientManagement() {
  const { clients, updateClient } = useAppStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [editModal, setEditModal] = useState(null);

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const typeColors = { corporate:'#3b82f6', individual:'#22c55e', joint:'#8b5cf6' };

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
                    ₦{c.balance.toLocaleString()}
                  </td>
                  <td style={{ padding:'14px 18px' }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex',gap:6 }}>
                      <button onClick={()=>setSelected(c)} title="View" style={{ background:'rgba(59,130,246,0.1)',border:'none',borderRadius:6,padding:'6px',cursor:'pointer',display:'flex',alignItems:'center',transition:'background 0.2s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.2)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(59,130,246,0.1)'}
                      ><Eye size={13} color="#3b82f6"/></button>
                      <button onClick={()=>setEditModal(c)} title="Edit" style={{ background:'rgba(232,184,75,0.1)',border:'none',borderRadius:6,padding:'6px',cursor:'pointer',display:'flex',alignItems:'center',transition:'background 0.2s' }}
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
                <tr><td colSpan={7} style={{ padding:'40px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>No clients found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {selected && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setSelected(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:480,padding:0,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white' }}>{selected.name}</h3>
                <p style={{ fontSize:10,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2 }}>{selected.id} · {selected.type}</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {[['Email',selected.email],['Account Type',selected.type],['KYC Status',selected.kyc],['Account Status',selected.status],['Balance',`₦${selected.balance.toLocaleString()}`],['Joined',selected.joined]].map(([l,v])=>(
                <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--gray-100)' }}>
                  <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                  <span style={{ fontSize:13,fontWeight:600,color:'var(--navy)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'flex',gap:10,marginTop:20 }}>
                <button onClick={()=>{ updateClient(selected.id,{kyc:'approved',status:'verified'}); setSelected(null); }} style={{ flex:1,background:'var(--green)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,border:'none',borderRadius:8,padding:'12px',cursor:'pointer' }}>Approve KYC</button>
                <button onClick={()=>{ updateClient(selected.id,{kyc:'flagged',status:'suspended'}); setSelected(null); }} style={{ flex:1,background:'var(--red)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,border:'none',borderRadius:8,padding:'12px',cursor:'pointer' }}>Flag & Suspend</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
