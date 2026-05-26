import React, { useState } from 'react';
import { Clock, Download, Search, FileText } from 'lucide-react';
import useAppStore, { ROLE_COLORS } from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';

const catColor = { kyc:'#8b5cf6', compliance:'#ef4444', finance:'#22c55e', investment:'#e8b84b', operations:'#3b82f6', audit:'#f97316', system:'#0d1b35' };

export default function AuditTrail() {
  const { auditLog } = useAppStore();
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = auditLog.filter(a => {
    const ms = search === '' ||
      a.admin.toLowerCase().includes(search.toLowerCase()) ||
      a.action.toLowerCase().includes(search.toLowerCase()) ||
      a.target.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'all' || a.category === catFilter;
    return ms && mc;
  });

  const exportCSV = () => {
    const rows = filtered.map(a => `"${a.time}","${a.id}","${a.admin}","${a.role}","${a.action}","${a.target}","${a.category}","${a.ip}"`).join('\n');
    const blob = new Blob(['Time,ID,Admin Name,Role,Action,Target,Category,IP\n'+rows],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='audit_log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Audit Trail</h1>
            <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Complete activity log — all admins, all actions</p>
          </div>
          <button onClick={exportCSV} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 16px',background:'white',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:700,color:'#3b82f6',fontFamily:'Syne,sans-serif' }}>
            <Download size={13}/> Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position:'relative',marginBottom:16 }} className="animate-in delay-1">
        <Search size={14} color="var(--gray-400)" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
        <input placeholder="Search by admin name, action, or target..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ width:'100%',border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 12px 10px 36px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}
          onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
      </div>

      {/* Category filters */}
      <div style={{ display:'flex',gap:8,marginBottom:18,flexWrap:'wrap' }} className="animate-in delay-2">
        {['all','kyc','compliance','finance','investment','operations','audit','system'].map(f=>(
          <button key={f} onClick={()=>setCatFilter(f)} style={{
            padding:'6px 13px',borderRadius:8,cursor:'pointer',
            fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:10,letterSpacing:'0.06em',textTransform:'uppercase',
            background: catFilter===f ? (catColor[f]||'var(--navy)') : 'white',
            color: catFilter===f ? 'white' : 'var(--gray-400)',
            border: `1px solid ${catFilter===f?(catColor[f]||'var(--navy)'):'var(--gray-200)'}`,
            transition:'all 0.2s',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={auditLog.length === 0 ? "No audit entries yet" : "No matching entries"}
            message={auditLog.length === 0 ? "Audit log entries will appear here as admin actions are recorded." : "Try adjusting your filters."}
            compact
          />
        ) : filtered.map((a,i)=>(
          <div key={a.id} style={{ padding:'15px 22px',borderBottom:i<filtered.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'flex-start',gap:14,transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <div style={{ width:9,height:9,borderRadius:'50%',background:catColor[a.category]||'var(--gray-400)',flexShrink:0,marginTop:5 }} />
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3 }}>
                <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{a.action}</span>
                <span style={{ fontSize:9,fontWeight:700,color:catColor[a.category]||'var(--gray-400)',background:`${catColor[a.category]||'#ccc'}18`,padding:'2px 6px',borderRadius:3,letterSpacing:'0.08em',textTransform:'uppercase' }}>{a.category}</span>
              </div>
              <div style={{ fontSize:12,color:'var(--gray-600)',marginBottom:3 }}>{a.target}</div>
              <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
                <span style={{ fontSize:11,color:'var(--gray-400)' }}>
                  By: <strong style={{ color:'var(--navy)' }}>{a.admin}</strong>
                </span>
                <span style={{ fontSize:9,fontWeight:700,color:ROLE_COLORS[a.role]||'var(--gray-400)',background:`${ROLE_COLORS[a.role]||'#ccc'}15`,padding:'2px 7px',borderRadius:4,letterSpacing:'0.06em',textTransform:'uppercase' }}>{a.role?.replace('_',' ')}</span>
                {a.ip && <span style={{ fontSize:10,color:'var(--gray-400)',fontFamily:'monospace' }}>IP: {a.ip}</span>}
              </div>
            </div>
            <div style={{ fontSize:11,color:'var(--gray-400)',flexShrink:0,textAlign:'right',display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap' }}>
              <Clock size={11}/>{a.time}
            </div>
          </div>
        ))}
        {filtered.length > 0 && (
          <div style={{ padding:'10px 22px',borderTop:'1px solid var(--gray-100)',fontSize:11,color:'var(--gray-400)' }}>
            Showing {filtered.length} of {auditLog.length} entries
          </div>
        )}
      </div>
    </div>
  );
}
