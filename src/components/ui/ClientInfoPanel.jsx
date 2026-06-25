import React from 'react';
import { CheckCircle, Ban, Users } from 'lucide-react';
import DetailRow from './DetailRow';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const HOLDER_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6'];

/**
 * ClientInfoPanel — read-only client info tab used in admin modals.
 * For joint accounts shows BOTH holders' name, email, phone, and KYC status.
 */
export default function ClientInfoPanel({ client: c, onApproveKyc, onFlagSuspend }) {
  const isJoint = c.type?.toLowerCase() === 'joint';

  // Build per-holder objects. Admin findOne returns the raw Client row, so we
  // merge the primary (top-level) and secondary (secondary*) fields into a
  // uniform list. If the admin's client map has a .holders array already, use it.
  const holders = Array.isArray(c.holders) && c.holders.length > 0
    ? c.holders
    : isJoint
      ? [
          { name: c.name,          email: c.email,          phone: c.phone,          label: 'Primary Holder',   kyc: c.kyc },
          { name: c.secondaryName || '—', email: c.secondaryEmail || '—', phone: c.secondaryPhone || '—', label: 'Secondary Holder', kyc: c.kycSecondary || c.kyc },
        ]
      : [];

  return (
    <div>
      {/* ── Base fields (common to all account types) ── */}
      <DetailRow label="Account ID"      value={c.clientId || c.clientRef || '—'} />
      <DetailRow label="Account Type"    value={c.type?.toUpperCase() || '—'} />
      <DetailRow label="Account Status"  value={c.status} />
      <DetailRow label="KYC Status"      value={c.kyc} />
      {isJoint && <DetailRow label="Mandate Type"   value={c.mandateType || 'AND'} />}
      <DetailRow label="Wallet Balance"  value={fmt(c.balance)} />
      <DetailRow label="Joined"          value={c.joined} />

      {/* ── For joint accounts: full detail card per holder ── */}
      {isJoint && holders.length > 0 && (
        <div style={{ marginTop: 18, borderTop: '1px solid var(--gray-100)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Users size={13} color="var(--gray-400)" />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Account Holders</span>
          </div>
          {holders.map((h, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', marginBottom: 10, border: `1.5px solid ${HOLDER_COLORS[i % HOLDER_COLORS.length]}22` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${HOLDER_COLORS[i % HOLDER_COLORS.length]}18`, border: `2px solid ${HOLDER_COLORS[i % HOLDER_COLORS.length]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, color: HOLDER_COLORS[i % HOLDER_COLORS.length] }}>
                  {(h.name || '?').charAt(0)}
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)' }}>{h.label}</div>
                </div>
              </div>
              <DetailRow label="Name"   value={h.name  || '—'} compact />
              <DetailRow label="Email"  value={h.email || '—'} compact />
              <DetailRow label="Phone"  value={h.phone || '—'} compact />
              <DetailRow label="KYC"    value={h.kyc   || 'pending'} compact noBorder />
            </div>
          ))}
        </div>
      )}

      {/* ── For individual / corporate: single holder summary ── */}
      {!isJoint && (
        <>
          <DetailRow label="Email"   value={c.email   || '—'} />
          <DetailRow label="Phone"   value={c.phone   || '—'} />
          <DetailRow label="Address" value={c.address || '—'} />
        </>
      )}

      {/* ── Admin action buttons ── */}
      {(onApproveKyc || onFlagSuspend) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {onApproveKyc && (
            <button onClick={onApproveKyc} style={{ flex: 1, background: 'var(--green)', color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 8, padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <CheckCircle size={13} /> Approve KYC
            </button>
          )}
          {onFlagSuspend && (
            <button onClick={onFlagSuspend} style={{ flex: 1, background: 'var(--red)', color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 8, padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ban size={13} /> Flag & Suspend
            </button>
          )}
        </div>
      )}
    </div>
  );
}
