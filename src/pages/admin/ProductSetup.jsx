import React, { useState } from 'react';
import { Plus, Save, X, Package, ChevronDown } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import ProductCard from '../../components/ui/ProductCard';
import AlertBanner from '../../components/ui/AlertBanner';

const COLORS = ['#e8b84b','#3b82f6','#22c55e','#8b5cf6','#f97316','#ec4899','#0d1b35','#06b6d4'];

const DURATION_OPTIONS = [
  '30 days','60 days','90 days','6 months','9 months',
  '12 months','18 months','24 months','36 months','48 months','60 months',
];
const TENOR_OPTIONS = ['30 days','60 days','90 days','6 months','9 months','12 months','18 months','24 months'];
const CATEGORIES    = ['Fixed Income','Money Market','Mutual Fund','Treasury Bills','Commercial Paper','Bond','Eurobond','Other'];
const RISK_LEVELS   = ['Low','Medium','High'];
const STATUSES      = [{ val: 'ACTIVE', label: 'Active — Visible to clients' }, { val: 'INACTIVE', label: 'Inactive — Hidden from clients' }];

const BLANK = {
  name: '', category: '', riskLevel: '', roiMin: '', roiMax: '',
  minAmount: '', maxAmount: '', lockIn: '12 months',
  hasTenor: false, tenorOptions: [], taxRate: '10',
  earlyExitPenalty: '', isNegotiated: false, status: 'ACTIVE',
  clientTypes: ['corporate', 'individual', 'joint'], color: '#3b82f6', description: '',
};

const sel = { width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none', background: 'white', appearance: 'none', cursor: 'pointer' };
const inp = { width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' };
const lbl = { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 5, display: 'block' };

function Field({ label, children }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={sel}
          onFocus={e => e.target.style.borderColor = 'var(--navy)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.val} value={o.val}>{o.label}</option>
          )}
        </select>
        <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray-400)' }} />
      </div>
    </Field>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, prefix }) {
  return (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--gray-400)', fontWeight: 600 }}>{prefix}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ ...inp, paddingLeft: prefix ? 28 : 12 }}
          onFocus={e => e.target.style.borderColor = 'var(--navy)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
      </div>
    </Field>
  );
}

export default function ProductSetup() {
  const { plans, addPlan, updatePlan, user, addAuditEntry } = useAppStore();
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(BLANK);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState('');
  const [saveError, setSaveError] = useState('');

  const isSuperAdmin = user?.adminRole === 'super_admin' || user?.adminRole === 'operations' || user?.adminRole === 'investment';

  const f = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const log = (action, target) => addAuditEntry({
    id: 'AUD-' + Date.now(), adminId: user?.clientId, admin: user?.name, role: user?.adminRole,
    action, target, category: 'investment',
    time: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), ip: '—',
  });

  const handleSave = async () => {
    if (!form.name || !form.roiMin) return;
    setSaving(true); setSaved(''); setSaveError('');
    const payload = {
      name:               form.name,
      category:           form.category || null,
      description:        form.description || null,
      roiMin:             parseFloat(form.roiMin) || 0,
      roiMax:             parseFloat(form.roiMax || form.roiMin) || 0,
      minAmount:          parseFloat(form.minAmount) || 0,
      maxInvest:          form.maxAmount ? parseFloat(form.maxAmount) : null,
      lockIn:             form.lockIn,
      lockInStr:          form.lockIn,
      hasTenor:           form.hasTenor,
      tenorOptions:       form.tenorOptions,
      withholdingTaxRate: parseFloat(form.taxRate || '10'),
      earlyExitPenalty:   form.earlyExitPenalty ? parseFloat(form.earlyExitPenalty) : null,
      isNegotiated:       form.isNegotiated,
      status:             form.status || 'ACTIVE',
      clientTypes:        form.clientTypes,
      color:              form.color,
      riskLevel:          form.riskLevel || null,
    };
    try {
      if (editing) {
        await updatePlan(editing, payload);
        log('Updated Investment Product', form.name);
        setSaved('Product updated successfully.');
        setEditing(null);
      } else {
        await addPlan(payload);
        log('Created New Investment Product', form.name);
        setSaved('Product created successfully.');
        setShowAdd(false);
      }
      setTimeout(() => setSaved(''), 4000);
      setForm(BLANK);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setSaved(''); setSaveError('');
    setForm({
      name:           p.name || '',
      category:       p.category || '',
      riskLevel:      p.riskLevel || '',
      roiMin:         String(p.roiMin ?? p.roiNum ?? ''),
      roiMax:         String(p.roiMax ?? p.roiNum ?? ''),
      minAmount:      String(p.minInvest || ''),
      maxAmount:      p.maxInvest ? String(p.maxInvest) : '',
      lockIn:         p.lockInStr || p.lockIn || '12 months',
      hasTenor:       p.hasTenor || false,
      tenorOptions:   Array.isArray(p.tenorOptions) ? p.tenorOptions : [],
      taxRate:        String(p.withholdingTaxRate ?? 10),
      earlyExitPenalty: p.earlyExitPenalty ? String(p.earlyExitPenalty) : '',
      isNegotiated:   p.isNegotiated || false,
      status:         p.status || 'ACTIVE',
      clientTypes:    Array.isArray(p.clientTypes) && p.clientTypes.length ? p.clientTypes : ['corporate', 'individual', 'joint'],
      color:          p.color || '#3b82f6',
      description:    p.description || p.desc || '',
    });
    setShowAdd(false);
  };

  const cancel = () => { setShowAdd(false); setEditing(null); setForm(BLANK); setSaveError(''); setSaved(''); };
  const showForm = showAdd || !!editing;

  const toggleClientType = (ct) => setForm(prev => ({
    ...prev,
    clientTypes: prev.clientTypes.includes(ct)
      ? prev.clientTypes.filter(x => x !== ct)
      : [...prev.clientTypes, ct],
  }));

  const toggleTenorOption = (t) => setForm(prev => ({
    ...prev,
    tenorOptions: prev.tenorOptions.includes(t)
      ? prev.tenorOptions.filter(x => x !== t)
      : [...prev.tenorOptions, t],
  }));

  const sectionTitle = (txt) => (
    <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 10, color: 'var(--navy)', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--gray-100)', paddingBottom: 8, marginBottom: 14, gridColumn: '1/-1' }}>{txt}</div>
  );

  const toggle = (key) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
        style={{ width: 42, height: 22, borderRadius: 11, background: form[key] ? 'var(--navy)' : 'var(--gray-200)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: form[key] ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block' }} />
      </button>
      <span style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>{form[key] ? 'Yes' : 'No'}</span>
    </div>
  );

  const isValid = form.name.trim() && form.roiMin;

  return (
    <div>
      <PageHeader
        title="Product Setup"
        subtitle="Create & manage investment products"
        action={isSuperAdmin && !showForm ? { label: 'New Product', icon: Plus, onClick: () => { setShowAdd(true); setEditing(null); setForm(BLANK); } } : undefined}
      />

      {saved && <AlertBanner message={saved} type="success" />}

      {showForm && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', padding: '28px', marginBottom: 24 }} className="animate-in">
          {/* Form header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'var(--navy)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
                {editing ? '✏️  Edit Product' : '+ New Investment Product'}
              </h3>
              <p style={{ fontSize: 11, color: 'var(--gray-400)', margin: '3px 0 0', letterSpacing: '0.05em' }}>
                All fields marked with * are required
              </p>
            </div>
            <button onClick={cancel} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
              <X size={13} /> Cancel
            </button>
          </div>

          {saveError && <AlertBanner message={saveError} type="error" style={{ marginBottom: 16 }} />}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* ── Identity ───────────────── */}
            {sectionTitle('Product Identity')}
            <div style={{ gridColumn: '1/-1' }}>
              <InputField label="Product Name *" value={form.name} onChange={f('name')} placeholder="e.g. Prodigy Apex Fixed Income Fund" />
            </div>
            <SelectField label="Category" value={form.category} onChange={f('category')} options={CATEGORIES} placeholder="Select category..." />
            <SelectField label="Risk Level" value={form.riskLevel} onChange={f('riskLevel')} options={RISK_LEVELS} placeholder="Select risk level..." />
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  placeholder="Describe this product to clients — what it is, who it's for, and any key terms..."
                  style={{ ...inp, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'var(--navy)'}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
              </Field>
            </div>

            {/* ── Returns ──────────────────── */}
            {sectionTitle('Returns & Rates')}
            <InputField label="ROI Minimum (% p.a.) *" value={form.roiMin} onChange={f('roiMin')} type="number" placeholder="e.g. 15" />
            <InputField label="ROI Maximum (% p.a.)" value={form.roiMax} onChange={f('roiMax')} type="number" placeholder="Leave blank if same as min" />
            <InputField label="Withholding Tax (%)" value={form.taxRate} onChange={f('taxRate')} type="number" placeholder="Default: 10" />
            <InputField label="Early Exit Penalty (%)" value={form.earlyExitPenalty} onChange={f('earlyExitPenalty')} type="number" placeholder="e.g. 5 (0 if none)" />

            {/* ── Investment Limits ────────── */}
            {sectionTitle('Investment Limits')}
            <InputField label="Minimum Investment (₦) *" value={form.minAmount} onChange={f('minAmount')} type="number" prefix="₦" placeholder="e.g. 1000000" />
            <InputField label="Maximum Investment (₦)" value={form.maxAmount} onChange={f('maxAmount')} type="number" prefix="₦" placeholder="Leave blank if no limit" />

            {/* ── Duration & Tenor ─────────── */}
            {sectionTitle('Duration & Tenor')}
            <SelectField label="Lock-in Duration *" value={form.lockIn} onChange={f('lockIn')} options={DURATION_OPTIONS} />
            <div>
              <label style={lbl}>Flexible Tenor Options</label>
              {toggle('hasTenor')}
            </div>
            {form.hasTenor && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Available Tenor Choices (select all that apply)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {TENOR_OPTIONS.map(t => (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--navy)', fontWeight: 600, background: form.tenorOptions.includes(t) ? `var(--navy)` : 'var(--gray-100)', color: form.tenorOptions.includes(t) ? 'white' : 'var(--navy)', padding: '5px 12px', borderRadius: 6, transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={form.tenorOptions.includes(t)} onChange={() => toggleTenorOption(t)} style={{ display: 'none' }} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── Terms ────────────────────── */}
            {sectionTitle('Terms & Eligibility')}
            <div>
              <label style={lbl}>Negotiable Terms</label>
              {toggle('isNegotiated')}
              <p style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 4 }}>If on, clients see a "Negotiable" badge on this product.</p>
            </div>
            <SelectField label="Product Status" value={form.status} onChange={f('status')} options={STATUSES} />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Available For (select account types)</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {['corporate', 'individual', 'joint'].map(ct => (
                  <label key={ct} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: 'var(--navy)', fontWeight: 600, background: form.clientTypes.includes(ct) ? 'var(--navy)' : 'var(--gray-100)', color: form.clientTypes.includes(ct) ? 'white' : 'var(--navy)', padding: '7px 16px', borderRadius: 8, transition: 'all 0.15s' }}>
                    <input type="checkbox" checked={form.clientTypes.includes(ct)} onChange={() => toggleClientType(ct)} style={{ display: 'none' }} />
                    {ct.charAt(0).toUpperCase() + ct.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/* ── Visual ───────────────────── */}
            {sectionTitle('Visual Identity')}
            <div>
              <label style={lbl}>Card Accent Colour</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 3, transition: 'outline 0.15s' }} />
                ))}
              </div>
            </div>

          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 28, borderTop: '1px solid var(--gray-100)', paddingTop: 20 }}>
            <button onClick={cancel} style={{ padding: '12px 22px', background: 'var(--gray-100)', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.06em' }}>
              CANCEL
            </button>
            <button onClick={handleSave} disabled={saving || !isValid}
              style={{ flex: 1, padding: '12px', background: isValid ? 'var(--navy)' : 'var(--gray-300)', color: 'white', border: 'none', borderRadius: 9, cursor: isValid && !saving ? 'pointer' : 'not-allowed', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '0.06em', transition: 'background 0.2s' }}>
              <Save size={14} />
              {saving ? 'SAVING…' : editing ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <EmptyState icon={Package} title="No products configured yet" message="Investment products will appear here once added. Use 'New Product' to add your first product." action={isSuperAdmin ? { label: 'Add First Product', onClick: () => setShowAdd(true) } : undefined} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18, alignItems: 'stretch' }} className="animate-in delay-1">
          {plans.map(p => (
            <ProductCard
              key={p.id}
              plan={p}
              variant="admin"
              onEdit={isSuperAdmin ? startEdit : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
