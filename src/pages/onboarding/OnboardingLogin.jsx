import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Building2, User, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { DEMO_USERS, KYC_REQUIREMENTS } from '../../store/useAppStore';
import useAppStore from '../../store/useAppStore';
import { authApi, setTokens, kycApi } from '../../services/api';

const inputStyle = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
  padding: '11px 14px 11px 38px', fontFamily: 'DM Sans,sans-serif',
  fontSize: 14, color: '#1e293b', background: 'white', outline: 'none',
  transition: 'border-color 0.2s',
};

export default function OnboardingLogin() {
  const [tab, setTab]           = useState('corporate'); // corporate | individual
  const [mode, setMode]         = useState('signin');    // signin | apply | kyc
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [forgot, setForgot]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Apply form
  const [applyForm, setApplyForm] = useState({ entityName:'', email:'', password:'' });
  const [kycUploads, setKycUploads] = useState({});
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [createStep, setCreateStep] = useState('form'); // 'form' | 'kyc'

  const { login } = useAppStore();
  const navigate = useNavigate();

  const isCorp = tab === 'corporate';

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Try backend API login first
    try {
      const res = await authApi.login(email, password);
      if (res && res.accessToken) {
        setTokens(res);
        // Get user profile from backend
        const me = await authApi.getMe();
        const role = me.role?.toLowerCase() || 'individual';
        login({ ...me, role, email, name: me.name || me.companyName || email });
        if (role === 'admin')       navigate('/admin');
        else if (role === 'corporate')  navigate('/corporate/treasury');
        else if (role === 'individual') navigate('/individual/portfolio');
        else if (role === 'joint')      navigate('/joint/portfolio');
        setLoading(false);
        return;
      }
    } catch {
      // Backend unavailable or invalid — fall through to demo users
    }

    // Fall back to demo users
    await new Promise(r => setTimeout(r, 400));
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (!user) { setError('Invalid credentials. Check the demo logins below.'); setLoading(false); return; }
    login(user);
    if (user.role === 'admin')       navigate('/admin');
    else if (user.role === 'corporate')  navigate('/corporate/treasury');
    else if (user.role === 'individual') navigate('/individual/portfolio');
    else if (user.role === 'joint')      navigate('/joint/portfolio');
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

      {/* Demo credentials */}
      <div style={{ marginTop:36, padding:'16px', background:'rgba(255,255,255,0.06)', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize:9, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10, fontWeight:700 }}>Demo Logins</div>
        {DEMO_USERS.filter(u => isCorp ? u.role==='corporate'||u.role==='admin' : u.role==='individual'||u.role==='joint').map(u => (
          <div key={u.email} style={{ marginBottom:6, cursor:'pointer' }}
            onClick={() => { setEmail(u.email); setPassword(u.password); setMode('signin'); }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontFamily:'monospace' }}>{u.email}</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontFamily:'monospace' }}>{u.password} · {u.adminRole || u.role}</div>
          </div>
        ))}
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:6 }}>↑ Click to auto-fill</div>
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
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Secure Password</div>
                  <div style={{ position:'relative' }}>
                    <Lock size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="password" placeholder="••••••••••" value={applyForm.password}
                      onChange={e => setApplyForm(f => ({...f, password: e.target.value}))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  </div>
                </div>
                <button onClick={() => setMode('kyc')} style={{
                  background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
                  letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4,
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
              <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Upload ALL required documents to proceed</p>
              <div style={{ fontSize:12, color:'var(--red)', background:'rgba(239,68,68,0.07)', padding:'10px 12px', borderRadius:8, marginBottom:18 }}>
                <strong>All documents are required.</strong> You must upload each file before submitting.
              </div>
              {kycSubmitted ? (
                <div style={{ textAlign:'center', padding:'30px 0' }}>
                  <CheckCircle size={48} color="var(--green)" style={{ marginBottom:14 }}/>
                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--navy)', marginBottom:8 }}>Submitted for Review</div>
                  <p style={{ fontSize:12, color:'var(--gray-400)', marginBottom:20 }}>Your KYC documents have been submitted. Our compliance team will review within 1–2 business days. You will be notified by email.</p>
                  <button onClick={() => setMode('signin')} style={{ background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:12, border:'none', borderRadius:8, padding:'12px 24px', cursor:'pointer' }}>BACK TO LOGIN</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {kycDocs.map(doc => (
                    <div key={doc.key} style={{ background: kycUploads[doc.key] ? 'rgba(34,197,94,0.06)' : '#f8fafc', border: `1px solid ${kycUploads[doc.key] ? 'rgba(34,197,94,0.3)' : '#e2e8f0'}`, borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'var(--navy)', marginBottom:2 }}>{doc.label}</div>
                        {kycUploads[doc.key] ? (
                          <div style={{ fontSize:11, color:'var(--green)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>✓ {kycUploads[doc.key].name}</div>
                        ) : (
                          <div style={{ fontSize:10, color:'var(--gray-400)' }}>PDF, JPG, or PNG — Max 5MB</div>
                        )}
                      </div>
                      <label style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background: kycUploads[doc.key] ? 'rgba(34,197,94,0.12)' : 'var(--navy)', color: kycUploads[doc.key] ? 'var(--green)' : 'white', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleKycUpload(doc.key, e.target.files?.[0]||null)} />
                        {kycUploads[doc.key] ? <><CheckCircle size={12}/> Uploaded</> : <><Upload size={12}/> Upload</>}
                      </label>
                    </div>
                  ))}
                  <div style={{ marginTop:4, fontSize:11, color: allUploaded ? 'var(--green)' : 'var(--gray-400)', fontWeight:600 }}>
                    {Object.keys(kycUploads).length}/{kycDocs.length} documents uploaded
                  </div>
                  {!allUploaded && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--red)', background:'rgba(239,68,68,0.06)', padding:'8px 12px', borderRadius:8 }}>
                      <AlertCircle size={12}/> Please upload all required documents before submitting.
                    </div>
                  )}
                  <button onClick={() => {
                    if (!allUploaded) return;
                    // Try uploading to backend
                    (isCorp ? kycApi.uploadCorporateDocs(kycUploads) : kycApi.uploadIndividualDocs(kycUploads)).catch(() => {});
                    setKycSubmitted(true);
                  }} disabled={!allUploaded} style={{
                    background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
                    letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor: allUploaded ? 'pointer' : 'not-allowed',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, opacity: allUploaded ? 1 : 0.45,
                  }}>
                    SUBMIT FOR REVIEW <ArrowRight size={15} />
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

function IndividualCreate({ onBack }) {
  const [accountType, setAccountType] = useState('single');
  const [step, setStep] = useState('form'); // 'form' | 'kyc'
  const [form, setForm] = useState({ primaryName:'', secondaryName:'', email:'', password:'' });
  const [kycUploads, setKycUploads] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const handleUpload = (key, file) => setKycUploads(prev => ({ ...prev, [key]: file }));

  const iStyle = { width:'100%', border:'1px solid #d1d5db', borderRadius:8, padding:'11px 14px 11px 38px', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#1e293b', background:'white', outline:'none', transition:'border-color 0.2s' };

  const docList = accountType === 'joint' ? KYC_REQUIREMENTS.joint : KYC_REQUIREMENTS.individual;
  const allUploaded = docList.every(d => kycUploads[d.key]);
  const formValid = form.primaryName && form.email && form.password && (accountType !== 'joint' || form.secondaryName);

  if (submitted) return (
    <div className="animate-in" style={{ textAlign:'center', padding:'30px 0' }}>
      <CheckCircle size={48} color="var(--green)" style={{ marginBottom:14 }}/>
      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'var(--navy)', marginBottom:8 }}>Application Submitted</div>
      <p style={{ fontSize:12, color:'var(--gray-400)', marginBottom:20 }}>All KYC documents received. Our team will review and activate your account within 1–2 business days.</p>
      <button onClick={onBack} style={{ background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:12, border:'none', borderRadius:8, padding:'12px 24px', cursor:'pointer' }}>BACK TO LOGIN</button>
    </div>
  );

  if (step === 'kyc') return (
    <div className="animate-in">
      <button onClick={() => { setStep('form'); setKycUploads({}); }} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back to Account Details</button>
      <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--navy)', marginBottom:4 }}>IDENTITY VERIFICATION</h2>
      <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{accountType === 'joint' ? 'Joint KYC — Both Holders' : 'Individual KYC'} · All documents required</p>
      <div style={{ fontSize:12, color:'var(--red)', background:'rgba(239,68,68,0.07)', padding:'10px 12px', borderRadius:8, marginBottom:18 }}>
        <strong>All documents are mandatory.</strong> Upload each file before submitting.
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {docList.map(doc => (
          <div key={doc.key} style={{ background: kycUploads[doc.key] ? 'rgba(34,197,94,0.06)' : '#f8fafc', border: `1px solid ${kycUploads[doc.key] ? 'rgba(34,197,94,0.3)' : '#e2e8f0'}`, borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--navy)', marginBottom:2 }}>{doc.label}</div>
              {kycUploads[doc.key] ? (
                <div style={{ fontSize:11, color:'var(--green)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>✓ {kycUploads[doc.key].name}</div>
              ) : (
                <div style={{ fontSize:10, color:'var(--gray-400)' }}>PDF, JPG, or PNG — Max 5MB</div>
              )}
            </div>
            <label style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background: kycUploads[doc.key] ? 'rgba(34,197,94,0.12)' : 'var(--navy)', color: kycUploads[doc.key] ? 'var(--green)' : 'white', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:700 }}>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => handleUpload(doc.key, e.target.files?.[0]||null)} />
              {kycUploads[doc.key] ? <><CheckCircle size={12}/> Uploaded</> : <><Upload size={12}/> Upload</>}
            </label>
          </div>
        ))}
        <div style={{ fontSize:11, color: allUploaded ? 'var(--green)' : 'var(--gray-400)', fontWeight:600 }}>
          {Object.keys(kycUploads).length}/{docList.length} documents uploaded
        </div>
        {!allUploaded && (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--red)', background:'rgba(239,68,68,0.06)', padding:'8px 12px', borderRadius:8 }}>
            <AlertCircle size={12}/> Please upload all required documents before submitting.
          </div>
        )}
        <button onClick={() => allUploaded && setSubmitted(true)} disabled={!allUploaded} style={{
          background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
          letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor: allUploaded ? 'pointer' : 'not-allowed',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, opacity: allUploaded ? 1 : 0.45,
        }}>
          SUBMIT APPLICATION <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-in">
      <button onClick={onBack} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back to Login</button>
      <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--navy)', marginBottom:4 }}>CREATE ACCOUNT</h2>
      <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:20 }}>Select account type and provide details</p>

      <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:4, marginBottom:22 }}>
        {['single','joint'].map(t => (
          <button key={t} onClick={() => { setAccountType(t); setKycUploads({}); }} style={{
            flex:1, padding:'9px', borderRadius:7, border:'none', cursor:'pointer',
            fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:12, letterSpacing:'0.05em',
            background: accountType===t ? 'white' : 'transparent',
            color: accountType===t ? 'var(--navy)' : 'var(--gray-400)',
            boxShadow: accountType===t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition:'all 0.2s',
          }}>
            {t === 'single' ? 'Single Account' : 'Joint Account'}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {accountType === 'joint' ? (
          <>
            <div>
              <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Primary Applicant Name</div>
              <div style={{ position:'relative' }}>
                <User size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input type="text" placeholder="JOHN DOE" value={form.primaryName} onChange={e => set('primaryName',e.target.value)} style={iStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Secondary Applicant Name</div>
              <div style={{ position:'relative' }}>
                <User size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input type="text" placeholder="JANE DOE" value={form.secondaryName} onChange={e => set('secondaryName',e.target.value)} style={iStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
              </div>
            </div>
          </>
        ) : (
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Full Name</div>
            <div style={{ position:'relative' }}>
              <User size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type="text" placeholder="JOHN DOE" value={form.primaryName} onChange={e => set('primaryName',e.target.value)} style={iStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Email Address</div>
          <div style={{ position:'relative' }}>
            <Mail size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email',e.target.value)} style={iStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
          </div>
        </div>
        <div>
          <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Secure Password</div>
          <div style={{ position:'relative' }}>
            <Lock size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type="password" placeholder="••••••••••" value={form.password} onChange={e => set('password',e.target.value)} style={iStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
          </div>
        </div>
        <button onClick={() => formValid && setStep('kyc')} disabled={!formValid} style={{
          background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
          letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor: formValid ? 'pointer' : 'not-allowed',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, opacity: formValid ? 1 : 0.5,
        }}>
          CONTINUE TO KYC <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
