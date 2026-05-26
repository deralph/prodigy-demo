import React, { useState } from 'react';
import { MessageCircle, Mail, Phone, X, HeadphonesIcon } from 'lucide-react';

export default function ContactButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 999,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--navy)', color: 'white',
          border: '2px solid var(--gold)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(13,27,53,0.35)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,27,53,0.45)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,27,53,0.35)'; }}
        title="Contact Support"
      >
        {open ? <X size={20}/> : <HeadphonesIcon size={20}/>}
      </button>

      {/* Pop-up panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 28, zIndex: 998,
          background: 'white', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(13,27,53,0.22)',
          border: '1px solid var(--gray-200)',
          width: 280, overflow: 'hidden',
          animation: 'contactIn 0.22s ease',
        }}>
          <div style={{ background: 'var(--navy)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <HeadphonesIcon size={16} color="var(--gold)"/>
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, color: 'white' }}>Contact & Support</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>We're here to help</div>
            </div>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: Mail,           label: 'Email Support',  sub: 'support@prodigyfinance.ng', href: 'mailto:support@prodigyfinance.ng', bg: 'rgba(59,130,246,0.08)', color: '#3b82f6' },
              { icon: MessageCircle,  label: 'WhatsApp Chat',  sub: '09163629178',                href: 'https://wa.me/2349163629178',     bg: 'rgba(34,197,94,0.08)',  color: '#22c55e' },
              { icon: Phone,          label: 'Call Us',        sub: '09163629178',                href: 'tel:+2349163629178',              bg: 'rgba(13,27,53,0.05)',   color: 'var(--navy)' },
            ].map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: c.bg, borderRadius: 10, textDecoration: 'none', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <c.icon size={16} color="white"/>
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', marginBottom: 1 }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{c.sub}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes contactIn {
          from { opacity:0; transform:translateY(10px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
      `}</style>
    </>
  );
}
