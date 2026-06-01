import React from 'react';

/**
 * SectionCard — a white rounded card container with optional header.
 *
 * Props:
 *   title        — card header title text (optional)
 *   titleAction  — JSX to render on the right side of the header (optional)
 *   children     — card body content
 *   noPadding    — suppress body padding (optional)
 *   style        — extra styles on the outer container (optional)
 *   className    — extra class name (optional)
 */
export default function SectionCard({ title, titleAction, children, noPadding = false, style: extraStyle = {}, className }) {
  return (
    <div
      className={className}
      style={{
        background: 'white',
        borderRadius: 14,
        border: '1px solid var(--gray-200)',
        overflow: 'hidden',
        ...extraStyle,
      }}
    >
      {title && (
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{
            fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13,
            color: 'var(--navy)', letterSpacing: '0.06em', textTransform: 'uppercase',
            margin: 0,
          }}>
            {title}
          </h3>
          {titleAction && <div>{titleAction}</div>}
        </div>
      )}
      <div style={{ padding: noPadding ? 0 : '20px 22px' }}>
        {children}
      </div>
    </div>
  );
}
