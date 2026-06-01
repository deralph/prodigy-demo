import React, { useState } from 'react';
import { User, Mail, Phone, Building2, Shield, Calendar, LogOut, Key, AlertTriangle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import ProfileHero from '../../components/ui/ProfileHero';
import AccountInfoCard from '../../components/ui/AccountInfoCard';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const ROLE_BADGE = {
  individual: { label:'Individual', color:'#3b82f6', bg:'rgba(59,130,246,0.1)' },
  corporate:  { label:'Corporate',  color:'#8b5cf6', bg:'rgba(139,92,246,0.1)' },
  joint:      { label:'Joint',      color:'#22c55e', bg:'rgba(34,197,94,0.1)'  },
  admin:      { label:'Admin',      color:'var(--gold)', bg:'rgba(232,184,75,0.12)' },
};

/* ── Portfolio summary card ── */
function PortfolioSummaryCard({ walletBalance, totalAUM, activeCount, totalCount }) {
  const rows = [
    ['Wallet Balance',    fmt(walletBalance)],
    ['Total Invested',    fmt(totalAUM)],
    ['Active Investments', activeCount],
    ['Total Products',    totalCount],
  ];
  return (
    <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-2">
      <div style={{ padding:'13px 20px',borderBottom:'1px solid var(--gray-100)',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--navy)',display:'flex',alignItems:'center',gap:7 }}>
        <Shield size={13}/> Portfolio Summary
      </div>
      {rows.map(([label, val]) => (
        <div key={label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid var(--gray-50)' }}>
          <span style={{ fontSize:12,color:'var(--gray-400)' }}>{label}</span>
          <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Joint holders card ── */
function JointHoldersCard({ holders }) {
  if (!holders?.length) return null;
  const colors = ['#3b82f6','#22c55e','#8b5cf6'];
  return (
    <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
      <div style={{ padding:'13px 20px',borderBottom:'1px solid var(--gray-100)',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--navy)',display:'flex',alignItems:'center',gap:7 }}>
        <Shield size={13}/> Account Holders
      </div>
      {holders.map((h, i) => (
        <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:i<holders.length-1?'1px solid var(--gray-50)':'none' }}>
          <div style={{ width:32,height:32,borderRadius:'50%',background:`${colors[i]||'#64748b'}18`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:colors[i]||'#64748b',flexShrink:0 }}>
            {(h.name||'?').charAt(0)}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:12,fontWeight:600,color:'var(--navy)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.name}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)' }}>{i===0?'Primary Holder':'Secondary Holder'} · {h.email||'—'}</div>
          </div>
          <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',color:h.kycComplete?'var(--green)':'var(--gold)',background:h.kycComplete?'rgba(34,197,94,0.1)':'rgba(232,184,75,0.12)',padding:'3px 8px',borderRadius:4 }}>
            {h.kycComplete?'KYC ✓':'KYC Pending'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, clients, clientInvestments, logout, walletBalance } = useAppStore();
  const client  = clients.find(c => c.clientId === user?.clientId) || user?.client || {};
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(user?.clientId || user?.id || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const isJoint     = user?.role === 'joint';
  const isCorporate = user?.role === 'corporate';
  const roleBadge   = ROLE_BADGE[user?.role] || { label: user?.role||'User', color:'var(--navy)', bg:'rgba(13,27,53,0.08)' };
  const totalAUM      = clientInvestments.reduce((s,i) => s + (i.principalAmount||i.amount||0), 0);
  const activeCount   = clientInvestments.filter(i => i.status==='active').length;

  const holders = client?.holders?.length > 0
    ? client.holders
    : isJoint && user?.name
      ? [{ name:user.name, email:user.email, kycComplete:false }, ...(user.secondaryName ? [{ name:user.secondaryName, email:user.secondaryEmail||'—', kycComplete:false }] : [])]
      : [];

  const accountInfoRows = [
    { icon:Mail,      label:'Email',          val: user?.email },
    { icon:Phone,     label:'Phone',          val: user?.phone || client?.phone },
    { icon:Calendar,  label:'Account Type',   val: roleBadge.label },
    { icon:Shield,    label:'Account Status', val: user?.isActive===false?'Suspended':'Active' },
    ...(isCorporate ? [
      { icon:Building2, label:'Entity Name', val: user?.name },
      { icon:Key,       label:'RC Number',   val: user?.rcNumber || client?.rcNumber },
      { icon:Phone,     label:'Tax ID',      val: user?.taxId    || client?.taxId },
    ] : []),
    ...(isJoint ? [{ icon:Key, label:'Mandate', val: user?.mandateType||client?.mandateType||'AND' }] : []),
  ];

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Account details & preferences" />

      <ProfileHero user={user} totalAUM={totalAUM} activeCount={activeCount} roleBadge={roleBadge} copied={copied} onCopy={copyId} />

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:18,marginBottom:22 }}>
        <AccountInfoCard title="Account Information" icon={User} rows={accountInfoRows} />
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <PortfolioSummaryCard walletBalance={walletBalance} totalAUM={totalAUM} activeCount={activeCount} totalCount={clientInvestments.length} />
          <JointHoldersCard holders={isJoint ? holders : []} />
        </div>
      </div>

      <div style={{ background:'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:14,padding:'18px 22px' }} className="animate-in delay-3">
        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--red)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14,display:'flex',alignItems:'center',gap:7 }}>
          <AlertTriangle size={13}/> Session & Security
        </div>
        <button onClick={logout} style={{ display:'flex',alignItems:'center',gap:8,padding:'11px 22px',background:'rgba(239,68,68,0.08)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
        >
          <LogOut size={14}/> Sign Out
        </button>
      </div>
    </div>
  );
}
