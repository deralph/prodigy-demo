import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Building2, User, Upload, CheckCircle, AlertCircle, Phone, Shield, FileText, PenLine, Info, Lock as LockIcon } from 'lucide-react';
import { KYC_REQUIREMENTS } from '../../store/useAppStore';
import useAppStore from '../../store/useAppStore';
import { authApi, setTokens, kycApi, nibssApi, clientApi } from '../../services/api';

const inputStyle = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
  padding: '11px 14px 11px 38px', fontFamily: 'DM Sans,sans-serif',
  fontSize: 14, color: '#1e293b', background: 'white', outline: 'none',
  transition: 'border-color 0.2s',
};
const inputStylePlain = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
  padding: '11px 14px', fontFamily: 'DM Sans,sans-serif',
  fontSize: 14, color: '#1e293b', background: 'white', outline: 'none',
  transition: 'border-color 0.2s',
};

/* ── NIBSS BVN/NIN/CAC verifier — calls backend API only, no offline bypass ── */
async function verifyNibss(type, number, expectedName) {
  const clean = number.replace(/\D/g, '');
  if (type === 'nin' && clean.length !== 11) return { ok: false, message: 'NIN must be exactly 11 digits.' };
  if (type === 'bvn' && clean.length !== 11) return { ok: false, message: 'BVN must be exactly 11 digits.' };
  if (type === 'cac' && clean.length < 6)   return { ok: false, message: 'CAC registration number is too short (min 6 chars).' };
  if (!expectedName || expectedName.trim().length < 3) return { ok: false, message: 'Full name is required for NIBSS verification.' };
  try {
    let result;
    if (type === 'nin')      result = await nibssApi.verifyNin(clean, expectedName.trim());
    else if (type === 'bvn') result = await nibssApi.verifyBvn(clean, expectedName.trim());
    else if (type === 'cac') result = await nibssApi.verifyCac(clean, expectedName.trim());
    if (result?.verified) return { ok: true, fetchedName: result.name || expectedName.trim(), message: `${type.toUpperCase()} verified via NIBSS — name matched.` };
    return { ok: false, message: result?.message || `${type.toUpperCase()} could not be verified. Check the number and name.` };
  } catch {
    return { ok: false, message: 'Verification service unavailable. Please ensure the server is running and try again.' };
  }
}

export default function OnboardingLogin() {
  const [tab, setTab]           = useState('corporate'); // corporate | individual
  const [mode, setMode]         = useState('signin');    // signin | apply | kyc
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [forgot, setForgot]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Apply form
  const [applyForm, setApplyForm] = useState({ entityName:'', email:'', password:'', phone:'', rcNumber:'', cacNumber:'', cacDigits:'' });
  const [kycUploads, setKycUploads] = useState({});
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [createStep, setCreateStep] = useState('form');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleCorpVerify = async () => {
    setVerifying(true); setVerifyError(''); setVerified(false);
    const numToVerify = applyForm.cacDigits || applyForm.cacNumber;
    const r = await verifyNibss('cac', numToVerify, applyForm.entityName);
    setVerifying(false);
    if (r.ok) setVerified(true);
    else setVerifyError(r.message);
  };

  const { login } = useAppStore();
  const navigate = useNavigate();

  const isCorp = tab === 'corporate';

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      if (res && res.accessToken) {
        setTokens(res);
        const me = await authApi.getMe();
        const role = me.role?.toLowerCase() || 'individual';
        const c = me.client || {};
        login({
          ...me,
          role,
          email,
          name:           c.name           || me.adminUser?.name  || me.name  || email,
          clientId:       c.clientRef       || me.adminUser?.adminRef || me.clientId,
          adminRole:      (me.adminUser?.role ?? null)?.toLowerCase() ?? null,
          clientType:     c.type            ?? null,
          phone:          c.phone           ?? null,
          rcNumber:       c.rcNumber        ?? null,
          taxId:          c.taxId           ?? null,
          secondaryName:  c.secondaryName   ?? null,
          secondaryEmail: c.secondaryEmail  ?? null,
          mandateType:    c.mandateType      ?? null,
          client:         c,
        });
        if (role === 'admin')            navigate('/admin');
        else if (role === 'corporate')   navigate('/corporate/treasury');
        else if (role === 'individual')  navigate('/individual/portfolio');
        else if (role === 'joint')       navigate('/joint/portfolio');
        setLoading(false);
        return;
      }
      setError('Login failed. Please check your credentials.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credentials')) {
        setError('Invalid email or password.');
      } else if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('suspended')) {
        setError('Your account has been suspended. Contact support.');
      } else {
        setError('Unable to connect. Please ensure the server is running.');
      }
    }
    setLoading(false);
  };

  const LeftPanel = () => (
    <div style={{
      width: '42%', background: 'var(--navy)', padding: '48px 40px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(232,184,75,0.06)' }} />
      <div style={{ position:'absolute', bottom:-40, left:-40, width:160, height:160, borderRadius:'50%', background:'rgba(232,184,75,0.04)' }} />
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--gold)', letterSpacing:'0.12em' }}>PRODIGY</div>
        <div style={{ fontSize:9, letterSpacing:'0.2em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase' }}>
          {isCorp ? 'CORPORATE SYSTEM' : 'WEALTH MANAGEMENT'}
        </div>
      </div>
      <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(28px,3vw,40px)', color:'white', lineHeight:1.1, marginBottom:20 }}>
        {isCorp ? <>BESPOKE<br />ASSET MANAGEMENT<br /><span style={{color:'var(--gold)'}}>ELEVATED.</span></> : <>PERSONAL<br />WEALTH GENERATION<br /><span style={{color:'var(--gold)'}}>REIMAGINED.</span></>}
      </h1>
      <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', letterSpacing:'0.06em', textTransform:'uppercase', lineHeight:1.7 }}>
        {isCorp
          ? 'Secure, institutional-grade liquidity and investment infrastructure for enterprise clients.'
          : 'Premium liquidity, high-yield returns, and investment solutions for individuals and families.'}
      </p>

      <div style={{ marginTop:36, padding:'16px', background:'rgba(255,255,255,0.06)', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize:9, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8, fontWeight:700 }}>Secure Access</div>
        <p style={{ fontSize:10, color:'rgba(255,255,255,0.45)', lineHeight:1.7, margin:0 }}>
          {isCorp
            ? 'All corporate accounts are provisioned by Prodigy Finance. Contact your relationship manager to request access.'
            : 'Sign in with the credentials provided during account registration, or create a new individual / joint account.'}
        </p>
      </div>
    </div>
  );

  const kycDocs = isCorp ? KYC_REQUIREMENTS.corporate : KYC_REQUIREMENTS.individual;
  const allUploaded = kycDocs.every(d => kycUploads[d.key]);

  const handleKycUpload = (key, file) => setKycUploads(prev => ({ ...prev, [key]: file }));

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#f0f4ff' }}>
      <LeftPanel />

      {/* Right panel */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 32px', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          {/* Tabs */}
          <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:4, marginBottom:28 }}>
            {['corporate','individual'].map(t => (
              <button key={t} onClick={() => { setTab(t); setMode('signin'); setError(''); }}
                style={{
                  flex:1, padding:'9px', borderRadius:7, border:'none', cursor:'pointer',
                  fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, letterSpacing:'0.05em',
                  background: tab===t ? 'white' : 'transparent',
                  color: tab===t ? 'var(--navy)' : 'var(--gray-400)',
                  boxShadow: tab===t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition:'all 0.2s', textTransform:'capitalize',
                }}>
                {t === 'corporate' ? 'Corporate Entity' : 'Individual / Joint'}
              </button>
            ))}
          </div>

          {/* ── Sign In ── */}
          {mode === 'signin' && (
            <div className="animate-in">
              {!forgot && <button onClick={() => setMode('signin')} style={{background:'none',border:'none',cursor:'default',display:'block'}} />}
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'var(--navy)', marginBottom:4 }}>SIGN IN</h2>
              <p style={{ fontSize:11, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:28 }}>Access your {isCorp ? 'corporate treasury' : 'wealth portal'}</p>

              <form onSubmit={handleSignIn} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>
                    {isCorp ? 'Institutional Email' : 'Email Address'}
                  </div>
                  <div style={{ position:'relative' }}>
                    <Mail size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="email" placeholder={isCorp ? 'admin@company.com' : 'you@email.com'}
                      value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7, display:'flex', justifyContent:'space-between' }}>
                    Password
                    <button type="button" onClick={() => setForgot(true)} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:10,fontWeight:700,letterSpacing:'0.1em' }}>FORGOT?</button>
                  </div>
                  <div style={{ position:'relative' }}>
                    <Lock size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="password" placeholder="••••••••••"
                      value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  </div>
                </div>
                {error && <div style={{ fontSize:12, color:'var(--red)', background:'rgba(239,68,68,0.08)', padding:'10px 12px', borderRadius:8 }}>{error}</div>}
                <button type="submit" style={{
                  background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800,
                  fontSize:13, letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px',
                  cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  opacity: loading ? 0.7 : 1, marginTop:4,
                }} disabled={loading}>
                  {loading ? 'Authenticating...' : <> AUTHENTICATE <ArrowRight size={15} /> </>}
                </button>
              </form>

              {isCorp && (
                <p style={{ textAlign:'center', fontSize:12, color:'var(--gray-400)', marginTop:20 }}>
                  New corporate entity?{' '}
                  <button onClick={() => setMode('apply')} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontWeight:700,fontSize:12 }}>Apply for Account</button>
                </p>
              )}
              {!isCorp && (
                <p style={{ textAlign:'center', fontSize:12, color:'var(--gray-400)', marginTop:20 }}>
                  <button onClick={() => setMode('create')} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontWeight:700,fontSize:12 }}>← Back to Login</button>
                  &nbsp;·&nbsp;
                  <button onClick={() => setMode('create')} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontWeight:700,fontSize:12 }}>Create Account</button>
                </p>
              )}
            </div>
          )}

          {/* ── Corporate Apply ── */}
          {mode === 'apply' && (
            <div className="animate-in">
              <button onClick={() => setMode('signin')} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back to Login</button>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--navy)', marginBottom:4 }}>APPLY FOR ACCOUNT</h2>
              <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:24 }}>Initiate Corporate Onboarding</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Registered Entity Name</div>
                  <div style={{ position:'relative' }}>
                    <Building2 size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="text" placeholder="COMPANY LTD" value={applyForm.entityName}
                      onChange={e => setApplyForm(f => ({...f, entityName: e.target.value}))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  </div>
                </div>
                {/* CAC Registration Number */}
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    CAC Registration Number (RC No.)
                    {verified && <span style={{ color:'var(--green)', fontWeight:700, fontSize:10 }}>✓ VERIFIED</span>}
                  </div>
                  <div style={{ position:'relative' }}>
                    <FileText size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="text" placeholder="e.g. RC123456 (name of company)"  value={applyForm.cacNumber}
                      onChange={e => { setApplyForm(f => ({...f, cacNumber: e.target.value})); setVerified(false); setVerifyError(''); }}
                      style={{ ...inputStyle, borderColor: verified ? '#22c55e' : '#d1d5db' }}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor = verified ? '#22c55e' : '#d1d5db'} />
                  </div>
                </div>
                {/* CAC Digits / RC Digits */}
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>
                    CAC RC Digits <span style={{ color:'var(--gray-300)', fontWeight:400 }}>(numeric portion only, e.g. 123456)</span>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input type="text" placeholder="e.g. 123456" value={applyForm.cacDigits}
                      onChange={e => { setApplyForm(f => ({...f, cacDigits: e.target.value.replace(/\D/g,'')})); setVerified(false); setVerifyError(''); }}
                      maxLength={10}
                      style={{ ...inputStylePlain, flex:1, borderColor: verified ? '#22c55e' : '#d1d5db' }}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor = verified ? '#22c55e' : '#d1d5db'} />
                    <button onClick={handleCorpVerify} disabled={verifying || (!applyForm.cacDigits && !applyForm.cacNumber) || !applyForm.entityName || verified}
                      style={{ padding:'10px 16px', background: verified ? 'rgba(34,197,94,0.12)' : 'var(--navy)', color: verified ? 'var(--green)' : 'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, flexShrink:0, opacity: (verifying||(!applyForm.cacDigits&&!applyForm.cacNumber)||!applyForm.entityName||verified)?0.65:1 }}>
                      {verifying ? '⏳ Checking…' : verified ? '✓ VERIFIED' : 'VERIFY VIA CAC'}
                    </button>
                  </div>
                  {verifyError && <div style={{ fontSize:11, color:'var(--red)', marginTop:5 }}>{verifyError}</div>}
                  {verified && <div style={{ fontSize:11, color:'var(--green)', marginTop:5 }}>✓ CAC digits matched to entity name via NIBSS/CAC registry.</div>}
                </div>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Primary Contact Email</div>
                  <div style={{ position:'relative' }}>
                    <Mail size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="email" placeholder="admin@company.com" value={applyForm.email}
                      onChange={e => setApplyForm(f => ({...f, email: e.target.value}))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Phone Number</div>
                  <div style={{ position:'relative' }}>
                    <Phone size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="tel" placeholder="+234 800 000 0000" value={applyForm.phone}
                      onChange={e => setApplyForm(f => ({...f, phone: e.target.value}))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>RC Number</div>
                  <div style={{ position:'relative' }}>
                    <FileText size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="text" placeholder="RC123456" value={applyForm.rcNumber}
                      onChange={e => setApplyForm(f => ({...f, rcNumber: e.target.value}))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Secure Password</div>
                  <div style={{ position:'relative' }}>
                    <Lock size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="password" placeholder="min 8 characters" value={applyForm.password}
                      onChange={e => setApplyForm(f => ({...f, password: e.target.value}))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  </div>
                </div>
                {!verified && <div style={{ fontSize:11, color:'var(--gold)', background:'rgba(232,184,75,0.1)', padding:'10px 12px', borderRadius:8, display:'flex', alignItems:'center', gap:6 }}><Shield size={13}/> CAC verification required before proceeding</div>}
                <button onClick={() => setMode('kyc')} disabled={!verified || !applyForm.email || !applyForm.password} style={{
                  background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
                  letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor: verified && applyForm.email && applyForm.password ? 'pointer' : 'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4,
                  opacity: verified && applyForm.email && applyForm.password ? 1 : 0.45,
                }}>
                  CONTINUE TO KYC <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── KYC Step (Corporate) ── */}
          {mode === 'kyc' && (
            <div className="animate-in">
              <button onClick={() => { setMode('apply'); setKycUploads({}); setKycSubmitted(false); }} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back to Registration</button>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--navy)', marginBottom:4 }}>ENTITY KYC</h2>
              <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Upload documents — all optional at this stage</p>
              <div style={{ fontSize:12, color:'#1d4ed8', background:'rgba(59,130,246,0.07)', padding:'10px 12px', borderRadius:8, marginBottom:10, display:'flex', alignItems:'flex-start', gap:6 }}>
                <Info size={13} style={{ flexShrink:0, marginTop:1 }}/>
                <span><strong>Documents are optional during onboarding.</strong> You may invest immediately after account creation. However, <strong>liquidation, withdrawal and other sensitive operations</strong> require full KYC approval from our compliance team.</span>
              </div>
              <div style={{ fontSize:11, color:'var(--gray-400)', background:'rgba(232,184,75,0.07)', padding:'8px 12px', borderRadius:8, marginBottom:14, border:'1px solid rgba(232,184,75,0.2)' }}>
                ⚡ You can skip and submit now — documents can be uploaded later from your KYC dashboard.
              </div>
              {kycSubmitted ? (
                <div style={{ textAlign:'center', padding:'30px 0' }}>
                  <CheckCircle size={48} color="var(--green)" style={{ marginBottom:14 }}/>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--navy)', marginBottom:8 }}>Account Created — Pending Full Verification</div>
                  <div style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, padding:'14px', marginBottom:16, textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--navy)', marginBottom:8 }}>You can immediately:</div>
                    {['Sign in and access your treasury dashboard','Fund your wallet','Make investments in available products'].map(a=>(
                      <div key={a} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--navy)', marginBottom:4 }}>
                        <CheckCircle size={11} color="var(--green)"/> {a}
                      </div>
                    ))}
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--red)', marginTop:10, marginBottom:6 }}>Locked until full KYC approval:</div>
                    {['Withdrawals & liquidations','Account termination','Other sensitive operations'].map(a=>(
                      <div key={a} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--red)', marginBottom:4 }}>
                        <LockIcon size={11}/> {a}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:12, color:'var(--gray-400)', marginBottom:20 }}>Our compliance team will review submitted documents within 1–2 business days.</p>
                  <button onClick={() => setMode('signin')} style={{ background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:12, border:'none', borderRadius:8, padding:'12px 24px', cursor:'pointer' }}>PROCEED TO LOGIN</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {kycDocs.map(doc => (
                    <div key={doc.key} style={{ background: kycUploads[doc.key] ? 'rgba(34,197,94,0.06)' : '#f8fafc', border: `1px solid ${kycUploads[doc.key] ? 'rgba(34,197,94,0.3)' : '#e2e8f0'}`, borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'var(--navy)', marginBottom:2 }}>{doc.label} <span style={{ fontSize:9, color:'var(--gold)', fontWeight:600 }}>OPTIONAL</span></div>
                        {kycUploads[doc.key] ? (
                          <div style={{ fontSize:11, color:'var(--green)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>✓ {kycUploads[doc.key].name}</div>
                        ) : (
                          <div style={{ fontSize:10, color:'var(--gray-400)' }}>PDF, JPG, or PNG — Max 5MB</div>
                        )}
                      </div>
                      <label style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background: kycUploads[doc.key] ? 'rgba(34,197,94,0.12)' : 'rgba(13,27,53,0.08)', color: kycUploads[doc.key] ? 'var(--green)' : 'var(--navy)', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:700, border:'1px solid rgba(13,27,53,0.12)' }}>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleKycUpload(doc.key, e.target.files?.[0]||null)} />
                        {kycUploads[doc.key] ? <><CheckCircle size={12}/> Uploaded</> : <><Upload size={12}/> Upload</>}
                      </label>
                    </div>
                  ))}
                  <div style={{ marginTop:4, fontSize:11, color:'var(--gray-400)', fontWeight:600 }}>
                    {Object.keys(kycUploads).length}/{kycDocs.length} documents uploaded (optional)
                  </div>
                  {error && <div style={{ fontSize:12, color:'var(--red)', background:'rgba(239,68,68,0.08)', padding:'10px 12px', borderRadius:8 }}>{error}</div>}
                  <button onClick={async () => {
                    setLoading(true); setError('');
                    try {
                      await authApi.registerCorporate({ entityName: applyForm.entityName, email: applyForm.email, password: applyForm.password, phone: applyForm.phone, rcNumber: applyForm.rcNumber });
                      kycApi.uploadCorporateDocs(kycUploads).catch(() => {});
                      setKycSubmitted(true);
                    } catch(err) {
                      const msg = err?.message || '';
                      setError(msg.toLowerCase().includes('already') ? 'An account with this email already exists.' : 'Registration failed. Please try again.');
                    }
                    setLoading(false);
                  }} disabled={loading} style={{
                    background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
                    letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4,
                  }}>
                    {loading ? 'Creating Account…' : <> CREATE ACCOUNT <ArrowRight size={15} /> </>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Individual/Joint Create Account ── */}
          {mode === 'create' && !isCorp && <IndividualCreate onBack={() => setMode('signin')} />}
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          div[style*="width: 42%"]{display:none!important;}
          div[style*="flex: 1"]{padding:24px 20px!important;}
        }
      `}</style>
    </div>
  );
}

/* ── helpers ── */
const isGmail = email => /^[a-zA-Z0-9._%+\-]+@gmail\.com$/.test(email.trim());
const HOLDER_COLORS_OB = ['#3b82f6','#22c55e','#8b5cf6'];

function buildJointDocs(n) {
  const docs = [];
  for (let i = 1; i <= n; i++) {
    const ord = i === 1 ? 'Primary' : i === 2 ? 'Secondary' : 'Third';
    docs.push(
      { key:`valid_id_h${i}`,    label:`${ord} Holder — Valid ID` },
      { key:`nin_h${i}`,         label:`${ord} Holder — NIN` },
      { key:`passport_h${i}`,    label:`${ord} Holder — Passport Photo` },
      { key:`sig_h${i}`,         label:`${ord} Holder — Signature` },
      { key:`utility_h${i}`,     label:`${ord} Holder — Utility Bill` },
    );
  }
  return docs;
}

function IndividualCreate({ onBack }) {
  const [accountType, setAccountType] = useState('single');
  const [step, setStep] = useState('form'); // 'form' | 'verify' | 'kyc' | 'done'
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError]   = useState('');

  /* ── Single account state ── */
  const [singleForm, setSingleForm] = useState({ name:'', email:'', phone:'', password:'', nin:'', bvn:'' });
  const [singleVerified, setSingleVerified] = useState(false);
  const [singleVerifying, setSingleVerifying] = useState(false);
  const [singleVerifyErr, setSingleVerifyErr] = useState('');

  /* ── Joint account state ── */
  const [holderCount, setHolderCount] = useState(2);
  const [mandate, setMandate] = useState('AND');
  const [holders, setHolders] = useState([
    { name:'', email:'', phone:'', nin:'', verified:false, verifying:false, verifyErr:'' },
    { name:'', email:'', phone:'', nin:'', verified:false, verifying:false, verifyErr:'' },
  ]);

  /* ── KYC uploads ── */
  const [kycUploads, setKycUploads] = useState({});
  const handleUpload = (key, file) => setKycUploads(prev => ({ ...prev, [key]: file }));

  const iStyle = { width:'100%', border:'1px solid #d1d5db', borderRadius:8, padding:'11px 14px 11px 38px', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#1e293b', background:'white', outline:'none', transition:'border-color 0.2s' };
  const iPlain = { width:'100%', border:'1px solid #d1d5db', borderRadius:8, padding:'10px 13px', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#1e293b', background:'white', outline:'none', transition:'border-color 0.2s' };

  /* ── Update holder count → resize array ── */
  const changeHolderCount = (n) => {
    setHolderCount(n);
    setHolders(prev => {
      const base = { name:'', email:'', phone:'', nin:'', verified:false, verifying:false, verifyErr:'' };
      if (n > prev.length) return [...prev, ...Array(n - prev.length).fill(null).map(() => ({...base}))];
      return prev.slice(0, n);
    });
  };

  const updateHolder = (i, patch) => setHolders(prev => prev.map((h, idx) => idx === i ? { ...h, ...patch } : h));

  const verifyHolder = async (i) => {
    const h = holders[i];
    updateHolder(i, { verifying:true, verifyErr:'', verified:false });
    const r = await verifyNibss('nin', h.nin, h.name);
    updateHolder(i, { verifying:false, verified:r.ok, verifyErr: r.ok ? '' : r.message });
  };

  /* ── Single verify ── */
  const verifySingle = async () => {
    setSingleVerifying(true); setSingleVerifyErr(''); setSingleVerified(false);
    const r = await verifyNibss('nin', singleForm.nin, singleForm.name);
    setSingleVerifying(false);
    if (r.ok) setSingleVerified(true); else setSingleVerifyErr(r.message);
  };

  /* ── Validation ── */
  const singleValid = singleForm.name && isGmail(singleForm.email) && singleForm.password.length >= 8;
  const jointFormValid = holders.every(h => h.name && isGmail(h.email) && h.phone) && (holders[0]?.password?.length >= 6);
  const allHoldersVerified = holders.every(h => h.verified);
  const jointDocs = buildJointDocs(holderCount);
  const indDocs = KYC_REQUIREMENTS.individual;

  /* ── Done screen ── */
  if (step === 'done') return (
    <div className="animate-in" style={{ textAlign:'center', padding:'20px 0' }}>
      <CheckCircle size={48} color="var(--green)" style={{ marginBottom:14 }}/>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--navy)', marginBottom:8 }}>
        {accountType === 'joint' ? 'Joint Account Created!' : 'Account Created!'}
      </div>
      {accountType === 'joint' && (
        <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.18)', borderRadius:10, padding:'12px 14px', marginBottom:14, textAlign:'left', fontSize:11, color:'var(--navy)' }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Equal share confirmed:</div>
          {holders.map((h,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:HOLDER_COLORS_OB[i], display:'inline-block', flexShrink:0 }}/>
              <span style={{ fontWeight:600 }}>{h.name}</span>
              <span style={{ color:'var(--gray-400)', marginLeft:'auto' }}>{(100/holderCount).toFixed(2)}%</span>
            </div>
          ))}
          <div style={{ marginTop:8, fontSize:10, color:'var(--gray-400)' }}>Mandate: <strong>{mandate}</strong> · Locked at creation</div>
        </div>
      )}
      <div style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, padding:'14px', marginBottom:14, textAlign:'left' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--navy)', marginBottom:7 }}>You can immediately:</div>
        {['Sign in to your wealth portal','Fund your wallet','Invest in available products'].map(a=>(
          <div key={a} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--navy)', marginBottom:4 }}>
            <CheckCircle size={11} color="var(--green)"/> {a}
          </div>
        ))}
        <div style={{ fontSize:12, fontWeight:700, color:'var(--red)', marginTop:10, marginBottom:6 }}>Locked until KYC verified:</div>
        {['Withdrawals & liquidations','Pre-termination requests','Account termination'].map(a=>(
          <div key={a} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--red)', marginBottom:4 }}>
            <LockIcon size={11}/> {a}
          </div>
        ))}
      </div>
      <p style={{ fontSize:12, color:'var(--gray-400)', marginBottom:20 }}>KYC documents can be submitted from your dashboard at any time.</p>
      <button onClick={onBack} style={{ background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:12, border:'none', borderRadius:8, padding:'12px 24px', cursor:'pointer' }}>PROCEED TO LOGIN</button>
    </div>
  );

  /* ── KYC step ── */
  if (step === 'kyc') {
    const docList = accountType === 'joint' ? jointDocs : indDocs;
    return (
      <div className="animate-in">
        <button onClick={() => setStep('verify')} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back</button>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'var(--navy)', marginBottom:4 }}>SUPPORTING DOCUMENTS</h2>
        <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
          {accountType === 'joint' ? `Joint KYC — All ${holderCount} Holders` : 'Individual KYC'} · All optional
        </p>
        <div style={{ fontSize:12, color:'#1d4ed8', background:'rgba(59,130,246,0.07)', padding:'10px 12px', borderRadius:8, marginBottom:12, display:'flex', alignItems:'flex-start', gap:6 }}>
          <Info size={13} style={{ flexShrink:0, marginTop:1 }}/>
          <span><strong>All documents are optional at onboarding.</strong> Full access (withdrawal, liquidation) requires KYC completion.</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {docList.map(doc => (
            <div key={doc.key} style={{ background: kycUploads[doc.key] ? 'rgba(34,197,94,0.06)' : '#f8fafc', border: `1px solid ${kycUploads[doc.key] ? 'rgba(34,197,94,0.3)' : '#e2e8f0'}`, borderRadius:10, padding:'10px 13px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--navy)', marginBottom:1 }}>{doc.label} <span style={{ fontSize:9, color:'var(--gold)', fontWeight:600 }}>OPTIONAL</span></div>
                {kycUploads[doc.key] ? <div style={{ fontSize:10, color:'var(--green)', fontWeight:600 }}>✓ {kycUploads[doc.key].name}</div>
                  : <div style={{ fontSize:10, color:'var(--gray-400)' }}>PDF, JPG, PNG · Max 5MB</div>}
              </div>
              <label style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'6px 11px', background: kycUploads[doc.key] ? 'rgba(34,197,94,0.12)' : 'rgba(13,27,53,0.07)', color: kycUploads[doc.key] ? 'var(--green)' : 'var(--navy)', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:700, border:'1px solid rgba(13,27,53,0.1)' }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleUpload(doc.key, e.target.files?.[0]||null)} />
                {kycUploads[doc.key] ? <><CheckCircle size={11}/> Done</> : <><Upload size={11}/> Upload</>}
              </label>
            </div>
          ))}
          <div style={{ fontSize:11, color:'var(--gray-400)', fontWeight:600 }}>{Object.keys(kycUploads).length}/{docList.length} documents uploaded (optional)</div>
          {regError && <div style={{ fontSize:12, color:'var(--red)', background:'rgba(239,68,68,0.08)', padding:'10px 12px', borderRadius:8 }}>{regError}</div>}
          <button onClick={async () => {
            setRegLoading(true); setRegError('');
            try {
              if (accountType === 'joint') {
                await authApi.registerIndividual({
                  accountType: 'joint',
                  primaryName: holders[0].name,
                  email: holders[0].email,
                  password: holders[0].password || '',
                  secondaryName: holders[1]?.name,
                  secondaryEmail: holders[1]?.email,
                  phone: holders[0].phone,
                });
              } else {
                await authApi.registerIndividual({
                  accountType: 'single',
                  primaryName: singleForm.name,
                  email: singleForm.email,
                  phone: singleForm.phone,
                  password: singleForm.password,
                });
              }
              kycApi.uploadIndividualDocs(kycUploads).catch(() => {});
              setStep('done');
            } catch(err) {
              const msg = err?.message || '';
              setRegError(msg.toLowerCase().includes('already') ? 'An account with this email already exists.' : 'Registration failed. Please try again.');
            }
            setRegLoading(false);
          }} disabled={regLoading} style={{
            background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
            letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4,
          }}>
            {regLoading ? 'Creating Account…' : <> CREATE ACCOUNT <ArrowRight size={15} /> </>}
          </button>
        </div>
      </div>
    );
  }

  /* ── Verify step ── */
  if (step === 'verify') {
    if (accountType === 'single') return (
      <div className="animate-in">
        <button onClick={() => setStep('form')} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back</button>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'var(--navy)', marginBottom:4 }}>IDENTITY VERIFICATION</h2>
        <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>NIN verification via NIBSS</p>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:6 }}>NIN (11 digits)</div>
            <div style={{ display:'flex', gap:8 }}>
              <input type="text" placeholder="12345678901" value={singleForm.nin}
                onChange={e => { setSingleForm(f=>({...f,nin:e.target.value.replace(/\D/g,'').slice(0,11)})); setSingleVerified(false); setSingleVerifyErr(''); }}
                maxLength={11} style={{ ...iPlain, flex:1, fontFamily:'monospace', fontSize:15, borderColor:singleVerified?'#22c55e':'#d1d5db' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor=singleVerified?'#22c55e':'#d1d5db'} />
              <button onClick={verifySingle} disabled={singleVerifying || singleForm.nin.length!==11 || !singleForm.name || singleVerified}
                style={{ padding:'10px 13px', background:singleVerified?'rgba(34,197,94,0.12)':'var(--navy)', color:singleVerified?'var(--green)':'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, flexShrink:0, opacity:(singleVerifying||singleForm.nin.length!==11||!singleForm.name||singleVerified)?0.5:1 }}>
                {singleVerifying?'⏳':singleVerified?'✓ DONE':'VERIFY'}
              </button>
            </div>
            {singleVerifyErr && <div style={{ fontSize:11, color:'var(--red)', marginTop:5 }}>{singleVerifyErr}</div>}
            {singleVerified && <div style={{ fontSize:11, color:'var(--green)', marginTop:5 }}>✓ NIN matched to <strong>{singleForm.name}</strong></div>}
          </div>
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:6 }}>BVN <span style={{ color:'var(--gray-300)', fontWeight:400 }}>(optional)</span></div>
            <input type="text" placeholder="22345678901" value={singleForm.bvn} onChange={e=>setSingleForm(f=>({...f,bvn:e.target.value.replace(/\D/g,'').slice(0,11)}))} maxLength={11}
              style={{ ...iPlain, fontFamily:'monospace', fontSize:14 }} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
          </div>
          <button onClick={() => setStep('kyc')} disabled={!singleVerified} style={{
            background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
            letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor:singleVerified?'pointer':'not-allowed',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:singleVerified?1:0.45,
          }}>CONTINUE TO DOCUMENTS <ArrowRight size={15}/></button>
          <button onClick={() => setStep('kyc')} style={{ background:'transparent', color:'var(--gray-400)', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:12, border:'1px dashed #d1d5db', borderRadius:10, padding:'12px', cursor:'pointer', textAlign:'center' }}>
            Skip — proceed with minimal access
          </button>
        </div>
      </div>
    );

    /* Joint verify — one NIN block per holder */
    return (
      <div className="animate-in">
        <button onClick={() => setStep('form')} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back</button>
        <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'var(--navy)', marginBottom:4 }}>IDENTITY VERIFICATION</h2>
        <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Verify NIN for all {holderCount} holders via NIBSS</p>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {holders.map((h, i) => (
            <div key={i} style={{ background:'#f8fafc', borderRadius:12, border:`1.5px solid ${HOLDER_COLORS_OB[i]}30`, padding:'14px' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:11, color:HOLDER_COLORS_OB[i], letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>
                {i===0?'Primary':i===1?'Secondary':'Third'} Holder — {h.name || '(name required above)'}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input type="text" placeholder="NIN — 11 digits" value={h.nin}
                  onChange={e => { updateHolder(i, { nin:e.target.value.replace(/\D/g,'').slice(0,11), verified:false, verifyErr:'' }); }}
                  maxLength={11} style={{ ...iPlain, flex:1, fontFamily:'monospace', fontSize:14, borderColor:h.verified?'#22c55e':'#d1d5db' }}
                  onFocus={e=>e.target.style.borderColor=HOLDER_COLORS_OB[i]} onBlur={e=>e.target.style.borderColor=h.verified?'#22c55e':'#d1d5db'} />
                <button onClick={() => verifyHolder(i)} disabled={h.verifying || h.nin.length!==11 || !h.name || h.verified}
                  style={{ padding:'9px 12px', background:h.verified?'rgba(34,197,94,0.12)':HOLDER_COLORS_OB[i], color:h.verified?'var(--green)':'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, flexShrink:0, whiteSpace:'nowrap', opacity:(h.verifying||h.nin.length!==11||!h.name||h.verified)?0.55:1 }}>
                  {h.verifying?'⏳':h.verified?'✓ DONE':'VERIFY'}
                </button>
              </div>
              {h.verifyErr && <div style={{ fontSize:10, color:'var(--red)', marginTop:4 }}>{h.verifyErr}</div>}
              {h.verified && <div style={{ fontSize:10, color:'var(--green)', marginTop:4 }}>✓ NIN matched to <strong>{h.name}</strong></div>}
            </div>
          ))}
          <div style={{ background:'rgba(232,184,75,0.07)', border:'1px solid rgba(232,184,75,0.2)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', fontWeight:700, marginBottom:8 }}>Account Mandate (locked at creation)</div>
            <div style={{ display:'flex', gap:10 }}>
              {[['AND','AND Mandate','All holders must authorise'],['OR','OR Mandate','Any holder may authorise']].map(([id,label,desc])=>(
                <div key={id} onClick={()=>setMandate(id)} style={{ flex:1, padding:'10px 12px', borderRadius:10, border:`2px solid ${mandate===id?'var(--navy)':'#e2e8f0'}`, cursor:'pointer', background:mandate===id?'var(--navy)':'white', transition:'all 0.2s' }}>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:11, color:mandate===id?'var(--gold)':'var(--navy)', marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:9, color:mandate===id?'rgba(255,255,255,0.55)':'var(--gray-400)' }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:10, color:'var(--red)', marginTop:6, fontWeight:600 }}>⚠ Mandate cannot be changed after creation.</div>
          </div>
          <button onClick={() => setStep('kyc')} disabled={!allHoldersVerified} style={{
            background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
            letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor:allHoldersVerified?'pointer':'not-allowed',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:allHoldersVerified?1:0.45,
          }}>CONTINUE TO DOCUMENTS <ArrowRight size={15}/></button>
          <button onClick={() => setStep('kyc')} style={{ background:'transparent', color:'var(--gray-400)', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:12, border:'1px dashed #d1d5db', borderRadius:10, padding:'12px', cursor:'pointer', textAlign:'center' }}>
            Skip — proceed with minimal access
          </button>
        </div>
      </div>
    );
  }

  /* ── Form step ── */
  return (
    <div className="animate-in">
      <button onClick={onBack} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back to Login</button>
      <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--navy)', marginBottom:4 }}>CREATE ACCOUNT</h2>
      <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:20 }}>Select account type and fill in details</p>

      {/* Account type toggle */}
      <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:4, marginBottom:22 }}>
        {['single','joint'].map(t => (
          <button key={t} onClick={() => { setAccountType(t); setKycUploads({}); setSingleVerified(false); }}
            style={{ flex:1, padding:'9px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, letterSpacing:'0.05em', background:accountType===t?'white':'transparent', color:accountType===t?'var(--navy)':'var(--gray-400)', boxShadow:accountType===t?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.2s' }}>
            {t === 'single' ? 'Single Account' : 'Joint Account'}
          </button>
        ))}
      </div>

      {/* Single account form */}
      {accountType === 'single' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Full Legal Name</div>
            <div style={{ position:'relative' }}>
              <User size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type="text" placeholder="JOHN DOE" value={singleForm.name} onChange={e=>setSingleForm(f=>({...f,name:e.target.value}))} style={iStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Gmail Address <span style={{ color:'var(--red)', fontWeight:700 }}>*Gmail required</span></div>
            <div style={{ position:'relative' }}>
              <Mail size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type="email" placeholder="you@gmail.com" value={singleForm.email} onChange={e=>setSingleForm(f=>({...f,email:e.target.value}))} style={{ ...iStyle, borderColor: singleForm.email && !isGmail(singleForm.email)?'var(--red)':'#d1d5db' }} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor=singleForm.email&&!isGmail(singleForm.email)?'var(--red)':'#d1d5db'} />
            </div>
            {singleForm.email && !isGmail(singleForm.email) && <div style={{ fontSize:11, color:'var(--red)', marginTop:4 }}>Only Gmail addresses are accepted (@gmail.com)</div>}
          </div>
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Phone Number</div>
            <div style={{ position:'relative' }}>
              <Phone size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type="tel" placeholder="+234 800 000 0000" value={singleForm.phone} onChange={e=>setSingleForm(f=>({...f,phone:e.target.value}))} style={iStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Secure Password</div>
            <div style={{ position:'relative' }}>
              <Lock size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type="password" placeholder="min 8 characters" value={singleForm.password} onChange={e=>setSingleForm(f=>({...f,password:e.target.value}))} style={iStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
            </div>
          </div>
          <div style={{ fontSize:11, color:'#1d4ed8', background:'rgba(59,130,246,0.07)', padding:'10px 12px', borderRadius:8, display:'flex', alignItems:'flex-start', gap:6 }}>
            <Info size={13} style={{ flexShrink:0, marginTop:1 }}/>
            <span>Next: <strong>NIN verification</strong> via NIBSS. KYC documents are optional at this stage.</span>
          </div>
          <button onClick={() => singleValid && setStep('verify')} disabled={!singleValid} style={{ background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13, letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor:singleValid?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:singleValid?1:0.5 }}>
            NEXT: VERIFY IDENTITY <ArrowRight size={15}/>
          </button>
        </div>
      )}

      {/* Joint account form */}
      {accountType === 'joint' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Holder count selector */}
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:8, fontWeight:700 }}>Number of Account Holders</div>
            <div style={{ display:'flex', gap:10 }}>
              {[2,3].map(n => (
                <button key={n} onClick={() => changeHolderCount(n)} style={{ flex:1, padding:'12px', borderRadius:10, border:`2px solid ${holderCount===n?'var(--navy)':'#e2e8f0'}`, cursor:'pointer', background:holderCount===n?'var(--navy)':'white', transition:'all 0.2s', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:14, color:holderCount===n?'var(--gold)':'var(--navy)' }}>
                  {n} Holders
                  <div style={{ fontSize:10, fontWeight:400, color:holderCount===n?'rgba(255,255,255,0.55)':'var(--gray-400)', marginTop:2 }}>{(100/n).toFixed(2)}% each</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic holder fields */}
          {holders.map((h, i) => (
            <div key={i} style={{ background:'#f8fafc', borderRadius:12, border:`1.5px solid ${HOLDER_COLORS_OB[i]}40`, padding:'14px 16px' }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:11, color:HOLDER_COLORS_OB[i], letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:22, height:22, borderRadius:'50%', background:HOLDER_COLORS_OB[i], display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white', fontWeight:800 }}>{i+1}</span>
                {i===0?'Primary':i===1?'Secondary':'Third'} Holder
                <span style={{ marginLeft:'auto', fontSize:10, color:'var(--gray-400)' }}>{(100/holderCount).toFixed(2)}% share</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:5 }}>Full Legal Name</div>
                  <input type="text" placeholder={`Holder ${i+1} full name`} value={h.name}
                    onChange={e => updateHolder(i, { name:e.target.value })}
                    style={iPlain} onFocus={e=>e.target.style.borderColor=HOLDER_COLORS_OB[i]} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
                </div>
                <div>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:5 }}>Gmail Address <span style={{ color:'var(--red)', fontWeight:700 }}>*required</span></div>
                  <input type="email" placeholder="holder@gmail.com" value={h.email}
                    onChange={e => updateHolder(i, { email:e.target.value })}
                    style={{ ...iPlain, borderColor:h.email&&!isGmail(h.email)?'var(--red)':'#d1d5db' }}
                    onFocus={e=>e.target.style.borderColor=HOLDER_COLORS_OB[i]} onBlur={e=>e.target.style.borderColor=h.email&&!isGmail(h.email)?'var(--red)':'#d1d5db'} />
                  {h.email && !isGmail(h.email) && <div style={{ fontSize:10, color:'var(--red)', marginTop:3 }}>Only @gmail.com accepted</div>}
                </div>
                <div>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:5 }}>Phone Number</div>
                  <input type="tel" placeholder="+234 800 000 0000" value={h.phone}
                    onChange={e => updateHolder(i, { phone:e.target.value })}
                    style={iPlain} onFocus={e=>e.target.style.borderColor=HOLDER_COLORS_OB[i]} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
                </div>
              </div>
            </div>
          ))}

          {/* Account password */}
          <div style={{ background:'white', borderRadius:12, border:'1.5px solid #e2e8f0', padding:'14px 16px' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:11, color:'var(--navy)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
              <Lock size={12}/> Account Password
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:5 }}>
                  Shared Account Password <span style={{ color:'var(--red)', fontWeight:700 }}>*required</span>
                </div>
                <input type="password" placeholder="min 6 characters" value={holders[0]?.password||''} onChange={e => updateHolder(0, { password:e.target.value })}
                  style={iPlain} onFocus={e=>e.target.style.borderColor=HOLDER_COLORS_OB[0]} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
              </div>
              <div style={{ fontSize:10, color:'#1d4ed8', background:'rgba(59,130,246,0.07)', padding:'9px 12px', borderRadius:8, display:'flex', alignItems:'flex-start', gap:6 }}>
                <Mail size={11} style={{ flexShrink:0, marginTop:1 }}/>
                <span>The primary holder uses their Gmail + this password to log in. <strong>All other holders</strong> will receive a secure login link to their registered Gmail addresses.</span>
              </div>
            </div>
          </div>

          {/* Equal share note */}
          <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:10, padding:'11px 14px', fontSize:11, color:'var(--navy)', display:'flex', alignItems:'flex-start', gap:8 }}>
            <Shield size={13} color="var(--green)" style={{ flexShrink:0, marginTop:1 }}/>
            <span><strong>Equal Share Policy:</strong> All assets are distributed equally — {(100/holderCount).toFixed(2)}% per holder. This cannot be changed after registration. All Gmail addresses are required for account notifications.</span>
          </div>

          <button onClick={() => jointFormValid && setStep('verify')} disabled={!jointFormValid}
            style={{ background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13, letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor:jointFormValid?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:jointFormValid?1:0.5 }}>
            NEXT: VERIFY ALL HOLDERS <ArrowRight size={15}/>
          </button>
        </div>
      )}
    </div>
  );
}
