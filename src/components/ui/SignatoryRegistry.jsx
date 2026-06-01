import React from 'react';
import { Calendar } from 'lucide-react';
import EmptyState from '../EmptyState';
import { Users } from 'lucide-react';

/**
 * SignatoryRegistry — director/signatory list used in corporate/KYC.
 *
 * Props:
 *   directors — array of { name, role, expiry, avatar }
 */
export default function SignatoryRegistry({ directors = [] }) {
  return (
    <div className="card animate-in delay-1" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>✍️</span>
        <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Director & Signatory Identity Registry
        </h3>
        <span className="badge-verified" style={{ marginLeft: 'auto' }}>Status: Verified</span>
      </div>
      <div style={{ padding: '8px 0' }}>
        {directors.length === 0
          ? <EmptyState icon={Users} title="No signatories on record" message="Registered directors and signatories will appear here after KYC approval." />
          : directors.map((d, i) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: i < directors.length - 1 ? '1px solid var(--gray-100)' : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'Syne,sans-serif', flexShrink: 0 }}>
                {d.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 2 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.role}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Expiry Date</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                  <Calendar size={12} color="var(--gray-400)" />{d.expiry}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
