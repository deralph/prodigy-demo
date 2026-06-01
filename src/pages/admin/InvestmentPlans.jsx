import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Edit, Save, X, TrendingUp, Package } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import useAppStore from '../../store/useAppStore';

export default function InvestmentPlans() {
  const { plans, updatePlan } = useAppStore();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(null);

  const startEdit = (plan) => { setEditing(plan.id); setForm({ roi: plan.roi, minInvest: plan.minInvest, lockIn: plan.lockIn, desc: plan.desc, roiNum: plan.roiNum }); };

  const saveEdit = (id) => {
    updatePlan(id, form);
    setEditing(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Investment Plans"
        subtitle="Edit ROI, minimums, lock-ins and descriptions"
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No investment plans yet"
          message="Investment products will appear here once configured in the system."
        />
      ) : (
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:18 }}>
        {plans.map((plan, i) => {
          const isEdit = editing === plan.id;
          const wasSaved = saved === plan.id;
          return (
            <div key={plan.id} className={`animate-in delay-${Math.min(i+1,5)}`} style={{ background:'white',borderRadius:14,border:`2px solid ${isEdit?plan.color+'66':'var(--gray-200)'}`,overflow:'hidden',transition:'border-color 0.2s' }}>
              {/* Header */}
              <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:40,height:40,borderRadius:10,background:plan.color,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',flexShrink:0 }}>
                  {plan.name.charAt(0)}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:'var(--navy)',letterSpacing:'0.04em' }}>{plan.name.toUpperCase()}</div>
                  <div style={{ fontSize:11,color:'var(--green)',fontWeight:700 }}>{isEdit ? form.roi : plan.roi}</div>
                </div>
                {!isEdit ? (
                  <button onClick={()=>startEdit(plan)} style={{ background:'rgba(232,184,75,0.1)',border:'none',borderRadius:7,padding:'7px',cursor:'pointer',display:'flex',alignItems:'center',transition:'background 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(232,184,75,0.2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(232,184,75,0.1)'}
                  ><Edit size={14} color="var(--gold)"/></button>
                ) : (
                  <div style={{ display:'flex',gap:6 }}>
                    <button onClick={()=>saveEdit(plan.id)} style={{ background:'rgba(34,197,94,0.1)',border:'none',borderRadius:7,padding:'7px',cursor:'pointer',display:'flex',alignItems:'center' }}><Save size={14} color="var(--green)"/></button>
                    <button onClick={()=>setEditing(null)} style={{ background:'rgba(239,68,68,0.1)',border:'none',borderRadius:7,padding:'7px',cursor:'pointer',display:'flex',alignItems:'center' }}><X size={14} color="var(--red)"/></button>
                  </div>
                )}
              </div>

              <div style={{ padding:'16px 20px' }}>
                {isEdit ? (
                  <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                    {[
                      { label:'ROI Label',       key:'roi',        type:'text',   placeholder:'e.g. 20% ROI' },
                      { label:'ROI % (numeric)', key:'roiNum',     type:'number', placeholder:'e.g. 20' },
                      { label:'Min Investment ₦',key:'minInvest',  type:'number', placeholder:'e.g. 5000000' },
                      { label:'Lock-In Period',  key:'lockIn',     type:'text',   placeholder:'e.g. 180 DAYS' },
                    ].map(f => (
                      <div key={f.key}>
                        <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:5 }}>{f.label}</div>
                        <input type={f.type} placeholder={f.placeholder} value={form[f.key]||''} onChange={e=>setForm(fm=>({...fm,[f.key]:f.type==='number'?Number(e.target.value):e.target.value}))}
                          style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'9px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',transition:'border-color 0.2s' }}
                          onFocus={e=>e.target.style.borderColor=plan.color}
                          onBlur={e=>e.target.style.borderColor='var(--gray-200)'} />
                      </div>
                    ))}
                    <div>
                      <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:5 }}>Description</div>
                      <textarea value={form.desc||''} onChange={e=>setForm(fm=>({...fm,desc:e.target.value}))} rows={3}
                        style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'9px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',resize:'vertical' }}
                        onFocus={e=>e.target.style.borderColor=plan.color}
                        onBlur={e=>e.target.style.borderColor='var(--gray-200)'} />
                    </div>
                    <button onClick={()=>saveEdit(plan.id)} style={{ background:'var(--navy)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,border:'none',borderRadius:8,padding:'12px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,letterSpacing:'0.06em' }}>
                      <Save size={13}/> SAVE CHANGES
                    </button>
                  </div>
                ) : (
                  <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                    {wasSaved && <div style={{ padding:'8px 12px',background:'rgba(34,197,94,0.1)',borderRadius:8,fontSize:12,color:'var(--green)',fontWeight:600 }}>✓ Changes saved successfully</div>}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                      {[['Min. Invest', `₦${plan.minInvest.toLocaleString()}`],['Lock-In',plan.lockIn]].map(([l,v])=>(
                        <div key={l} style={{ background:'var(--gray-50)',borderRadius:8,padding:'10px 12px' }}>
                          <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:4 }}>{l}</div>
                          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize:11,color:'var(--gray-600)',lineHeight:1.6 }}>{plan.desc}</p>
                    {plan.hasTenor && (
                      <div style={{ fontSize:10,color:'var(--gray-400)',background:'var(--gray-50)',padding:'8px 10px',borderRadius:8 }}>
                        Tenor options: {plan.tenorOptions.slice(0,4).join(', ')}...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
