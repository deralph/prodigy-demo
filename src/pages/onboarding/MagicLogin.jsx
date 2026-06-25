import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { setTokens, authApi } from '../../services/api';

const ROLE_DESTINATIONS = {
  joint:      '/joint/portfolio',
  corporate:  '/corporate/treasury',
  individual: '/individual/portfolio',
  admin:      '/admin',
};

function strengthLabel(pw) {
  if (!pw) return null;
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  if (score <= 2) return { label: 'Weak',   color: '#ef4444', width: '30%' };
  if (score <= 3) return { label: 'Fair',   color: '#f97316', width: '55%' };
  if (score <= 4) return { label: 'Good',   color: '#eab308', width: '75%' };
  return           { label: 'Strong', color: '#22c55e', width: '100%' };
}

function SetPasswordForm({ meta, token, onSuccess }) {
  const [pw,  setPw]  = useState('');
  const [pw2, setPw2] = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const strength = strengthLabel(pw);

  const inputStyle = { width:'100%', border:'1.5px solid var(--gray-200)', borderRadius:10, padding:'12px 40px 12px 14px', fontFamily:'inherit', fontSize:14, color:'var(--navy)', outline:'none', boxSizing:'border-box' };

  const handleSubmit = useCallback(async () => {
    setErr('');
    if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (pw !== pw2)    { setErr("Passwords don't match."); return; }
    if (!(/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw))) {
      setErr('Password must include at least one uppercase letter, one lowercase letter, and one number.'); return;
    }
    setLoading(true);
    try {
      const data = await authApi.setSecondaryPassword(token, pw);
      onSuccess(data);
    } catch (e) { setErr(e?.message || 'Could not set password. Please try again.'); setLoading(false); }
  }, [pw, pw2, token, onSuccess]);

  return (
    <>
      <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(34,197,94,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
        <ShieldCheck size={26} color="var(--green)" />
      </div>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--navy)', marginBottom:6 }}>Set Your Password</div>
      <p style={{ fontSize:12, color:'var(--gray-400)', lineHeight:1.6, marginBottom:22 }}>
        Welcome, <strong style={{ color:'var(--navy)' }}>{meta?.secondaryName || 'Co-holder'}</strong>! You've been added to <strong style={{ color:'var(--navy)' }}>{meta?.primaryName || 'a joint account'}</strong>.
        Create your own password to sign in anytime.
      </p>
      <div style={{ textAlign:'left', marginBottom:14 }}>
        <div style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>New Password</div>
        <div style={{ position:'relative' }}>
          <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => { setPw(e.target.value); setErr(''); }} style={inputStyle} placeholder="At least 8 characters" autoFocus />
          <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', padding:0 }}>
            {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        </div>
        {strength && (
          <div style={{ marginTop:8 }}>
            <div style={{ height:4, borderRadius:2, background:'var(--gray-100)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:strength.width, background:strength.color, transition:'width 0.3s,background 0.3s' }} />
            </div>
            <div style={{ fontSize:10, color:strength.color, marginTop:4, fontWeight:700 }}>{strength.label}</div>
          </div>
        )}
      </div>
      <div style={{ textAlign:'left', marginBottom:18 }}>
        <div style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Confirm Password</div>
        <div style={{ position:'relative' }}>
          <input type={showPw2 ? 'text' : 'password'} value={pw2} onChange={e => { setPw2(e.target.value); setErr(''); }} style={inputStyle} placeholder="Repeat your password" />
          <button type="button" onClick={() => setShowPw2(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', padding:0 }}>
            {showPw2 ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        </div>
        {pw2 && pw !== pw2 && <div style={{ fontSize:11, color:'#ef4444', marginTop:5 }}>Passwords don't match</div>}
      </div>
      {err && <div style={{ fontSize:12, color:'#ef4444', background:'rgba(239,68,68,0.08)', borderRadius:8, padding:'10px 12px', marginBottom:14, textAlign:'left' }}>{err}</div>}
      <button
        onClick={handleSubmit} disabled={loading || !pw || !pw2}
        style={{ width:'100%', background: loading || !pw || !pw2 ? 'var(--gray-200)' : 'var(--navy)', color: loading || !pw || !pw2 ? 'var(--gray-400)' : 'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13, border:'none', borderRadius:10, padding:14, cursor: loading || !pw || !pw2 ? 'not-allowed' : 'pointer', letterSpacing:'0.06em' }}
      >{loading ? 'Setting up…' : 'SET PASSWORD & SIGN IN'}</button>
      <p style={{ fontSize:10, color:'var(--gray-400)', marginTop:14, lineHeight:1.6 }}>
        This link is for first-time setup only. After this, use the <span style={{ color:'var(--navy)', fontWeight:700, cursor:'pointer', textDecoration:'underline' }} onClick={() => window.location.href = '/login'}>login page</span>.
      </p>
    </>
  );
}

export default function MagicLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [step,   setStep]  = useState('loading');
  const [meta,   setMeta]  = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!token) { setStep('error'); setErrMsg('No token was found in this link.'); return; }
    authApi.inspectMagicLink(token)
      .then(data => { setMeta(data); setStep(data.requiresPasswordSetup ? 'setup' : 'already_setup'); })
      .catch(e => { setStep('error'); setErrMsg(e?.message || 'This link is invalid or has expired.'); });
  }, [token]);

  const handlePasswordSet = useCallback((data) => {
    setTokens(data.accessToken, data.refreshToken);
    login({ ...data.user, name: data.user.name || data.user.email, clientId: data.user.clientId, holderType: data.user.holderType });
    setStep('success');
    setTimeout(() => navigate(ROLE_DESTINATIONS[data.user.role] || '/joint/portfolio', { replace: true }), 1800);
  }, [login, navigate]);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--navy)', padding:24 }}>
      <div style={{ background:'white', borderRadius:20, padding:'40px 36px', maxWidth:460, width:'100%', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:20 }}>
          Prodigy Finance · Joint Account
        </div>
        {step === 'loading' && (
          <>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(13,27,53,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
              <Loader size={26} color="var(--navy)" style={{ animation:'spin 1s linear infinite' }}/>
            </div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:17, color:'var(--navy)', marginBottom:8 }}>Verifying your link…</div>
            <p style={{ fontSize:13, color:'var(--gray-400)', lineHeight:1.6 }}>Please wait while we authenticate your joint account access.</p>
          </>
        )}
        {step === 'setup' && <SetPasswordForm meta={meta} token={token} onSuccess={handlePasswordSet} />}
        {step === 'success' && (
          <>
            <CheckCircle size={52} color="var(--green)" style={{ marginBottom:16 }}/>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--navy)', marginBottom:8 }}>Welcome, {meta?.secondaryName || 'Co-holder'}!</div>
            <p style={{ fontSize:13, color:'var(--gray-400)', lineHeight:1.6 }}>Your account is set up. Redirecting to your dashboard…</p>
          </>
        )}
        {(step === 'error' || step === 'already_setup') && (
          <>
            <XCircle size={52} color="#ef4444" style={{ marginBottom:16 }}/>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'var(--navy)', marginBottom:8 }}>{step === 'already_setup' ? 'Already Set Up' : 'Link Invalid'}</div>
            <p style={{ fontSize:13, color:'var(--gray-400)', lineHeight:1.6, marginBottom:20 }}>
              {step === 'already_setup' ? 'Your password is already set up. Please sign in normally.' : (errMsg || 'This link is invalid or has expired.')}
            </p>
            <button onClick={() => navigate('/login', { replace:true })} style={{ background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, border:'none', borderRadius:10, padding:'12px 28px', cursor:'pointer', letterSpacing:'0.06em' }}>
              Go to Login
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}
