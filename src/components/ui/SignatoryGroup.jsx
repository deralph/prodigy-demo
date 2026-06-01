import React from 'react';
import EmptyState from '../EmptyState';
import { Users } from 'lucide-react';

/**
 * SignatoryGroup — shows a mandate group column of signatories with status badges.
 * Used in Audit.jsx (root) and corporate/Audit.jsx.
 *
 * Props:
 *   title     — column heading (e.g. "Group A Signatories")
 *   members   — array of { name, signed: bool }
 *   emptyLabel — label for EmptyState when members is empty
 */
export default function SignatoryGroup({ title, members = [], emptyLabel = 'No signatories' }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:14 }}>
        {title}
      </div>
      {members.length === 0
        ? <EmptyState icon={Users} title={emptyLabel} compact />
        : members.map(s => (
          <div key={s.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--navy)' }}>{s.name}</span>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:s.signed?'var(--green)':'var(--gold)', background:s.signed?'rgba(34,197,94,0.1)':'rgba(232,184,75,0.1)', padding:'3px 8px', borderRadius:4 }}>
              {s.signed ? 'Verified' : 'Pending'}
            </span>
          </div>
        ))
      }
    </div>
  );
}
