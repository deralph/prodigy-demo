import React from 'react';
import { CheckCircle, Lock } from 'lucide-react';

/**
 * AccountCreatedScreen — success screen shown after account registration.
 *
 * Props:
 *   title       — heading text
 *   onContinue  — () => void — called when "Proceed to Login" is clicked
 *   unlocked    — array of strings — things immediately available
 *   locked      — array of strings — things locked until KYC
 *   extraContent — JSX shown between title and unlocked list (optional)
 *   note        — string shown below locked list (optional)
 */
export default function AccountCreatedScreen({ title, onContinue, unlocked = [], locked = [], extraContent, note }) {
  return (
    <div className="animate-in" style={{ textAlign: 'center', padding: '20px 0' }}>
      <CheckCircle size={48} color="var(--green)" style={{ marginBottom: 14 }} />
      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--navy)', marginBottom: 8 }}>{title}</div>

      {extraContent}

      {unlocked.length > 0 && (
        <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '14px', marginBottom: 14, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 7 }}>You can immediately:</div>
          {unlocked.map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--navy)', marginBottom: 4 }}>
              <CheckCircle size={11} color="var(--green)" /> {item}
            </div>
          ))}
          {locked.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginTop: 10, marginBottom: 6 }}>Locked until full KYC approval:</div>
              {locked.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--red)', marginBottom: 4 }}>
                  <Lock size={11} /> {item}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {note && <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20 }}>{note}</p>}

      <button
        onClick={onContinue}
        style={{ background: 'var(--navy)', color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer' }}
      >
        PROCEED TO LOGIN
      </button>
    </div>
  );
}
