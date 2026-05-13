import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    login({ email, name: 'Admin User', role: 'admin' });
    navigate('/dashboard/treasury');
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f4ff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 'clamp(32px, 5vw, 48px)',
        width: '100%', maxWidth: 400,
        boxShadow: '0 24px 64px rgba(13,27,53,0.12)',
      }} className="animate-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/*  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 24, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--navy)' }}>P</span>
            <span style={{ fontSize: 20, color: 'var(--gold)' }}>✏</span>
          </div>*/}
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--navy)', marginBottom: 6 }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Sign in to Prodigy Group Services</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 6 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-green"
            style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-400)', marginTop: 20 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#3b6ef8', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
