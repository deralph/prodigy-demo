import React from 'react';
import LandingNav      from '../components/landing/LandingNav';
import LandingHero     from '../components/landing/LandingHero';
import LandingFeatures from '../components/landing/LandingFeatures';
import LandingProducts from '../components/landing/LandingProducts';
import LandingCTA      from '../components/landing/LandingCTA';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'white', fontFamily: 'DM Sans,sans-serif' }}>
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingProducts />
      <LandingCTA />
      <footer style={{ background: 'var(--navy)', color: 'rgba(255,255,255,0.4)', padding: '24px 48px', textAlign: 'center', fontSize: 12 }}>
        © 2024 Prodigy Group Services. Bespoke Asset Management System V2.0
      </footer>
      <style>{`
        @media(max-width:600px){
          nav  { padding: 16px 20px !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </div>
  );
}
