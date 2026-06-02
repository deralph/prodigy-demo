import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, FileText, Building2, Shield, User } from 'lucide-react';
import { KYC_REQUIREMENTS } from '../../store/useAppStore';
import useAppStore from '../../store/useAppStore';
import { authApi, setTokens, kycApi, nibssApi } from '../../services/api';

import AuthLeftPanel        from '../../components/auth/AuthLeftPanel';
import AuthTabToggle        from '../../components/auth/AuthTabToggle';
import AuthInput            from '../../components/auth/AuthInput';
import AuthSubmitButton     from '../../components/auth/AuthSubmitButton';
import KycDocUpload         from '../../components/auth/KycDocUpload';
import AccountCreatedScreen from '../../components/auth/AccountCreatedScreen';
import NibssVerifyField     from '../../components/auth/NibssVerifyField';

/* ── Helpers ─────────────────────────────────────── */
const isGmail = email => /^[a-zA-Z0-9._%+\-]+@gmail\.com$/.test(email.trim());
const HOLDER_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6'];

async function verifyNibss(type, number, expectedName) {
  const clean = number.replace(/\D/g, '');
  if (type === 'nin' && clean.length !== 11) return { ok: false, message: 'NIN must be exactly 11 digits.' };
  if (type === 'bvn' && clean.length !== 11) return { ok: false, message: 'BVN must be exactly 11 digits.' };
  if (!expectedName || expectedName.trim().length < 3) return { ok: false, message: 'Full name is required for verification.' };
  try {
    let result;
    if (type === 'nin')      result = await nibssApi.verifyNin(clean, expectedName.trim());
    else if (type === 'bvn') result = await nibssApi.verifyBvn(clean, expectedName.trim());
    if (result?.verified) return { ok: true, message: `${type.toUpperCase()} verified via ${type === 'bvn' ? 'QoreID' : 'NIBSS'}.` };
    return { ok: false, message: result?.message || `${type.toUpperCase()} could not be verified.` };
  } catch {
    return { ok: false, message: 'Verification service unavailable. Ensure the server is running.' };
  }
}

function buildJointDocs(n) {
  const docs = [];
  for (let i = 1; i <= n; i++) {
    const ord = i === 1 ? 'Primary' : i === 2 ? 'Secondary' : 'Third';
    docs.push(
      { key: `valid_id_h${i}`,  label: `${ord} Holder — Valid ID` },
      { key: `nin_h${i}`,       label: `${ord} Holder — NIN` },
      { key: `passport_h${i}`,  label: `${ord} Holder — Passport Photo` },
      { key: `sig_h${i}`,       label: `${ord} Holder — Signature` },
      { key: `utility_h${i}`,   label: `${ord} Holder — Utility Bill` },
    );
  }
  return docs;
}

/* ── Sign-in form ─────────────────────────────────── */
function SignInForm({ isCorp, onApply, onCreate }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }             = useAppStore();
  const navigate              = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res?.accessToken) {
        setTokens(res);
        const me   = await authApi.getMe();
        const role = me.role?.toLowerCase() || 'individual';
        const c    = me.client || {};
        login({ ...me, role, email, name: c.name || me.adminUser?.name || email, clientId: c.clientRef || me.adminUser?.adminRef || me.clientId, adminRole: (me.adminUser?.role ?? null)?.toLowerCase() ?? null, clientType: c.type ?? null, phone: c.phone ?? null, client: c });
        if (role === 'admin')       navigate('/admin');
        else if (role === 'corporate')  navigate('/corporate/treasury');
        else if (role === 'individual') navigate('/individual/portfolio');
        else if (role === 'joint')      navigate('/joint/portfolio');
        setLoading(false); return;
      }
      setError('Login failed. Please check your credentials.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password'))
        setError('Invalid email or password.');
      else if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('suspended'))
        setError('Your account has been suspended. Contact support.');
      else
        setError('Unable to connect. Please ensure the server is running.');
    }
    setLoading(false);
  };

  return (
    <div className="animate-in">
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 26, color: 'var(--navy)', marginBottom: 4 }}>SIGN IN</h2>
      <p style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 28 }}>
        Access your {isCorp ? 'corporate treasury' : 'wealth portal'}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthInput
          label={isCorp ? 'Institutional Email' : 'Email Address'}
          icon={Mail}
          type="email"
          placeholder={isCorp ? 'admin@company.com' : 'you@email.com'}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <AuthInput
          label="Password"
          icon={Lock}
          type="password"
          placeholder="••••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          rightSlot={
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b6ef8', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>
              FORGOT?
            </button>
          }
        />
        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', padding: '10px 12px', borderRadius: 8 }}>{error}</div>
        )}
        <AuthSubmitButton label="AUTHENTICATE" loading={loading} loadingLabel="Authenticating..." />
      </form>

      {isCorp && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-400)', marginTop: 20 }}>
          New corporate entity?{' '}
          <button onClick={onApply} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b6ef8', fontWeight: 700, fontSize: 12 }}>Apply for Account</button>
        </p>
      )}
      {!isCorp && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-400)', marginTop: 20 }}>
          <button onClick={onCreate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b6ef8', fontWeight: 700, fontSize: 12 }}>Create Account</button>
        </p>
      )}
    </div>
  );
}

/* ── Corporate Apply form ─────────────────────────── */
function CorporateApplyForm({ onBack, onNext }) {
  const [form, setForm] = useState({ entityName: '', email: '', password: '', phone: '', rcNumber: '', cacNumber: '' });

  const upd = patch => setForm(f => ({ ...f, ...patch }));

  const canContinue = !!form.email && !!form.password;

  return (
    <div className="animate-in">
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b6ef8', fontSize: 12, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Back to Login</button>
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>APPLY FOR ACCOUNT</h2>
      <p style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>Initiate Corporate Onboarding</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthInput label="Registered Entity Name" icon={Building2} placeholder="COMPANY LTD" value={form.entityName} onChange={e => upd({ entityName: e.target.value })} />

        <AuthInput label="CAC Registration Number" icon={FileText} placeholder="e.g. RC123456" value={form.cacNumber} onChange={e => upd({ cacNumber: e.target.value })} />
        <AuthInput label="Primary Contact Email" icon={Mail} type="email" placeholder="admin@company.com" value={form.email} onChange={e => upd({ email: e.target.value })} />
        <AuthInput label="Phone Number" icon={Phone} type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={e => upd({ phone: e.target.value })} />
        <AuthInput label="RC Number" icon={FileText} placeholder="RC123456" value={form.rcNumber} onChange={e => upd({ rcNumber: e.target.value })} />
        <AuthInput label="Secure Password" icon={Lock} type="password" placeholder="min 8 characters" value={form.password} onChange={e => upd({ password: e.target.value })} />

        <AuthSubmitButton label="CONTINUE TO KYC" disabled={!canContinue} onClick={() => onNext(form)} />
      </div>
    </div>
  );
}

/* ── Corporate KYC step ───────────────────────────── */
function CorporateKycStep({ applyForm, onBack, onDone }) {
  const [uploads, setUploads] = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const docs = KYC_REQUIREMENTS.corporate;

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await authApi.registerCorporate({ entityName: applyForm.entityName, email: applyForm.email, password: applyForm.password, phone: applyForm.phone, rcNumber: applyForm.rcNumber });
      kycApi.uploadCorporateDocs(uploads).catch(() => {});
      setSubmitted(true);
    } catch (err) {
      const msg = err?.message || '';
      setError(msg.toLowerCase().includes('already') ? 'An account with this email already exists.' : 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  if (submitted) return (
    <AccountCreatedScreen
      title="Account Created — Pending Full Verification"
      onContinue={onDone}
      unlocked={['Sign in and access your treasury dashboard', 'Fund your wallet', 'Make investments in available products']}
      locked={['Withdrawals & liquidations', 'Account termination', 'Other sensitive operations']}
      note="Our compliance team will review submitted documents within 1–2 business days."
    />
  );

  return (
    <div className="animate-in">
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b6ef8', fontSize: 12, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Back to Registration</button>
      <KycDocUpload
        title="ENTITY KYC"
        subtitle="Upload documents — all optional at this stage"
        docs={docs}
        uploads={uploads}
        onUpload={(key, file) => setUploads(p => ({ ...p, [key]: file }))}
        infoNote={<><strong>Documents are optional during onboarding.</strong> You may invest immediately. However, <strong>liquidation, withdrawal and other sensitive operations</strong> require full KYC approval.</>}
        skipNote="You can skip and submit now — documents can be uploaded later from your KYC dashboard."
      />
      {error && <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', padding: '10px 12px', borderRadius: 8, marginTop: 12 }}>{error}</div>}
      <AuthSubmitButton label="CREATE ACCOUNT" loading={loading} loadingLabel="Creating Account…" onClick={handleSubmit} style={{ marginTop: 14 }} />
    </div>
  );
}

/* ── Individual / Joint create account ─────────────── */
function IndividualCreate({ onBack }) {
  const [accountType, setAccountType] = useState('single');
  const [step, setStep]               = useState('form'); // form | verify | kyc | done
  const [uploads, setUploads]         = useState({});
  const [regLoading, setRegLoading]   = useState(false);
  const [regError,   setRegError]     = useState('');

  /* ── Single state ── */
  const [single, setSingle]         = useState({ name: '', email: '', phone: '', password: '', bvn: '' });
  const [singleVer, setSingleVer]   = useState({ verified: false, verifying: false, error: '' });

  /* ── Joint state ── */
  const [holderCount, setHolderCount] = useState(2);
  const [mandate,     setMandate]     = useState('AND');
  const [holders, setHolders]         = useState([
    { name: '', email: '', phone: '', bvn: '', verified: false, verifying: false, verifyErr: '', password: '' },
    { name: '', email: '', phone: '', bvn: '', verified: false, verifying: false, verifyErr: '', password: '' },
  ]);

  const updHolder = (i, patch) => setHolders(prev => prev.map((h, idx) => idx === i ? { ...h, ...patch } : h));

  const changeHolderCount = n => {
    setHolderCount(n);
    setHolders(prev => {
      const blank = { name: '', email: '', phone: '', bvn: '', verified: false, verifying: false, verifyErr: '', password: '' };
      if (n > prev.length) return [...prev, ...Array(n - prev.length).fill(null).map(() => ({ ...blank }))];
      return prev.slice(0, n);
    });
  };

  const verifySingle = async () => {
    setSingleVer({ verified: false, verifying: true, error: '' });
    const r = await verifyNibss('bvn', single.bvn, single.name);
    setSingleVer({ verifying: false, verified: r.ok, error: r.ok ? '' : r.message });
  };

  const verifyHolder = async i => {
    updHolder(i, { verifying: true, verifyErr: '', verified: false });
    const r = await verifyNibss('bvn', holders[i].bvn, holders[i].name);
    updHolder(i, { verifying: false, verified: r.ok, verifyErr: r.ok ? '' : r.message });
  };

  const singleValid       = single.name && isGmail(single.email) && single.password.length >= 8;
  const jointFormValid    = holders.every(h => h.name && isGmail(h.email) && h.phone) && (holders[0]?.password?.length >= 6);
  const allHoldersVerified = holders.every(h => h.verified);

  const docList = accountType === 'joint' ? buildJointDocs(holderCount) : KYC_REQUIREMENTS.individual;

  const handleRegister = async () => {
    setRegLoading(true); setRegError('');
    try {
      if (accountType === 'joint') {
        await authApi.registerIndividual({ accountType: 'joint', primaryName: holders[0].name, email: holders[0].email, password: holders[0].password || '', secondaryName: holders[1]?.name, secondaryEmail: holders[1]?.email, phone: holders[0].phone, bvn: holders[0].bvn, holderIdentities: holders.map(h => ({ name: h.name, bvn: h.bvn, email: h.email, phone: h.phone })) });
      } else {
        await authApi.registerIndividual({ accountType: 'single', primaryName: single.name, email: single.email, phone: single.phone, password: single.password, bvn: single.bvn });
      }
      kycApi.uploadIndividualDocs(uploads).catch(() => {});
      setStep('done');
    } catch (err) {
      const msg = err?.message || '';
      setRegError(msg.toLowerCase().includes('bvn') ? msg : msg.toLowerCase().includes('already') ? 'An account with this email already exists.' : 'Registration failed. Please try again.');
    }
    setRegLoading(false);
  };

  /* Done screen */
  if (step === 'done') return (
    <AccountCreatedScreen
      title={accountType === 'joint' ? 'Joint Account Created!' : 'Account Created!'}
      onContinue={onBack}
      unlocked={['Sign in to your wealth portal', 'Fund your wallet', 'Invest in available products']}
      locked={['Withdrawals & liquidations', 'Pre-termination requests', 'Account termination']}
      note="KYC documents can be submitted from your dashboard at any time."
      extraContent={accountType === 'joint' && (
        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, textAlign: 'left', fontSize: 11, color: 'var(--navy)' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Equal share confirmed:</div>
          {holders.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: HOLDER_COLORS[i], display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{h.name}</span>
              <span style={{ color: 'var(--gray-400)', marginLeft: 'auto' }}>{(100 / holderCount).toFixed(2)}%</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--gray-400)' }}>Mandate: <strong>{mandate}</strong> · Locked at creation</div>
        </div>
      )}
    />
  );

  /* KYC step */
  if (step === 'kyc') return (
    <div className="animate-in">
      <button onClick={() => setStep('verify')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b6ef8', fontSize: 12, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Back</button>
      <KycDocUpload
        title="SUPPORTING DOCUMENTS"
        subtitle={`${accountType === 'joint' ? `Joint KYC — All ${holderCount} Holders` : 'Individual KYC'} · All optional`}
        docs={docList}
        uploads={uploads}
        onUpload={(key, file) => setUploads(p => ({ ...p, [key]: file }))}
        infoNote={<><strong>All documents are optional at onboarding.</strong> Full access (withdrawal, liquidation) requires KYC completion.</>}
      />
      {regError && <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', padding: '10px 12px', borderRadius: 8, marginTop: 12 }}>{regError}</div>}
      <AuthSubmitButton label="CREATE ACCOUNT" loading={regLoading} loadingLabel="Creating Account…" onClick={handleRegister} />
    </div>
  );

  /* Verify step — single */
  if (step === 'verify' && accountType === 'single') return (
    <div className="animate-in">
      <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b6ef8', fontSize: 12, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Back</button>
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--navy)', marginBottom: 4 }}>IDENTITY VERIFICATION</h2>
      <p style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>BVN verification via QoreID</p>
      <p style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.5, marginBottom: 16 }}>Your BVN is used only to confirm your identity and prevent impersonation. We do not store the raw BVN; only a protected verification fingerprint is retained.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <NibssVerifyField
          label="BVN (11 digits)"
          value={single.bvn}
          onChange={val => { setSingle(f => ({ ...f, bvn: val })); setSingleVer({ verified: false, verifying: false, error: '' }); }}
          onVerify={verifySingle}
          verified={singleVer.verified}
          verifying={singleVer.verifying}
          error={singleVer.error}
          placeholder="22345678901"
          canVerify={single.bvn.length === 11 && !!single.name}
        />
        <AuthSubmitButton label="CONTINUE TO DOCUMENTS" disabled={!singleVer.verified} onClick={() => setStep('kyc')} />
      </div>
    </div>
  );

  /* Verify step — joint */
  if (step === 'verify' && accountType === 'joint') return (
    <div className="animate-in">
      <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b6ef8', fontSize: 12, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Back</button>
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--navy)', marginBottom: 4 }}>IDENTITY VERIFICATION</h2>
      <p style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Verify BVN for all {holderCount} holders via QoreID</p>
      <p style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.5, marginBottom: 16 }}>Each holder’s BVN is used only for identity authentication and duplicate-account safety checks. Raw BVNs are not stored.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {holders.map((h, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 12, border: `1.5px solid ${HOLDER_COLORS[i]}30`, padding: '14px' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: HOLDER_COLORS[i], letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              {i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Third'} Holder — {h.name || '(name required above)'}
            </div>
            <NibssVerifyField
              label="BVN"
              value={h.bvn}
              onChange={val => updHolder(i, { bvn: val, verified: false, verifyErr: '' })}
              onVerify={() => verifyHolder(i)}
              verified={h.verified}
              verifying={h.verifying}
              error={h.verifyErr}
              placeholder="BVN — 11 digits"
              accentColor={HOLDER_COLORS[i]}
              canVerify={h.bvn.length === 11 && !!h.name}
            />
          </div>
        ))}

        {/* Mandate selector */}
        <div style={{ background: 'rgba(232,184,75,0.07)', border: '1px solid rgba(232,184,75,0.2)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>Account Mandate (locked at creation)</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['AND', 'AND Mandate', 'All holders must authorise'], ['OR', 'OR Mandate', 'Any holder may authorise']].map(([id, label, desc]) => (
              <div key={id} onClick={() => setMandate(id)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `2px solid ${mandate === id ? 'var(--navy)' : '#e2e8f0'}`, cursor: 'pointer', background: mandate === id ? 'var(--navy)' : 'white', transition: 'all 0.2s' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 11, color: mandate === id ? 'var(--gold)' : 'var(--navy)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 9, color: mandate === id ? 'rgba(255,255,255,0.55)' : 'var(--gray-400)' }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 6, fontWeight: 600 }}>⚠ Mandate cannot be changed after creation.</div>
        </div>

        <AuthSubmitButton label="CONTINUE TO DOCUMENTS" disabled={!allHoldersVerified} onClick={() => setStep('kyc')} />
      </div>
    </div>
  );

  /* Form step */
  return (
    <div className="animate-in">
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b6ef8', fontSize: 12, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Back to Login</button>
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>CREATE ACCOUNT</h2>
      <p style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Select account type and fill in details</p>

      <AuthTabToggle
        tabs={[{ key: 'single', label: 'Single Account' }, { key: 'joint', label: 'Joint Account' }]}
        active={accountType}
        onChange={t => { setAccountType(t); setUploads({}); setSingleVer({ verified: false, verifying: false, error: '' }); }}
      />

      {/* Single form */}
      {accountType === 'single' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AuthInput label="Full Legal Name" icon={User} placeholder="JOHN DOE" value={single.name} onChange={e => setSingle(f => ({ ...f, name: e.target.value }))} />
          <AuthInput label="Gmail Address" icon={Mail} type="email" placeholder="you@gmail.com" value={single.email} onChange={e => setSingle(f => ({ ...f, email: e.target.value }))} error={single.email && !isGmail(single.email) ? 'Only Gmail addresses are accepted (@gmail.com)' : ''} />
          <AuthInput label="Phone Number" icon={Phone} type="tel" placeholder="+234 800 000 0000" value={single.phone} onChange={e => setSingle(f => ({ ...f, phone: e.target.value }))} />
          <AuthInput label="Secure Password" icon={Lock} type="password" placeholder="min 8 characters" value={single.password} onChange={e => setSingle(f => ({ ...f, password: e.target.value }))} />
          <AuthSubmitButton label="NEXT: VERIFY IDENTITY" disabled={!singleValid} onClick={() => setStep('verify')} />
        </div>
      )}

      {/* Joint form */}
      {accountType === 'joint' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Holder count */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8, fontWeight: 700 }}>Number of Account Holders</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[2, 3].map(n => (
                <button key={n} onClick={() => changeHolderCount(n)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: `2px solid ${holderCount === n ? 'var(--navy)' : '#e2e8f0'}`, cursor: 'pointer', background: holderCount === n ? 'var(--navy)' : 'white', transition: 'all 0.2s', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: holderCount === n ? 'var(--gold)' : 'var(--navy)' }}>
                  {n} Holders
                  <div style={{ fontSize: 10, fontWeight: 400, color: holderCount === n ? 'rgba(255,255,255,0.55)' : 'var(--gray-400)', marginTop: 2 }}>{(100 / n).toFixed(2)}% each</div>
                </button>
              ))}
            </div>
          </div>

          {/* Holder fields */}
          {holders.map((h, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: 12, border: `1.5px solid ${HOLDER_COLORS[i]}40`, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: HOLDER_COLORS[i], letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: HOLDER_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 800 }}>{i + 1}</span>
                {i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Third'} Holder
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--gray-400)' }}>{(100 / holderCount).toFixed(2)}% share</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AuthInput placeholder={`Holder ${i + 1} full name`} value={h.name} onChange={e => updHolder(i, { name: e.target.value })} />
                <AuthInput type="email" placeholder="holder@gmail.com" value={h.email} onChange={e => updHolder(i, { email: e.target.value })} error={h.email && !isGmail(h.email) ? 'Only @gmail.com accepted' : ''} />
                <AuthInput type="tel" placeholder="+234 800 000 0000" value={h.phone} onChange={e => updHolder(i, { phone: e.target.value })} />
              </div>
            </div>
          ))}

          {/* Shared password */}
          <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={12} /> Account Password
            </div>
            <AuthInput type="password" placeholder="min 6 characters (shared account password)" value={holders[0]?.password || ''} onChange={e => updHolder(0, { password: e.target.value })} />
            <div style={{ fontSize: 10, color: '#1d4ed8', background: 'rgba(59,130,246,0.07)', padding: '9px 12px', borderRadius: 8, marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Mail size={11} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Primary holder uses Gmail + this password. All other holders receive a login link.</span>
            </div>
          </div>

          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 11, color: 'var(--navy)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Shield size={13} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>Equal Share Policy:</strong> All assets distributed equally — {(100 / holderCount).toFixed(2)}% per holder. Cannot be changed after registration.</span>
          </div>

          <AuthSubmitButton label="NEXT: VERIFY ALL HOLDERS" disabled={!jointFormValid} onClick={() => setStep('verify')} />
        </div>
      )}
    </div>
  );
}

/* ── Root OnboardingLogin ─────────────────────────── */
export default function OnboardingLogin() {
  const [tab,  setTab]  = useState('corporate'); // corporate | individual
  const [mode, setMode] = useState('signin');    // signin | apply | kyc | create
  const [applyForm, setApplyForm] = useState(null);

  const isCorp = tab === 'corporate';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f0f4ff' }}>
      <AuthLeftPanel type={tab} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <AuthTabToggle
            tabs={[{ key: 'corporate', label: 'Corporate Entity' }, { key: 'individual', label: 'Individual / Joint' }]}
            active={tab}
            onChange={t => { setTab(t); setMode('signin'); }}
          />

          {mode === 'signin' && (
            <SignInForm
              isCorp={isCorp}
              onApply={() => setMode('apply')}
              onCreate={() => setMode('create')}
            />
          )}

          {mode === 'apply' && (
            <CorporateApplyForm
              onBack={() => setMode('signin')}
              onNext={form => { setApplyForm(form); setMode('kyc'); }}
            />
          )}

          {mode === 'kyc' && (
            <CorporateKycStep
              applyForm={applyForm}
              onBack={() => setMode('apply')}
              onDone={() => setMode('signin')}
            />
          )}

          {mode === 'create' && !isCorp && (
            <IndividualCreate onBack={() => setMode('signin')} />
          )}
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
