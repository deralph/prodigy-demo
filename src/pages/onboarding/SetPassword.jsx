import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import useAppStore from '../../store/useAppStore';

export default function SetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAppStore();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await authApi.setPassword(password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.body?.message || err.message || 'Could not set password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--navy)', padding:24 }}>
      <div style={{ background:'white', borderRadius:20, padding:'40px 36px', maxWidth:420, width:'100%', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.3)' }}>
        <h3 style={{ marginBottom:8 }}>Set Your Password</h3>
        <p style={{ color:'var(--gray-500)', marginBottom:18 }}>Create a password you will use to sign in to this account in future.</p>
        <form onSubmit={submit}>
          <div style={{ marginBottom:10 }}>
            <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div style={{ marginBottom:10 }}>
            <input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          {error && <div style={{ color:'var(--red)', marginBottom:8 }}>{error}</div>}
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            <button className="btn-muted" type="button" onClick={() => navigate(-1)} disabled={loading}>Cancel</button>
            <button className="btn-gold" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Set Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
