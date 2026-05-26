import React, { useState, useEffect } from 'react';
import { Target, Plus, X, TrendingUp, Home, GraduationCap, Plane, Car, Briefcase, CheckCircle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

const GOAL_ICONS = { Retirement:Briefcase, Education:GraduationCap, 'Home Purchase':Home, Travel:Plane, Vehicle:Car, Other:Target };
const GOAL_COLORS = ['#22c55e','#3b82f6','#ec4899','#f97316','#8b5cf6','#e8b84b'];


export default function PersonalGoals() {
  const { plans } = useAppStore();
  const [goals, setGoals]     = useState([]);

  useEffect(() => {
    import('../../services/api').then(({ goalApi }) => {
      goalApi?.findAll?.().then(data => {
        if (data && Array.isArray(data)) setGoals(data);
      }).catch(() => {});
    }).catch(() => {});
  }, []);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm]       = useState({ name:'', icon:'Other', target:'', saved:'', deadline:'', planId:'', color:'#22c55e' });

  const totalTarget = goals.reduce((s,g) => s + g.target, 0);
  const totalSaved  = goals.reduce((s,g) => s + g.saved,  0);

  const handleAdd = () => {
    if (!form.name || !form.target) return;
    const plan = plans.find(p => p.id === form.planId);
    setGoals(prev => [...prev, {
      id: 'G-' + Date.now(), name: form.name, icon: form.icon,
      target: Number(form.target), saved: Number(form.saved)||0,
      deadline: form.deadline, color: form.color, plan: plan?.name||'—',
    }]);
    setNewOpen(false);
    setForm({ name:'', icon:'Other', target:'', saved:'', deadline:'', planId:'', color:'#22c55e' });
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Personal Goals</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Investment Goal Tracker · Single Account</p>
      </div>

      {/* Overview hero */}
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'22px 26px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(232,184,75,0.05)',pointerEvents:'none' }} />
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div>
            <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:8 }}>Portfolio Goal Progress</p>
            <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(22px,3vw,32px)',color:'white',letterSpacing:'-0.01em',marginBottom:6 }}>{fmt(totalSaved)} <span style={{ fontSize:16,color:'rgba(255,255,255,0.4)',fontWeight:400 }}>of {fmt(totalTarget)}</span></h2>
            <div style={{ fontSize:12,color:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',gap:5 }}>
              <TrendingUp size={12} color="var(--green)"/>
              <span style={{ color:'var(--green)',fontWeight:600 }}>{goals.length === 0 ? '0 Goals Created' : `${Math.round((totalSaved/totalTarget)*100)}% Overall Progress Across ${goals.length} Goals`}</span>
            </div>
          </div>
          <button onClick={()=>setNewOpen(true)} style={{ display:'flex',alignItems:'center',gap:6,background:'var(--gold)',color:'var(--navy)',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,border:'none',borderRadius:8,padding:'10px 16px',cursor:'pointer',letterSpacing:'0.06em',flexShrink:0 }}>
            <Plus size={13}/> NEW GOAL
          </button>
        </div>
        <div style={{ marginTop:14,height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden' }}>
          <div style={{ height:'100%',width:`${(totalSaved/totalTarget)*100}%`,background:'var(--gold)',borderRadius:3,transition:'width 0.5s ease' }}/>
        </div>
      </div>

      {/* Goal cards */}
      {goals.length === 0 && (
        <EmptyState icon={Target} title="No goals yet" message="Create your first investment goal to start tracking your financial milestones." action={{ label: 'Create Goal', onClick: () => setNewOpen(true) }} />
      )}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16 }} className="animate-in delay-2">
        {goals.map(goal => {
          const Icon     = GOAL_ICONS[goal.icon] || Target;
          const progress = Math.min((goal.saved / goal.target) * 100, 100);
          const remaining= goal.target - goal.saved;
          const done     = progress >= 100;
          return (
            <div key={goal.id} style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
              <div style={{ height:4,background:goal.color }}/>
              <div style={{ padding:'18px 20px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14 }}>
                  <div style={{ width:42,height:42,borderRadius:12,background:`${goal.color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    {done ? <CheckCircle size={18} color={goal.color}/> : <Icon size={18} color={goal.color}/>}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'var(--navy)',marginBottom:1 }}>{goal.name}</div>
                    <div style={{ fontSize:11,color:'var(--gray-400)' }}>Target: {goal.deadline} · {goal.plan}</div>
                  </div>
                  {done && <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--green)',background:'rgba(34,197,94,0.1)',padding:'2px 8px',borderRadius:4 }}>Complete</span>}
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                  <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{fmt(goal.saved)}</span>
                  <span style={{ fontSize:11,color:'var(--gray-400)' }}>{fmt(goal.target)}</span>
                </div>
                <div style={{ height:8,background:'var(--gray-100)',borderRadius:4,overflow:'hidden',marginBottom:8 }}>
                  <div style={{ height:'100%',width:`${progress}%`,background:goal.color,borderRadius:4,transition:'width 0.5s ease' }}/>
                </div>
                <div style={{ display:'flex',justifyContent:'space-between' }}>
                  <span style={{ fontSize:11,fontWeight:700,color:goal.color }}>{Math.round(progress)}% funded</span>
                  <span style={{ fontSize:11,color:'var(--gray-400)' }}>{done?'Goal reached!':fmt(remaining)+' remaining'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New goal modal */}
      {newOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setNewOpen(false)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:460,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',maxHeight:'90vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:1 }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:14,color:'white',textTransform:'uppercase' }}>New Investment Goal</div>
              <button onClick={()=>setNewOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={16}/></button>
            </div>
            <div style={{ padding:'22px' }}>
              {[{label:'Goal Name',key:'name',type:'text',placeholder:'e.g. Retirement Fund'},{label:'Target Amount (₦)',key:'target',type:'number',placeholder:'e.g. 50000000'},{label:'Current Savings (₦)',key:'saved',type:'number',placeholder:'e.g. 5000000'},{label:'Target Deadline',key:'deadline',type:'text',placeholder:'e.g. Dec 2030'}].map(f=>(
                <div key={f.key} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:5,fontWeight:600 }}>{f.label}</div>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}
                    style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',color:'var(--navy)' }}
                    onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:5,fontWeight:600 }}>Goal Category</div>
                <select value={form.icon} onChange={e=>setForm(x=>({...x,icon:e.target.value}))} style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white',cursor:'pointer' }}>
                  {Object.keys(GOAL_ICONS).map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:5,fontWeight:600 }}>Linked Investment Product</div>
                <select value={form.planId} onChange={e=>setForm(x=>({...x,planId:e.target.value}))} style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white',cursor:'pointer' }}>
                  <option value="">— None —</option>
                  {plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8,fontWeight:600 }}>Goal Color</div>
                <div style={{ display:'flex',gap:8 }}>
                  {GOAL_COLORS.map(c=>(
                    <div key={c} onClick={()=>setForm(x=>({...x,color:c}))} style={{ width:28,height:28,borderRadius:'50%',background:c,cursor:'pointer',outline:form.color===c?`3px solid ${c}`:'3px solid transparent',outlineOffset:2,transition:'all 0.15s' }}/>
                  ))}
                </div>
              </div>
              <button onClick={handleAdd} disabled={!form.name||!form.target} style={{ width:'100%',padding:'12px',background:'var(--navy)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,opacity:(!form.name||!form.target)?0.5:1 }}>
                CREATE GOAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
