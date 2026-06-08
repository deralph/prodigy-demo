import React from 'react';
import useAppStore from '../../store/useAppStore';

export default function LoadingOverlay() {
  const isLoadingData = useAppStore(s => s.isLoadingData);
  if (!isLoadingData) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: 3, background: 'var(--gray-200)', overflow: 'hidden',
    }}>
      <div style={{
        width: '40%', height: '100%',
        background: 'linear-gradient(90deg, var(--gold), var(--navy))',
        animation: 'loadbar 1.2s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes loadbar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
