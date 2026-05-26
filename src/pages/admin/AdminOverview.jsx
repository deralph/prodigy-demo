import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, CheckSquare, CreditCard, ArrowRight } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import useAppStore, { ADMIN_PERMISSIONS, ROLE_LABELS } from '../../store/useAppStore';

const StatCard = ({ label, value, sub, color, icon:Icon, onClick }) => (
  <div onClick={onClick} style={{
    background:'white', borderRadius:12, padding:'20px 22px',
    border:'1px solid var(--gray-200)', cursor: onClick?'pointer':'default',
    transition:'all 0.2s', position:'relative', overflow:'hidden',
  }}
    onMouseEnter={e=>{ if(onClick){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(13,27,53,0.1)'; }}}
    onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
  >
    <div style={{ position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:`${color}12`,pointerEvents:'none' }} />
    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14 }}>
      <div style={{ width:38,height:38,borderRadius:10,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center' }}>
        <Icon size={18} color={color} strokeWidth={1.8} />
      </div>
      {onClick && <ArrowRight size={14} color="var(--gray-400)" />}
    </div>
    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:26,color:'var(--navy)',marginBottom:4 }}>{value}</div>
    <div style={{ fontSize:11,fontWeight:600,color:'var(--gray-600)' }}>{label}</div>
    {sub && <div style={{ fontSize:10,color:color,fontWeight:600,marginTop:4 }}>{sub}</div>}
  </div>
);

export default function AdminOverview() {
  const { clients, approvals, allTransactions, user } = useAppStore();
  const navigate = useNavigate();
  const pending = approvals.filter(a => a.status === 'pending');
  const totalAUM = clients.reduce((s,c) => s+c.balance, 0);

  const recentTxns = [...allTransactions]
    .sort((a,b) => new Date(b.createdAt||b.date||0) - new Date(a.createdAt||a.date||0))
    .slice(0, 5);
  const typeColors = { wallet_funding:'#3b82f6', subscription:'#22c55e', redemption:'#ef4444', withdrawal:'#f97316' };

  return (
    <div>
      <div style={{ marginBottom:28 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(20px,3vw,26px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>
          Admin Overview
        </h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>
          Prodigy Corporate System · Real-Time Dashboard
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:28 }}>
        <StatCard label="Total Clients" value={clients.length} sub={`${clients.filter(c=>c.status==='pending').length} pending verification`} color="#3b82f6" icon={Users} onClick={()=>navigate('/admin/clients')} />
        <StatCard label="Total AUM" value={`₦${(totalAUM/1000000).toFixed(1)}M`} sub="Across all portfolios" color="#22c55e" icon={TrendingUp} />
        <StatCard label="Pending Approvals" value={pending.length} sub="Requires action" color="#ef4444" icon={CheckSquare} onClick={()=>navigate('/admin/approvals')} />
        <StatCard label="Total Transactions" value={allTransactions.length} sub={allTransactions.length > 0 ? 'View ledger' : 'None yet'} color="#e8b84b" icon={CreditCard} onClick={()=>navigate('/admin/transactions')} />
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:24,alignItems:'start' }}>
        {/* Pending approvals */}
        <div className="animate-in delay-2" style={{ background:'white',borderRadius:14,padding:0,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
          <div style={{ padding:'18px 22px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Approvals Queue</h3>
            <button onClick={()=>navigate('/admin/approvals')} style={{ fontSize:11,color:'#3b82f6',background:'none',border:'none',cursor:'pointer',fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:4 }}>
              View All <ArrowRight size={12}/>
            </button>
          </div>
          <div>
            {pending.length === 0 ? (
              <EmptyState icon={CheckSquare} compact title="All clear" message="No pending approvals at this time." />
            ) : pending.slice(0,4).map(a => (
              <div key={a.id} style={{ padding:'14px 22px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:14,transition:'background 0.15s',cursor:'pointer' }}
                onClick={()=>navigate('/admin/approvals')}
                onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <div style={{ width:34,height:34,borderRadius:8,background:a.type==='kyc'?'rgba(139,92,246,0.1)':a.type==='subscription'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  {a.type==='kyc'?'📋':a.type==='subscription'?'📈':a.type==='loan'?'💼':'🔄'}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:600,color:'var(--navy)',marginBottom:2 }}>{a.client||a.clientName}</div>
                  <div style={{ fontSize:11,color:'var(--gray-400)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{a.detail||a.details}</div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:a.priority==='high'?'var(--red)':a.priority==='medium'?'var(--gold)':'var(--gray-400)',background:a.priority==='high'?'rgba(239,68,68,0.1)':a.priority==='medium'?'rgba(232,184,75,0.12)':'var(--gray-100)',padding:'3px 7px',borderRadius:4 }}>
                    {a.priority||'—'}
                  </span>
                  <div style={{ fontSize:10,color:'var(--gray-400)',marginTop:3 }}>{a.date||a.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="animate-in delay-3" style={{ background:'white',borderRadius:14,padding:0,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
          <div style={{ padding:'18px 22px',borderBottom:'1px solid var(--gray-100)' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Recent Transactions</h3>
          </div>
          <div>
            {recentTxns.length === 0 ? (
              <EmptyState icon={CreditCard} compact title="No transactions yet" message="Transactions will appear here once clients begin activity." />
            ) : recentTxns.map((t,i) => (
              <div key={t.id||i} style={{ padding:'12px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:typeColors[t.type]||'#94a3b8',flexShrink:0 }} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)' }}>{t.client||t.clientName||'—'}</div>
                  <div style={{ fontSize:11,color:'var(--gray-400)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{t.type} {t.amount ? `· ₦${Number(t.amount).toLocaleString()}` : ''}</div>
                </div>
                <div style={{ fontSize:10,color:'var(--gray-400)',flexShrink:0 }}>{t.date||t.createdAt||'—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 340px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
