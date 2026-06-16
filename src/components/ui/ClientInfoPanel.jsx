import React from 'react';
import { CheckCircle, Ban } from 'lucide-react';
import DetailRow from './DetailRow';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

/**
 * ClientInfoPanel — read-only client info tab content.
 * Used inside ClientManagement and AdminReports modals.
 *
 * Props:
 *   client     — client object
 *   onApproveKyc — () => void (optional)
 *   onFlagSuspend — () => void (optional)
 */
export default function ClientInfoPanel({ client: c, onApproveKyc, onFlagSuspend }) {
  const holderRows = Array.isArray(c.holders) && c.holders.length > 0
    ? c.holders
    : c.secondaryName
      ? [
          { name: c.name, email: c.email, kyc: c.kyc },
          { name: c.secondaryName, email: c.secondaryEmail || '—', kyc: c.kyc },
        ]
      : [];

  const fields = [
    ['Email',           c.email],
    ['Phone',           c.phone || '—'],
    ['Address',         c.address || '—'],
    ['Account Type',    c.type?.toUpperCase()],
    ['KYC Status',      c.kyc],
    ['Account Status',  c.status],
    ['Wallet Balance',  fmt(c.balance)],
    ['Joined',          c.joined],
    ['Mandate',         c.mandateType || '—'],
    ...holderRows.flatMap((h, i) => [
      [`Holder ${i + 1} Name`,  h.name || '—'],
      [`Holder ${i + 1} Email`, h.email || '—'],
      [`Holder ${i + 1} KYC`,   h.kyc || h.kycStatus || 'pending'],
    ]),
  ];

  return (
    <div>
      {fields.map(([l, v], i) => (
        <DetailRow key={l} label={l} value={v} noBorder={i === fields.length - 1 && !onApproveKyc && !onFlagSuspend} />
      ))}
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
