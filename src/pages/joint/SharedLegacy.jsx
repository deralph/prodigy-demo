import React, { useState } from 'react';
import { Heart, Users, Plus, X, Trash2, BookOpen, Shield } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

const RELATIONSHIPS = ['Spouse','Child','Parent','Sibling','Grandchild','Trust','Charity','Other'];
const ALLOC_COLORS  = ['#22c55e','#3b82f6','#e8b84b','#ec4899','#8b5cf6','#f97316'];

const INIT_BENEFICIARIES = [
  { id:'B-001', name:'Daniel Awobajo Jr.',  relationship:'Child',  alloc:50, dob:'12 Mar 2008', contact:'08012345678', color:'#22c55e' },
  { id:'B-002', name:'Amaka Awobajo',       relationship:'Child',  alloc:30, dob:'05 Jul 2012', contact:'08023456789', color:'#3b82f6' },
  { id:'B-003', name:'Grace Awobajo',       relationship:'Parent', alloc:20, dob:'18 Jan 1958', contact:'08034567890', color:'#e8b84b' },
];

export default function SharedLegacy() {
  const { user, clientInvestments, clients } = useAppStore();
  const client  = clients.find(c => c.clientId === user?.clientId);
  const myInvs  = clientInvestments.filter(i => i.clientId === user?.clientId);
  const totalAUM= myInvs.reduce((s,i)=>s+i.amount,0);

  const [beneficiaries, setBeneficiaries] = useState(INIT_BENEFICIARIES);
  const [addOpen, setAddOpen]             = useState(false);
  const [form, setForm]                   = useState({ name:'', relationship:'Child', alloc:'', dob:'', contact:'', color:'#22c55e' });

  const totalAlloc = beneficiaries.reduce((s,b)=>s+b.alloc,0);

  const handleAdd = () => {
    if (!form.name||!form.alloc||totalAlloc+Number(form.alloc)>100) return;
    setBeneficiaries(prev=>[...prev,{id:'B-'+Date.now(),...form,alloc:Number(form.alloc)}]);
    setAddOpen(false);
    setForm({ name:'', relationship:'Child', alloc:'', dob:'', contact:'', color:'#22c55e' });
  };

  const remove = (id) => setBeneficiaries(prev=>prev.filter(b=>b.id!==id));

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Shared Legacy</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Estate Planning · Beneficiary Management · Joint Account</p>
      </div>

      {/* Dual-holder banner */}
      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'center',gap:10 }} className="animate-in">
        <Users size={14} color="var(--gold)"/>
        <span style={{ fontSize:12,color:'var(--navy)',fontWeight:600 }}>
          Primary: <strong>{user?.name}</strong>{client?.secondaryName&&<> &nbsp;•&nbsp; Secondary: <strong>{client.secondaryName}</strong></>}
        </span>
        <span style={{ marginLeft:'auto',fontSize:10,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--gold)',background:'rgba(232,184,75,0.12)',padding:'3px 9px',borderRadius:4 }}>Joint Legacy</span>
      </div>

      {/* AUM at stake */}
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'22px 26px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(232,184,75,0.05)',pointerEvents:'none' }} />
        <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:8,display:'flex',alignItems:'center',gap:5 }}>
          <Heart size={11} color="var(--gold)"/> Legacy Portfolio Value
        </p>
        <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,4vw,36px)',color:'white',letterSpacing:'-0.01em',marginBottom:6 }}>{fmt(totalAUM)}</h2>
        <div style={{ fontSize:12,color:'rgba(255,255,255,0.5)' }}>{myInvs.length} joint investment{myInvs.length!==1?'s':''} covered by succession plan</div>
        <div style={{ display:'flex',gap:16,marginTop:14,flexWrap:'wrap' }}>
          <div><div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Beneficiaries</div><div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'var(--gold)' }}>{beneficiaries.length}</div></div>
          <div><div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Total Allocated</div><div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:totalAlloc===100?'var(--green)':'var(--gold)' }}>{totalAlloc}%</div></div>
          <div><div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Unallocated</div><div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:(100-totalAlloc)>0?'#f97316':'var(--green)' }}>{100-totalAlloc}%</div></div>
        </div>
      </div>

      {/* Allocation chart */}
      <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'18px 22px',marginBottom:18 }} className="animate-in delay-2">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Allocation Breakdown</h3>
          {totalAlloc!==100 && <span style={{ fontSize:11,color:'#f97316',fontWeight:700 }}>{100-totalAlloc}% unallocated</span>}
        </div>
        <div style={{ height:12,borderRadius:6,overflow:'hidden',display:'flex',marginBottom:12 }}>
          {beneficiaries.map(b=>(<div key={b.id} style={{ flex:b.alloc,background:b.color,transition:'flex 0.3s ease' }}/>))}
          {(100-totalAlloc)>0 && <div style={{ flex:100-totalAlloc,background:'var(--gray-100)' }}/>}
        </div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:'6px 16px' }}>
          {beneficiaries.map(b=>(
            <div key={b.id} style={{ display:'flex',alignItems:'center',gap:5 }}>
              <div style={{ width:8,height:8,borderRadius:2,background:b.color }}/>
              <span style={{ fontSize:11,color:'var(--navy)',fontWeight:600 }}>{b.name}</span>
              <span style={{ fontSize:11,color:'var(--gray-400)' }}>{b.alloc}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Beneficiary list */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ padding:'16px 22px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Beneficiaries</h3>
          <button onClick={()=>setAddOpen(true)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'var(--navy)',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:700 }}>
            <Plus size={12}/> Add
          </button>
        </div>
        {beneficiaries.map((b,i)=>(
          <div key={b.id} style={{ padding:'16px 22px',borderBottom:i<beneficiaries.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <div style={{ width:42,height:42,borderRadius:12,background:`${b.color}15`,border:`2px solid ${b.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:b.color,flexShrink:0 }}>{b.name.charAt(0)}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',marginBottom:2 }}>{b.name}</div>
              <div style={{ fontSize:11,color:'var(--gray-400)' }}>{b.relationship} · DOB: {b.dob} · {b.contact}</div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:b.color }}>{b.alloc}%</div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>{fmt((totalAUM*b.alloc)/100)}</div>
              </div>
              <button onClick={()=>remove(b.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--gray-300)',transition:'color 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--gray-300)'}>
                <Trash2 size={15}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Legacy note */}
      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'14px 18px',marginTop:18,fontSize:12,color:'var(--navy)',lineHeight:1.6,display:'flex',gap:10,alignItems:'flex-start' }} className="animate-in delay-3">
        <BookOpen size={14} color="var(--gold)" style={{ flexShrink:0,marginTop:1 }}/>
        <span><strong>Succession Policy:</strong> Beneficiary allocations must total 100% to be legally effective. All designations require notarisation and must be reviewed annually by both joint holders.</span>
      </div>

      {/* Add beneficiary modal */}
      {addOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setAddOpen(false)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:440,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',maxHeight:'90vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0 }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'white',textTransform:'uppercase' }}>Add Beneficiary</div>
              <button onClick={()=>setAddOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={16}/></button>
            </div>
            <div style={{ padding:'22px' }}>
              {[{l:'Full Name',k:'name',t:'text',p:'e.g. Daniel Awobajo Jr.'},{l:'Date of Birth',k:'dob',t:'text',p:'e.g. 12 Mar 2008'},{l:'Contact Number',k:'contact',t:'tel',p:'e.g. 08012345678'},{l:'Allocation (%)',k:'alloc',t:'number',p:`Max ${100-totalAlloc}%`}].map(f=>(
                <div key={f.k} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:5,fontWeight:600 }}>{f.l}</div>
                  <input type={f.t} placeholder={f.p} value={form[f.k]} onChange={e=>setForm(x=>({...x,[f.k]:e.target.value}))}
                    style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',color:'var(--navy)' }}
                    onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:5,fontWeight:600 }}>Relationship</div>
                <select value={form.relationship} onChange={e=>setForm(x=>({...x,relationship:e.target.value}))} style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white',cursor:'pointer' }}>
                  {RELATIONSHIPS.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8,fontWeight:600 }}>Colour Tag</div>
                <div style={{ display:'flex',gap:8 }}>
                  {ALLOC_COLORS.map(c=>(<div key={c} onClick={()=>setForm(x=>({...x,color:c}))} style={{ width:28,height:28,borderRadius:'50%',background:c,cursor:'pointer',outline:form.color===c?`3px solid ${c}`:'3px solid transparent',outlineOffset:2,transition:'all 0.15s' }}/>))}
                </div>
              </div>
              {totalAlloc+Number(form.alloc||0)>100 && <div style={{ color:'var(--red)',fontSize:11,marginBottom:10,fontWeight:600 }}>⚠ Total allocation exceeds 100%</div>}
              <button onClick={handleAdd} disabled={!form.name||!form.alloc||totalAlloc+Number(form.alloc)>100} style={{ width:'100%',padding:'12px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,opacity:(!form.name||!form.alloc||totalAlloc+Number(form.alloc)>100)?0.5:1 }}>
                ADD BENEFICIARY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
