import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Building2, User } from 'lucide-react';
import { DEMO_USERS } from '../../store/useAppStore';
import useAppStore from '../../store/useAppStore';

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
  const [kycForm, setKycForm]     = useState({ docType:'', regNum:'', file: null });

  const { login } = useAppStore();
  const navigate = useNavigate();

  const isCorp = tab === 'corporate';

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
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

  const DOC_TYPES = isCorp
    ? ['Certificate of Incorporation','Tax Clearance Certificate','SCUML Certificate']
    : ['BVN + Utility Bill','NIN + Passport Photo','Drivers License + Bank Statement'];

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

          {/* ── KYC Step ── */}
          {mode === 'kyc' && (
            <div className="animate-in">
              <button onClick={() => setMode('apply')} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back to Registration</button>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--navy)', marginBottom:4 }}>ENTITY VERIFICATION</h2>
              <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:24 }}>Complete Mandatory Compliance (1/1)</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Primary Document Type</div>
                  <div style={{ position:'relative' }}>
                    <select value={kycForm.docType} onChange={e => setKycForm(f => ({...f, docType: e.target.value}))}
                      style={{ ...inputStyle, paddingLeft:14, appearance:'none', cursor:'pointer' }}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'}>
                      <option value="">Select Verification Doc</option>
                      {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--gray-400)' }}>▾</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Document Reg Number</div>
                  <div style={{ position:'relative' }}>
                    <Lock size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="text" placeholder="RC-000000" value={kycForm.regNum}
                      onChange={e => setKycForm(f => ({...f, regNum: e.target.value}))} style={inputStyle}
                      onFocus={e => e.target.style.borderColor='var(--navy)'}
                      onBlur={e => e.target.style.borderColor='#d1d5db'} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Upload Authenticated Copy</div>
                  <label style={{
                    display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                    padding:'24px', border:'1.5px dashed #d1d5db', borderRadius:10,
                    cursor:'pointer', background:'#f8fafc', transition:'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--navy)'; e.currentTarget.style.background='white'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#d1d5db'; e.currentTarget.style.background='#f8fafc'; }}
                  >
                    <input type="file" style={{ display:'none' }} onChange={e => setKycForm(f => ({...f, file: e.target.files?.[0]||null}))} />
                    <span style={{ fontSize:20 }}>📎</span>
                    <span style={{ fontSize:12, color: kycForm.file ? 'var(--navy)' : 'var(--gray-400)', fontWeight: kycForm.file ? 600 : 400 }}>
                      {kycForm.file ? kycForm.file.name : 'Browse PDF or Image'}
                    </span>
                  </label>
                </div>
                <button onClick={() => setMode('signin')} style={{
                  background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
                  letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4,
                }}>
                  SUBMIT FOR REVIEW <ArrowRight size={15} />
                </button>
              </div>
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
  const [form, setForm] = useState({ primaryName:'', secondaryName:'', email:'', password:'' });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const inputStyle = { width:'100%', border:'1px solid #d1d5db', borderRadius:8, padding:'11px 14px 11px 38px', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#1e293b', background:'white', outline:'none', transition:'border-color 0.2s' };

  return (
    <div className="animate-in">
      <button onClick={onBack} style={{ background:'none',border:'none',cursor:'pointer',color:'#3b6ef8',fontSize:12,fontWeight:700,marginBottom:16,padding:0 }}>← Back to Login</button>
      <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--navy)', marginBottom:4 }}>CREATE ACCOUNT</h2>
      <p style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:20 }}>Select account type and proceed</p>

      {/* Account type tabs */}
      <div style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:4, marginBottom:22 }}>
        {['single','joint'].map(t => (
          <button key={t} onClick={() => setAccountType(t)} style={{
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
                <input type="text" placeholder="JOHN DOE" value={form.primaryName} onChange={e => set('primaryName',e.target.value)} style={inputStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Secondary Applicant Name</div>
              <div style={{ position:'relative' }}>
                <User size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input type="text" placeholder="JANE DOE" value={form.secondaryName} onChange={e => set('secondaryName',e.target.value)} style={inputStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
              </div>
            </div>
          </>
        ) : (
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Full Name</div>
            <div style={{ position:'relative' }}>
              <User size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input type="text" placeholder="JOHN DOE" value={form.primaryName} onChange={e => set('primaryName',e.target.value)} style={inputStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Email Address</div>
          <div style={{ position:'relative' }}>
            <Mail size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email',e.target.value)} style={inputStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
          </div>
        </div>
        <div>
          <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:7 }}>Secure Password</div>
          <div style={{ position:'relative' }}>
            <Lock size={14} color="var(--gray-400)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input type="password" placeholder="••••••••••" value={form.password} onChange={e => set('password',e.target.value)} style={inputStyle} onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='#d1d5db'} />
          </div>
        </div>
        <button onClick={onBack} style={{
          background:'var(--navy)', color:'white', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:13,
          letterSpacing:'0.08em', border:'none', borderRadius:10, padding:'14px', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4,
        }}>
          CONTINUE TO KYC <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
