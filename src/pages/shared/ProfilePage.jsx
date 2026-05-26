import React, { useState } from 'react';
import { User, Mail, Phone, Building2, Shield, Calendar, LogOut, Key, Copy, Check, AlertTriangle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

export default function ProfilePage() {
  const { user, clients, clientInvestments, logout, walletBalance } = useAppStore();
  const client = clients.find(c => c.clientId === user?.clientId) || user?.client || {};
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(user?.clientId || user?.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isJoint      = user?.role === 'joint';
  const isCorporate  = user?.role === 'corporate';
  const isIndividual = user?.role === 'individual';

  const holders = client?.holders?.length > 0
    ? client.holders
    : isJoint && user?.name
      ? [
          { name: user.name, email: user.email, kycComplete: false },
          ...(user.secondaryName ? [{ name: user.secondaryName, email: user.secondaryEmail || '—', kycComplete: false }] : []),
        ]
      : [];
  const totalAUM = clientInvestments.reduce((s, i) => s + (i.principalAmount || i.amount || 0), 0);
  const activeInvCount = clientInvestments.filter(i => i.status === 'active').length;

  const roleBadge = {
    individual: { label: 'Individual', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    corporate:  { label: 'Corporate',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    joint:      { label: 'Joint',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
    admin:      { label: 'Admin',      color: 'var(--gold)', bg: 'rgba(232,184,75,0.12)' },
  }[user?.role] || { label: user?.role || 'User', color: 'var(--navy)', bg: 'rgba(13,27,53,0.08)' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }} className="animate-in">
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(18px,3vw,24px)', color: 'var(--navy)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          My Profile
        </h1>
        <p style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
          Account details &amp; preferences
        </p>
      </div>

      {/* Identity card */}
      <div style={{ background: 'var(--navy)', borderRadius: 16, padding: '28px 30px', marginBottom: 22, position: 'relative', overflow: 'hidden' }} className="animate-in delay-1">
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(232,184,75,0.06)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(232,184,75,0.18)', border: '2px solid rgba(232,184,75,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isCorporate
              ? <Building2 size={28} color="var(--gold)" />
              : isJoint
                ? <Shield size={28} color="var(--gold)" />
                : <User size={28} color="var(--gold)" />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(16px,2.5vw,22px)', color: 'white', margin: 0 }}>{user?.name || 'Account Holder'}</h2>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: roleBadge.color, background: roleBadge.bg, padding: '3px 10px', borderRadius: 5 }}>{roleBadge.label}</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{user?.email}</div>
            {(user?.clientId || user?.id) && (
              <button onClick={copyId} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                {copied ? <Check size={11} color="var(--green)" /> : <Copy size={11} />}
                <span style={{ fontFamily: 'DM Mono,monospace' }}>{user?.clientId || user?.id}</span>
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'right' }}>
            {[{ label: 'Total AUM', val: fmt(totalAUM) }, { label: 'Active Products', val: activeInvCount }].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--gold)', marginTop: 2 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 22 }}>
        {/* Contact info */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-2">
          <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--gray-100)', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <User size={13} /> Account Information
          </div>
          {[
            { icon: Mail,      label: 'Email',          val: user?.email || '—' },
            { icon: Phone,     label: 'Phone',          val: user?.phone || client?.phone || '—' },
            { icon: Calendar,  label: 'Account Type',   val: roleBadge.label },
            { icon: Shield,    label: 'Account Status', val: user?.isActive === false ? 'Suspended' : 'Active' },
            ...(isCorporate ? [
              { icon: Building2, label: 'Entity Name', val: user?.name || '—' },
              { icon: Key,       label: 'RC Number',   val: user?.rcNumber || client?.rcNumber || '—' },
              { icon: Phone,     label: 'Tax ID',      val: user?.taxId    || client?.taxId    || '—' },
            ] : []),
            ...(isJoint ? [{ icon: Key, label: 'Mandate', val: user?.mandateType || client?.mandateType || 'AND' }] : []),
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: '1px solid var(--gray-50)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(13,27,53,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color="var(--navy)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 1 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Wallet / investment stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-2">
            <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--gray-100)', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Shield size={13} /> Portfolio Summary
            </div>
            {[
              { label: 'Wallet Balance', val: fmt(walletBalance) },
              { label: 'Total Invested', val: fmt(totalAUM) },
              { label: 'Active Investments', val: activeInvCount },
              { label: 'Total Products', val: clientInvestments.length },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--gray-50)' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{label}</span>
                <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Joint holders panel */}
          {isJoint && holders.length > 0 && (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-3">
              <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--gray-100)', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Shield size={13} /> Account Holders
              </div>
              {holders.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < holders.length - 1 ? '1px solid var(--gray-50)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, color: i === 0 ? '#3b82f6' : 'var(--green)', flexShrink: 0 }}>
                    {(h.name || '?').charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{i === 0 ? 'Primary Holder' : 'Secondary Holder'} · {h.email || '—'}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: h.kycComplete ? 'var(--green)' : 'var(--gold)', background: h.kycComplete ? 'rgba(34,197,94,0.1)' : 'rgba(232,184,75,0.12)', padding: '3px 8px', borderRadius: 4 }}>
                    {h.kycComplete ? 'KYC ✓' : 'KYC Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '18px 22px' }} className="animate-in delay-3">
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--red)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <AlertTriangle size={13} /> Session &amp; Security
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
