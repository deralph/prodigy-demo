import React from 'react';
import { Search } from 'lucide-react';

/**
 * SearchFilterBar — search input + one or more select filters.
 *
 * Props:
 *   search        — search string value
 *   onSearch      — (value) => void
 *   placeholder   — search input placeholder (optional)
 *   filters       — array of { label, value, set, options: [{value, label}] }
 *   className     — extra class name (optional)
 *   style         — extra outer styles (optional)
 */
export default function SearchFilterBar({ search, onSearch, placeholder = 'Search…', filters = [], className, style: extraStyle = {} }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        ...extraStyle,
      }}
    >
      {/* Search input */}
      {onSearch && (
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search
            size={14}
            color="var(--gray-400)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={e => onSearch(e.target.value)}
            style={{
              width: '100%', border: '1px solid var(--gray-200)', borderRadius: 9,
              padding: '10px 12px 10px 36px',
              fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none', background: 'white',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--navy)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
          />
        </div>
      )}

      {/* Select filters */}
      {filters.map(f => (
        <div key={f.label} style={{ position: 'relative' }}>
          <select
            value={f.value}
            onChange={e => f.set(e.target.value)}
            style={{
              border: '1px solid var(--gray-200)', borderRadius: 9,
              padding: '10px 32px 10px 12px',
              fontFamily: 'DM Sans,sans-serif', fontSize: 13,
              outline: 'none', background: 'white', appearance: 'none', cursor: 'pointer',
            }}
          >
            {f.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none',
            color: 'var(--gray-400)', fontSize: 11,
          }}>▾</span>
        </div>
      ))}
    </div>
  );
}
