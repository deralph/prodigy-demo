import React, { useState } from 'react';
import { ADMIN_PERMISSIONS, ROLE_LABELS, ROLE_COLORS } from '../../store/useAppStore';
import { Shield, Plus, Lock, Unlock, Trash2, UserCheck, UserX, X, Users } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import useAppStore from '../../store/useAppStore';

const ROLES = Object.keys(ROLE_LABELS);

const BLANK_FORM = { name:'', email:'', password:'', adminRole:'operations', status:'active' };

export default function UserManagement() {
  const { user, adminUsers, addAdminUser, updateAdminUser, addAuditEntry } = useAppStore();
  const isSuperAdmin = user?.adminRole === 'super_admin';
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saved, setSaved] = useState('');

  const logAction = (action, target) => {
    addAuditEntry({
      id: 'AUD-' + Date.now(), adminId: user?.clientId, admin: user?.name,
      role: user?.adminRole, action, target,
      time: new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),
      category:'system', ip:'—',
    });
  };

  const handleAdd = () => {
    if (!form.name || !form.email) return;
    const newUser = { ...form, role:'admin', clientId:'ADM-'+Date.now() };
    addAdminUser(newUser);
    logAction('Created Admin Account', form.email);
    setSaved('User added'); setTimeout(()=>setSaved(''),2500);
    setShowAdd(false); setForm(BLANK_FORM);
  };

  const toggleLock = (u) => {
    const next = u.status === 'locked' ? 'active' : 'locked';
    updateAdminUser(u.email, { status: next });
    logAction(next==='locked'?'Locked User Account':'Unlocked User Account', u.email);
  };

  const handleDelete = (u) => {
    updateAdminUser(u.email, { status: 'deleted' });
    logAction('Deleted User Account', u.email);
    setConfirmDelete(null);
  };

  const visible = adminUsers.filter(u => u.status !== 'deleted');

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>User Management</h1>
            <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>
              {isSuperAdmin ? 'Manage admin accounts, roles & permissions' : 'View-only — Super Admin required to modify'}
            </p>
          </div>
          {isSuperAdmin && (
            <button onClick={()=>setShowAdd(true)} style={{ display:'flex',alignItems:'center',gap:7,padding:'10px 18px',background:'var(--navy)',color:'white',border:'none',borderRadius:9,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,letterSpacing:'0.06em' }}>
              <Plus size={14}/> ADD USER
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div style={{ background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:9,padding:'12px 16px',marginBottom:16,fontSize:13,color:'var(--green)',fontWeight:600 }}>
          ✓ {saved}
        </div>
      )}

      {!isSuperAdmin && (
        <div style={{ background:'rgba(232,184,75,0.1)',border:'1px solid rgba(232,184,75,0.3)',borderRadius:10,padding:'14px 18px',marginBottom:22,display:'flex',alignItems:'center',gap:10 }} className="animate-in delay-1">
          <Shield size={16} color="var(--gold)"/>
          <span style={{ fontSize:13,color:'var(--navy)',fontWeight:500 }}>View-only access. Contact Super Admin to make changes.</span>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No admin users yet"
          message="Admin users will appear here once created. As Super Admin, you can add operations, compliance, and finance team members."
          action={isSuperAdmin ? { label: 'Add First Admin', onClick: () => setShowAdd(true) } : null}
        />
      ) : (
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18 }}>
        {visible.map((u,i)=>{
          const perms = ADMIN_PERMISSIONS[u.adminRole] || [];
          const isLocked = u.status === 'locked';
          const color = ROLE_COLORS[u.adminRole] || '#64748b';
          return (
            <div key={u.email} className={`animate-in delay-${Math.min(i+1,5)}`} style={{ background:'white',borderRadius:14,border:`1px solid ${isLocked?'rgba(239,68,68,0.25)':'var(--gray-200)'}`,overflow:'hidden',opacity:isLocked?0.8:1 }}>
              <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:40,height:40,borderRadius:'50%',background:isLocked?'#ef4444':color,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',flexShrink:0 }}>
                    {isLocked ? '🔒' : u.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{u.name}</div>
                    <div style={{ fontSize:10,color:'var(--gray-400)' }}>{u.email}</div>
                    {isLocked && <div style={{ fontSize:9,color:'var(--red)',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',marginTop:2 }}>Account Locked</div>}
                  </div>
                </div>
                {isSuperAdmin && (
                  <div style={{ display:'flex',gap:6 }}>
                    <button title={isLocked?'Unlock':'Lock'} onClick={()=>toggleLock(u)} style={{ background:isLocked?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',border:'none',borderRadius:7,padding:'6px',cursor:'pointer',display:'flex',alignItems:'center' }}>
                      {isLocked ? <Unlock size={13} color="var(--green)"/> : <Lock size={13} color="var(--red)"/>}
                    </button>
                    <button title="Delete user" onClick={()=>setConfirmDelete(u)} style={{ background:'rgba(239,68,68,0.08)',border:'none',borderRadius:7,padding:'6px',cursor:'pointer',display:'flex',alignItems:'center' }}>
                      <Trash2 size={13} color="var(--red)"/>
                    </button>
                  </div>
                )}
              </div>
              <div style={{ padding:'14px 20px' }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                  <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color,background:`${color}15`,padding:'4px 10px',borderRadius:6 }}>
                    {ROLE_LABELS[u.adminRole] || u.adminRole}
                  </span>
                  <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:u.status==='active'?'var(--green)':u.status==='locked'?'var(--red)':'var(--gray-400)',background:u.status==='active'?'rgba(34,197,94,0.1)':u.status==='locked'?'rgba(239,68,68,0.1)':'var(--gray-100)',padding:'3px 8px',borderRadius:5 }}>
                    {u.status || 'active'}
                  </span>
                </div>
                <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8 }}>Module Permissions</div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                  {perms.slice(0,6).map(p=>(
                    <span key={p} style={{ fontSize:9,fontWeight:600,color:'var(--navy)',background:'var(--gray-100)',padding:'3px 7px',borderRadius:4,letterSpacing:'0.06em',textTransform:'uppercase' }}>{p==='all'?'Full Access':p}</span>
                  ))}
                  {perms.length > 6 && <span style={{ fontSize:9,color:'var(--gray-400)' }}>+{perms.length-6} more</span>}
                </div>
                <div style={{ marginTop:12,padding:'10px',background:'var(--gray-50)',borderRadius:8 }}>
                  <div style={{ fontSize:9,color:'var(--gray-400)',marginBottom:4,letterSpacing:'0.08em',textTransform:'uppercase' }}>Login Credentials</div>
                  <div style={{ fontSize:11,fontFamily:'monospace',color:'var(--navy)' }}>{u.email}</div>
                  <div style={{ fontSize:11,fontFamily:'monospace',color:'var(--gray-400)' }}>{u.password}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setShowAdd(false)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:480,boxShadow:'0 32px 80px rgba(13,27,53,0.25)',overflow:'hidden',animation:'modalIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:'var(--navy)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white',textTransform:'uppercase' }}>Add New Admin User</h3>
              <button onClick={()=>setShowAdd(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'22px 24px',display:'flex',flexDirection:'column',gap:14 }}>
              {[
                { label:'Full Name', key:'name', type:'text', placeholder:'e.g. Adaeze Obiechina' },
                { label:'Email Address', key:'email', type:'email', placeholder:'e.g. adaeze@prodigy.ng' },
                { label:'Password', key:'password', type:'password', placeholder:'Minimum 8 characters' },
              ].map(f=>(
                <div key={f.key}>
                  <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>{f.label}</div>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(fm=>({...fm,[f.key]:e.target.value}))}
                    style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                    onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'} />
                </div>
              ))}
              <div>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Role Assignment</div>
                <select value={form.adminRole} onChange={e=>setForm(fm=>({...fm,adminRole:e.target.value}))}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:8,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}>
                  {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <button onClick={handleAdd} disabled={!form.name||!form.email} style={{ background:'var(--navy)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,border:'none',borderRadius:8,padding:'13px',cursor:'pointer',letterSpacing:'0.06em',opacity:(!form.name||!form.email)?0.5:1 }}>
                CREATE USER ACCOUNT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setConfirmDelete(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:400,padding:'28px',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:52,height:52,background:'rgba(239,68,68,0.1)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
              <Trash2 size={22} color="var(--red)"/>
            </div>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--navy)',textAlign:'center',marginBottom:8 }}>Delete Account?</h3>
            <p style={{ fontSize:13,color:'var(--gray-600)',textAlign:'center',marginBottom:20,lineHeight:1.6 }}>
              This will permanently delete <strong>{confirmDelete.name}</strong>'s account. This action cannot be undone.
            </p>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={()=>setConfirmDelete(null)} style={{ flex:1,padding:'12px',background:'var(--gray-100)',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)' }}>CANCEL</button>
              <button onClick={()=>handleDelete(confirmDelete)} style={{ flex:1,padding:'12px',background:'var(--red)',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'white' }}>DELETE</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
