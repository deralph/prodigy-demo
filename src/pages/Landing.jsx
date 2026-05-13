import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, Users, Zap, ArrowRight, ChevronRight } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Smart Investments', desc: 'Tailored investment strategies for maximum returns' },
  { icon: Shield, title: 'Secure Platform', desc: 'Bank-level security for your financial data' },
  { icon: Users, title: 'Expert Advisory', desc: 'Professional guidance from financial experts' },
  { icon: Zap, title: 'Fast Processing', desc: 'Quick approval and instant access to services' },
];

const products = [
  { name: 'Prodigy Flexi Loan', desc: 'Flexible repayment terms and competitive rates' },
  { name: 'Prodigy Liquidity Note', desc: 'High liquidity with fixed returns' },
  { name: 'Prodigy Vantage (FX Note)', desc: 'Foreign exchange opportunities' },
  { name: 'Prodigy Lite (Advisory services)', desc: 'Professional financial guidance' },
];

const bespoke = [
  { name: 'Prodigy Genesis', desc: 'Premium investment portfolio' },
  { name: 'Prodigy Aura', desc: 'Elite wealth management' },
  { name: 'Prodigy Apex', desc: 'Pinnacle investment experience' },
  { name: 'Prodigy', desc: 'Ultimate financial mastery' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid var(--gray-100)',
        position: 'sticky', top: 0, background: 'white', zIndex: 100,
      }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--navy)', letterSpacing: '0.1em' }}>PRODIGY</div>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'var(--gray-400)', textTransform: 'uppercase' }}>GROUP SERVICES</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} className="btn-outline" style={{ fontSize: 12 }}>
            <Shield size={13} /> Admin Login
          </button>
          <button onClick={() => navigate('/register')} className="btn-navy" style={{ fontSize: 12 }}>
            Get Started <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f8fafc 100%)',
        padding: 'clamp(60px, 10vh, 120px) 48px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,184,75,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-40px',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,27,53,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <p style={{
          fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--gold)', fontWeight: 700, marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
          Prodigy Group Services
          <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--gold)' }} />
        </p>

        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 'clamp(36px, 6vw, 72px)',
          color: 'var(--navy)', lineHeight: 1.1, marginBottom: 16,
        }}>
          Your Gateway to<br />
          <span style={{ color: '#3b6ef8' }}>Financial Excellence</span>
        </h1>

        <p style={{
          color: 'var(--gray-600)', fontSize: 'clamp(14px, 2vw, 17px)',
          maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7,
        }}>
          Access premium loan and investment products tailored to your financial goals.
          From flexible loans to bespoke investment portfolios.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} className="btn-navy" style={{ fontSize: 14, padding: '14px 32px' }}>
            Get Started <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/login')} className="btn-outline" style={{ fontSize: 14, padding: '14px 32px' }}>
            <Shield size={15} /> Admin Login
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: 'clamp(48px, 8vh, 80px) 48px', background: 'white' }}>
        <p style={{
          fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--gray-400)', fontWeight: 600, marginBottom: 40,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>✏️</span> Prodigy Group Services
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
        }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
              borderRadius: 16, padding: 32, textAlign: 'center',
              transition: 'all 0.3s', cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,27,53,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(59,110,248,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Icon size={22} color="#3b6ef8" strokeWidth={1.8} />
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 8, color: 'var(--navy)' }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section style={{ padding: 'clamp(48px, 8vh, 80px) 48px', background: 'var(--gray-50)' }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)',
          textAlign: 'center', marginBottom: 48, color: 'var(--navy)',
        }}>
          Our Products
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24, maxWidth: 900, margin: '0 auto',
        }}>
          {/* Products & Services */}
          <div style={{
            background: 'white', borderRadius: 16, padding: 32,
            border: '1px solid var(--gray-200)',
          }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#3b6ef8', marginBottom: 24 }}>
              Products & Services
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {products.map(p => (
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

          {/* Bespoke Products */}
          <div style={{
            background: 'var(--gray-50)', borderRadius: 16, padding: 32,
            border: '1px solid var(--gray-200)',
          }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#3b6ef8', marginBottom: 24 }}>
              Bespoke Products
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {bespoke.map(p => (
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
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: '#3b6ef8', padding: 'clamp(60px, 10vh, 100px) 48px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 'clamp(28px, 4vw, 44px)', color: 'white', marginBottom: 16,
        }}>
          Ready to Get Started?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
          Join thousands of satisfied customers and start your financial journey today
        </p>
        <button
          onClick={() => navigate('/register')}
          style={{
            background: 'white', color: '#3b6ef8',
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 14, border: 'none', borderRadius: 8,
            padding: '14px 36px', cursor: 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          Create Free Account
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--navy)', color: 'rgba(255,255,255,0.4)',
        padding: '24px 48px', textAlign: 'center', fontSize: 12,
      }}>
        © 2024 Prodigy Group Services. Bespoke Asset Management System V2.0
      </footer>

      <style>{`
        @media (max-width: 600px) {
          nav { padding: 16px 20px !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </div>
  );
}
