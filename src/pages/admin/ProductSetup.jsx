import React, { useState } from 'react';
import { Plus, Save, X, Package } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import ProductCard from '../../components/ui/ProductCard';
import AlertBanner from '../../components/ui/AlertBanner';

const COLORS = ['#e8b84b','#3b82f6','#22c55e','#8b5cf6','#f97316','#ec4899','#0d1b35','#06b6d4'];
const BLANK = { name:'', roi:'', minAmount:'', lockIn:'', color:'#3b82f6', description:'', taxRate:'10', clientTypes:['corporate','individual','joint'] };

export default function ProductSetup() {
  const { plans, addPlan, updatePlan, user, addAuditEntry } = useAppStore();
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(BLANK);
  const [saved, setSaved]     = useState('');
  const isSuperAdmin = user?.adminRole === 'super_admin' || user?.adminRole === 'operations';

  const log = (action, target) => addAuditEntry({
    id: 'AUD-' + Date.now(), adminId: user?.clientId, admin: user?.name, role: user?.adminRole,
    action, target, category: 'investment',
    time: new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }), ip: '—',
  });

  const handleSave = () => {
    if (!form.name || !form.roi) return;
    if (editing) {
      updatePlan(editing, form);
      log('Updated Investment Product', form.name);
      setSaved('Product updated'); setEditing(null);
    } else {
      addPlan({ ...form, id: 'plan-' + Date.now(), roi: `${form.roi}%` });
      log('Created New Investment Product', form.name);
      setSaved('Product created'); setShowAdd(false);
    }
    setTimeout(() => setSaved(''), 3000); setForm(BLANK);
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ ...p, roi: parseFloat(p.roi || ''), taxRate: p.taxRate || 10 });
    setShowAdd(false);
  };

  const toggleClientType = (ct) => {
    setForm(f => ({ ...f, clientTypes: f.clientTypes.includes(ct) ? f.clientTypes.filter(x => x !== ct) : [...f.clientTypes, ct] }));
  };

  const showForm = showAdd || editing;

  const inputStyle = { width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' };
  const labelStyle = { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 };

  return (
    <div>
      <PageHeader
        title="Product Setup"
        subtitle="Create & manage investment products"
        action={isSuperAdmin && !showForm ? { label: 'New Product', icon: Plus, onClick: () => { setShowAdd(true); setEditing(null); setForm(BLANK); } } : undefined}
      />

      {saved && <AlertBanner message={saved} type="success" />}

      {showForm && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', padding: '24px', marginBottom: 22 }} className="animate-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {editing ? 'Edit Product' : 'New Investment Product'}
            </h3>
            <button onClick={() => { setShowAdd(false); setEditing(null); setForm(BLANK); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { key: 'name',      label: 'Product Name',         type: 'text',   placeholder: 'e.g. Prodigy Apex Fund' },
              { key: 'roi',       label: 'ROI (% per annum)',    type: 'number', placeholder: 'e.g. 18' },
              { key: 'minAmount', label: 'Min. Investment (₦)',  type: 'number', placeholder: 'e.g. 1000000' },
              { key: 'lockIn',    label: 'Lock-In Period',       type: 'text',   placeholder: 'e.g. 6 months' },
              { key: 'taxRate',   label: 'Withholding Tax (%)',  type: 'number', placeholder: 'e.g. 10' },
            ].map(f => (
              <div key={f.key}>
                <div style={labelStyle}>{f.label}</div>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
              </div>
            ))}
            <div>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Accent Colour</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transition: 'outline 0.15s' }} />
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Available For</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['corporate', 'individual', 'joint'].map(ct => (
                  <label key={ct} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>
                    <input type="checkbox" checked={form.clientTypes?.includes(ct) || false} onChange={() => toggleClientType(ct)} style={{ width: 14, height: 14, accentColor: 'var(--navy)', cursor: 'pointer' }} />
                    <span style={{ textTransform: 'capitalize' }}>{ct}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div style={labelStyle}>Description</div>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Short product description shown to clients..."
                style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={() => { setShowAdd(false); setEditing(null); setForm(BLANK); }} style={{ padding: '11px 18px', background: 'var(--gray-100)', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy)' }}>CANCEL</button>
            <button onClick={handleSave} disabled={!form.name || !form.roi} style={{ flex: 1, padding: '11px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: (!form.name || !form.roi) ? 0.5 : 1 }}>
              <Save size={14} /> {editing ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <EmptyState icon={Package} title="No products configured yet" message="Investment products will appear here once added. Use the 'New Product' button to add your first product." action={{ label: 'Add First Product', onClick: () => setShowAdd(true) }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }} className="animate-in delay-1">
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
