import React from 'react';

const PRODUCTS = [
  { name: 'Prodigy Flexi Loan',          desc: 'Flexible repayment terms and competitive rates' },
  { name: 'Prodigy Liquidity Note',       desc: 'High liquidity with fixed returns' },
  { name: 'Prodigy Vantage (FX Note)',    desc: 'Foreign exchange opportunities' },
  { name: 'Prodigy Lite (Advisory)',      desc: 'Professional financial guidance' },
];

const BESPOKE = [
  { name: 'Prodigy Genesis', desc: 'Premium investment portfolio' },
  { name: 'Prodigy Aura',    desc: 'Elite wealth management' },
  { name: 'Prodigy Apex',    desc: 'Pinnacle investment experience' },
  { name: 'Prodigy',         desc: 'Ultimate financial mastery' },
];

function ProductList({ title, items }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid var(--gray-200)' }}>
      <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 18, color: '#3b6ef8', marginBottom: 24 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(p => (
          <div key={p.name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b6ef8', marginTop: 5, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)', marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * LandingProducts — products & bespoke grid section.
 */
export default function LandingProducts() {
  return (
    <section style={{ padding: 'clamp(48px,8vh,80px) 48px', background: 'var(--gray-50)' }}>
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(28px,4vw,40px)', textAlign: 'center', marginBottom: 48, color: 'var(--navy)' }}>Our Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
        <ProductList title="Products & Services"   items={PRODUCTS} />
        <ProductList title="Bespoke Products"      items={BESPOKE} />
      </div>
    </section>
  );
}
