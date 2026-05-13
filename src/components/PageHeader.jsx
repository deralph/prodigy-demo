import React from 'react';

export default function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }} className="animate-in">
      <h1 style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 800,
        fontSize: 'clamp(20px, 3vw, 28px)', color: 'var(--navy)',
        letterSpacing: '0.02em', textTransform: 'uppercase',
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{
          fontSize: 10, letterSpacing: '0.14em', color: 'var(--gray-400)',
          textTransform: 'uppercase', marginTop: 4,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
