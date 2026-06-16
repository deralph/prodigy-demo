import React, { useState } from 'react';
import { User, Mail, Phone, Building2, Shield, Calendar, LogOut, Key, AlertTriangle } from 'lucide-react';
import useAppStore, { getJointHolders } from '../../store/useAppStore';
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
        <Shield size={13}/> Joint Account Signatories
      </div>
      {holders.map((h, i) => (
        <div key={i} style={{ display:'grid',gridTemplateColumns:'auto 1fr',gap:12,padding:'16px 20px',borderBottom:i<holders.length-1?'1px solid var(--gray-50)':'none',alignItems:'center' }}>
          <div style={{ width:44,height:44,borderRadius:'50%',background:`${colors[i]||'#64748b'}18`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:colors[i]||'#64748b',flexShrink:0 }}>
            {(h.name||'?').charAt(0)}
          </div>
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:'var(--navy)' }}>{h.name}</div>
            <div style={{ fontSize:10,color:'var(--gray-500)',marginBottom:8 }}>{h.role}</div>
            <div style={{ display:'grid',gridTemplateColumns:'auto 1fr',gap:'8px 12px',fontSize:11,color:'var(--gray-500)' }}>
              <span style={{ fontWeight:700,color:'var(--navy)' }}>Email</span><span>{h.email || '—'}</span>
              {h.phone && <><span style={{ fontWeight:700,color:'var(--navy)' }}>Phone</span><span>{h.phone}</span></>}
              <span style={{ fontWeight:700,color:'var(--navy)' }}>KYC</span><span>{h.kycComplete ? 'Verified' : 'Pending Review'}</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ padding:'14px 20px',fontSize:11,color:'var(--gray-500)',background:'rgba(249,250,251,1)' }}>
        All holders are shown here equally. Each signatory may review their KYC status and account details.
      </div>
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

  const holders = getJointHolders(client, user).map((holder, idx) => ({
    ...holder,
    role: idx === 0 ? 'Primary Holder' : idx === 1 ? 'Secondary Holder' : `Holder ${idx + 1}`,
    kycComplete: client?.kycRecord?.status === 'APPROVED',
  }));

  const statusLabel = client?.status
    ? client.status === 'verified' ? 'Verified'
    : client.status === 'suspended' ? 'Suspended'
    : client.status.charAt(0).toUpperCase() + client.status.slice(1)
    : user?.isActive === false ? 'Suspended' : 'Active';

  const accountInfoRows = [
    { icon:Mail,      label:'Email',          val: user?.email || client?.email },
    { icon:Phone,     label:'Phone',          val: user?.phone || client?.phone },
    { icon:Calendar,  label:'Account Type',   val: roleBadge.label },
    { icon:Shield,    label:'Account Status', val: statusLabel },
    ...(isCorporate ? [
      { icon:Building2, label:'Entity Name', val: user?.name || client?.name },
      { icon:Key,       label:'RC Number',   val: user?.rcNumber || client?.rcNumber },
      { icon:Phone,     label:'Tax ID',      val: user?.taxId    || client?.taxId },
    ] : []),
    ...(isJoint ? [{ icon:Key, label:'Mandate', val: user?.mandateType || client?.mandateType || 'AND' }] : []),
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
