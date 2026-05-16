import React, { useState } from 'react';
import { Plus, Save, Edit2, X } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const COLORS = ['#e8b84b','#3b82f6','#22c55e','#8b5cf6','#f97316','#ec4899','#0d1b35','#06b6d4'];
const BLANK = { name:'', roi:'', minAmount:'', lockIn:'', color:'#3b82f6', description:'', taxRate:'10', clientTypes:['corporate','individual','joint'] };

export default function ProductSetup() {
  const { plans, addPlan, updatePlan, user, addAuditEntry } = useAppStore();
  const [editing, setEditing]     = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState(BLANK);
  const [saved, setSaved]         = useState('');
  const isSuperAdmin = user?.adminRole === 'super_admin' || user?.adminRole === 'operations';

  const log = (action, target) => addAuditEntry({
    id:'AUD-'+Date.now(), adminId:user?.clientId, admin:user?.name, role:user?.adminRole,
    action, target, category:'investment',
    time: new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}), ip:'—',
  });

  const handleSave = () => {
    if (!form.name || !form.roi) return;
    if (editing) {
      updatePlan(editing, form);
      log('Updated Investment Product', form.name);
      setSaved('Product updated'); setEditing(null);
    } else {
      addPlan({ ...form, id: 'plan-'+Date.now(), roi: `${form.roi}%` });
      log('Created New Investment Product', form.name);
      setSaved('Product created'); setShowAdd(false);
    }
    setTimeout(()=>setSaved(''),3000); setForm(BLANK);
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ ...p, roi: parseFloat(p.roi||''), taxRate: p.taxRate||10 });
    setShowAdd(false);
  };

  const toggleClientType = (ct) => {
    setForm(f => ({ ...f, clientTypes: f.clientTypes.includes(ct) ? f.clientTypes.filter(x=>x!==ct) : [...f.clientTypes,ct] }));
  };

  const showForm = showAdd || editing;

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Product Setup</h1>
            <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Create & manage investment products</p>
          </div>
          {isSuperAdmin && !showForm && (
            <button onClick={()=>{setShowAdd(true);setEditing(null);setForm(BLANK);}} style={{ display:'flex',alignItems:'center',gap:7,padding:'10px 18px',background:'var(--navy)',color:'white',border:'none',borderRadius:9,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12 }}>
              <Plus size={14}/> NEW PRODUCT
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div style={{ background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:9,padding:'12px 16px',marginBottom:16,fontSize:13,color:'var(--green)',fontWeight:600 }}>
          ✓ {saved}
        </div>
      )}

      {showForm && (
        <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',padding:'24px',marginBottom:22 }} className="animate-in">
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18 }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase' }}>
              {editing ? 'Edit Product' : 'New Investment Product'}
            </h3>
            <button onClick={()=>{setShowAdd(false);setEditing(null);setForm(BLANK);}} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)' }}><X size={16}/></button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Product Name</div>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Prodigy Apex Fund"
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            </div>
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>ROI (% per annum)</div>
              <input type="number" step="0.5" value={form.roi} onChange={e=>setForm(f=>({...f,roi:e.target.value}))} placeholder="e.g. 18"
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            </div>
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Min. Investment (₦)</div>
              <input type="number" value={form.minAmount} onChange={e=>setForm(f=>({...f,minAmount:e.target.value}))} placeholder="e.g. 1000000"
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            </div>
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Lock-In Period</div>
              <input value={form.lockIn} onChange={e=>setForm(f=>({...f,lockIn:e.target.value}))} placeholder="e.g. 6 months"
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            </div>
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Withholding Tax (%)</div>
              <input type="number" value={form.taxRate} onChange={e=>setForm(f=>({...f,taxRate:e.target.value}))} placeholder="e.g. 10"
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            </div>
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8 }}>Accent Colour</div>
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                {COLORS.map(c=>(
                  <div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{ width:22,height:22,borderRadius:'50%',background:c,cursor:'pointer',outline:form.color===c?`3px solid ${c}`:'3px solid transparent',outlineOffset:2,transition:'outline 0.15s' }}/>
                ))}
              </div>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8 }}>Available For</div>
              <div style={{ display:'flex',gap:10 }}>
                {['corporate','individual','joint'].map(ct=>(
                  <label key={ct} style={{ display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:'var(--navy)',fontWeight:600 }}>
                    <input type="checkbox" checked={form.clientTypes?.includes(ct)||false} onChange={()=>toggleClientType(ct)} style={{ width:14,height:14,accentColor:'var(--navy)',cursor:'pointer' }}/>
                    <span style={{ textTransform:'capitalize' }}>{ct}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Description</div>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="Short product description shown to clients..."
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',resize:'vertical' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            </div>
          </div>
          <div style={{ display:'flex',gap:10,marginTop:18 }}>
            <button onClick={()=>{setShowAdd(false);setEditing(null);setForm(BLANK);}} style={{ padding:'11px 18px',background:'var(--gray-100)',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)' }}>CANCEL</button>
            <button onClick={handleSave} disabled={!form.name||!form.roi} style={{ flex:1,padding:'11px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:7,opacity:(!form.name||!form.roi)?0.5:1 }}>
              <Save size={14}/> {editing ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
            </button>
          </div>
        </div>
      )}

      {/* Product cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16 }} className="animate-in delay-1">
        {plans.map(p=>(
          <div key={p.id} style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden',transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 4px 20px ${p.color}22`}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
          >
            <div style={{ height:5,background:p.color }}/>
            <div style={{ padding:'18px 20px' }}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12 }}>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)',marginBottom:3 }}>{p.name}</div>
                  <div style={{ fontSize:11,color:p.color,fontWeight:700 }}>{p.roi} p.a.</div>
                </div>
                {isSuperAdmin && (
                  <button onClick={()=>startEdit(p)} style={{ background:`${p.color}12`,border:'none',borderRadius:7,padding:'7px',cursor:'pointer',display:'flex',alignItems:'center' }}>
                    <Edit2 size={13} color={p.color}/>
                  </button>
                )}
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:5,marginBottom:12 }}>
                {[
                  ['Min. Investment', `₦${Number(p.minAmount).toLocaleString('en-NG')}`],
                  ['Lock-In',        p.lockIn],
                  ['Tax Rate',       `${p.taxRate}%`],
                ].map(([l,v])=>(
                  <div key={l} style={{ display:'flex',justifyContent:'space-between',fontSize:11 }}>
                    <span style={{ color:'var(--gray-400)' }}>{l}</span>
                    <span style={{ color:'var(--navy)',fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:11,color:'var(--gray-500)',lineHeight:1.5,marginBottom:10 }}>{p.description}</div>
              <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                {(p.clientTypes||['corporate','individual','joint']).map(ct=>(
                  <span key={ct} style={{ fontSize:9,fontWeight:700,color:p.color,background:`${p.color}12`,padding:'3px 8px',borderRadius:4,letterSpacing:'0.06em',textTransform:'capitalize' }}>{ct}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
