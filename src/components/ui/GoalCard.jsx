import React from 'react';
import { Target, CheckCircle } from 'lucide-react';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

/**
 * GoalCard — displays a single investment goal with progress bar.
 *
 * Props:
 *   goal   — goal object { id, name, icon (component), target, saved, color, deadline, plan }
 */
export default function GoalCard({ goal }) {
  const Icon     = goal.icon || Target;
  const progress = Math.min((goal.saved / goal.target) * 100, 100);
  const remaining = goal.target - goal.saved;
  const done     = progress >= 100;

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
      <div style={{ height: 4, background: goal.color }} />
      <div style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `${goal.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {done
              ? <CheckCircle size={18} color={goal.color} />
              : <Icon size={18} color={goal.color} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'var(--navy)', marginBottom: 1 }}>
              {goal.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
              Target: {goal.deadline} · {goal.plan}
            </div>
          </div>
          {done && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--green)', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 4,
            }}>
              Complete
            </span>
          )}
        </div>

        {/* Amounts */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{fmt(goal.saved)}</span>
          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{fmt(goal.target)}</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: goal.color, borderRadius: 4,
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: goal.color }}>
            {Math.round(progress)}% funded
          </span>
          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
            {done ? 'Goal reached!' : `${fmt(remaining)} remaining`}
          </span>
        </div>
      </div>
    </div>
  );
}
