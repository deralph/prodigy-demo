import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, FileText, TrendingUp, Wallet, BadgeCheck } from 'lucide-react';
import { auditPortalApi } from '../services/api';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AuditPortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [data, setData]     = useState(null);

  useEffect(() => {
    if (!token) { setError('No audit token provided in the URL.'); setLoading(false); return; }
    auditPortalApi.verify(token)
      .then(d => setData(d))
      .catch(e => setError(e?.message || 'Failed to verify audit token.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
        <div style={{ textAlign: 'center' }}>
          <Shield size={40} color="var(--gold)" style={{ marginBottom: 16 }} />
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'white' }}>Verifying Audit Portal...</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Please wait while we validate your access token.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)', padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%', background: 'white', borderRadius: 14, padding: 28, textAlign: 'center' }}>
          <AlertTriangle size={36} color="var(--red)" style={{ marginBottom: 14 }} />
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>Access Denied</h2>
          <p style={{ fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.6, marginBottom: 20 }}>{error}</p>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 8 }}>
            If you believe this is an error, please contact your corporate relationship manager at Prodigy Finance.
          </div>
        </div>
      </div>
    );
  }

  const { client, investments, walletBalanceKobo, kycStatus } = data;
  const totalPrincipal = investments.reduce((s, i) => s + (i.principalKobo || 0), 0) / 100;
  const activeCount    = investments.filter(i => i.status === 'active').length;
  const pendingCount   = investments.filter(i => i.status === 'pending_approval').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>External Audit Portal</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'white' }}>{client.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Client Ref: {client.clientRef} · Type: {client.type}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: 8 }}>
          <BadgeCheck size={16} color="var(--green)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Verified Audit Access</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px' }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { icon: Wallet, label: 'Wallet Balance', value: fmt(walletBalanceKobo / 100), color: '#3b6ef8' },
            { icon: TrendingUp, label: 'Total Principal', value: fmt(totalPrincipal), color: '#22c55e' },
            { icon: CheckCircle, label: 'Active Investments', value: activeCount, color: '#22c55e' },
            { icon: FileText, label: 'Pending Investments', value: pendingCount, color: 'var(--gold)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <s.icon size={14} color={s.color} />
                <span style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* KYC Status */}
        <div style={{ background: 'white', borderRadius: 12, padding: '18px 22px', border: '1px solid var(--gray-200)', marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 12 }}>KYC & Account Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
            {[
              { label: 'Account Status', value: client.status },
              { label: 'KYC Status', value: kycStatus },
              { label: 'Email', value: client.email },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Investments table */}
        <div style={{ background: 'white', borderRadius: 12, padding: '18px 22px', border: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>Investment Registry</div>
          {investments.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', padding: '20px 0' }}>No investments on record.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)' }}>
                    {['Reference', 'Product', 'Principal', 'ROI', 'Tenor', 'Status', 'Value Date', 'Maturity Date'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv, idx) => (
                    <tr key={inv.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>{inv.investRef}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--navy)' }}>{inv.productName}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--navy)' }}>{fmt(inv.principalKobo / 100)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{inv.roiRate}%</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--navy)' }}>{inv.tenorDays} days</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: inv.status === 'active' ? 'rgba(34,197,94,0.1)' : inv.status === 'pending_approval' ? 'rgba(232,184,75,0.1)' : 'rgba(239,68,68,0.1)', color: inv.status === 'active' ? 'var(--green)' : inv.status === 'pending_approval' ? 'var(--gold)' : 'var(--red)' }}>
                          {inv.status === 'pending_approval' ? 'Pending' : inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-600)' }}>{fmtDate(inv.valueDate)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-600)' }}>{fmtDate(inv.maturityDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 10, color: 'var(--gray-400)', paddingBottom: 32 }}>
          This report is generated for external audit purposes only. Data is read-only and one-time access.<br/>
          Prodigy Finance Limited · Confidential
        </div>
      </div>
    </div>
  );
}
