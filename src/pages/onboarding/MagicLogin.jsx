import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { setTokens } from '../../services/api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function MagicLogin() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { login }      = useAppStore();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); setMessage('No token provided in this link.'); return; }

    fetch(`${BASE}/auth/magic-login?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.accessToken) throw new Error(data.message || 'Invalid response');
        setTokens(data.accessToken, data.refreshToken);
        login({
          ...data.user,
          name: data.user.name || data.user.email,
          clientId: data.user.clientId,
        });
        setStatus('success');
        const dest = data.user.role === 'joint' ? '/joint/portfolio' : `/${data.user.role}`;
        setTimeout(() => navigate(dest, { replace: true }), 1500);
      })
      .catch(err => { setStatus('error'); setMessage(err.message || 'Link is invalid or has expired.'); });
  }, []);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--navy)', padding:24 }}>
      <div style={{ background:'white', borderRadius:20, padding:'40px 36px', maxWidth:420, width:'100%', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:20 }}>
          Prodigy Finance · Joint Account
        </div>
        {status === 'loading' && (
          <>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(13,27,53,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <Loader size={26} color="var(--navy)" style={{ animation:'spin 1s linear infinite' }}/>
            </div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:17, color:'var(--navy)', marginBottom:8 }}>Verifying your link…</div>
            <p style={{ fontSize:13, color:'var(--gray-400)', lineHeight:1.6 }}>Please wait while we authenticate your joint account access.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={52} color="var(--green)" style={{ marginBottom:16 }}/>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--navy)', marginBottom:8 }}>Access Granted</div>
            <p style={{ fontSize:13, color:'var(--gray-400)', lineHeight:1.6 }}>You have been authenticated as a joint account holder. Redirecting to your dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={52} color="var(--red)" style={{ marginBottom:16 }}/>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--navy)', marginBottom:8 }}>Link Invalid</div>
            <p style={{ fontSize:13, color:'var(--gray-400)', lineHeight:1.6, marginBottom:20 }}>{message}</p>
            <button onClick={() => navigate('/login', { replace:true })} style={{ background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, border:'none', borderRadius:10, padding:'12px 28px', cursor:'pointer', letterSpacing:'0.06em' }}>
              Go to Login
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
