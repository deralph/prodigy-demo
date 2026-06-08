import React from 'react';
import { Loader } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import useAppStore from '../../store/useAppStore';

/**
 * DataTable — universal styled table with mapped columns and rows.
 *
 * Props:
 *   columns  — array of { key, label, render?: (val, row) => JSX, style?: {} }
 *   rows     — array of data objects
 *   onRow    — (row) => void — hover/click handler (optional)
 *   emptyMsg — text when rows is empty (optional)
 *   stickyHeader — boolean (optional)
 */
export default function DataTable({ columns = [], rows = [], onRow, emptyMsg = 'No data available.', stickyHeader = false }) {
  const isLoading = useAppStore(s => s.isLoadingData);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: stickyHeader ? 'sticky' : 'static', top: 0, zIndex: 1 }}>
          <tr style={{ background: 'var(--gray-50)' }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '10px 18px', textAlign: 'left',
                fontSize: 10, fontWeight: 700, color: 'var(--gray-400)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                whiteSpace: 'nowrap', ...col.headerStyle,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                {isLoading
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></span>
                  : emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id || row.ref || i}
                style={{ borderTop: '1px solid var(--gray-100)', transition: 'background 0.15s', cursor: onRow ? 'pointer' : 'default' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => onRow?.(row)}
              >
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '13px 18px', ...col.style }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
