import React, { useState } from 'react';
import { DEMO_USERS, ADMIN_PERMISSIONS } from '../../store/useAppStore';
import { Shield, Edit } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const ROLE_LABELS = { super_admin:'Super Admin', operations:'Head of Operations', compliance:'Compliance', finance:'Finance Manager', audit:'Audit Officer', investment:'Investment Manager' };
const ROLE_COLORS = { super_admin:'#ef4444', operations:'#3b82f6', compliance:'#8b5cf6', finance:'#22c55e', audit:'#f97316', investment:'#e8b84b' };

export default function UserManagement() {
  const { user } = useAppStore();
  const isSuperAdmin = user?.adminRole === 'super_admin';
  const adminUsers = DEMO_USERS.filter(u => u.role === 'admin');

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>User Management</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>
          {isSuperAdmin ? 'Manage admin accounts and permissions' : 'View-only access — Super Admin required to modify'}
        </p>
      </div>

      {!isSuperAdmin && (
        <div style={{ background:'rgba(232,184,75,0.1)',border:'1px solid rgba(232,184,75,0.3)',borderRadius:10,padding:'14px 18px',marginBottom:22,display:'flex',alignItems:'center',gap:10 }} className="animate-in delay-1">
          <Shield size={16} color="var(--gold)"/>
          <span style={{ fontSize:13,color:'var(--navy)',fontWeight:500 }}>You have view-only access to this module. Contact Super Admin to make changes.</span>
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18 }}>
        {adminUsers.map((u,i)=>{
          const perms = ADMIN_PERMISSIONS[u.adminRole] || [];
          return (
            <div key={u.email} className={`animate-in delay-${Math.min(i+1,5)}`} style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
              <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:38,height:38,borderRadius:'50%',background:ROLE_COLORS[u.adminRole]||'#ccc',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',flexShrink:0 }}>
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)' }}>{u.name}</div>
                    <div style={{ fontSize:10,color:'var(--gray-400)' }}>{u.email}</div>
                  </div>
                </div>
                {isSuperAdmin && <button style={{ background:'rgba(232,184,75,0.1)',border:'none',borderRadius:7,padding:'6px',cursor:'pointer',display:'flex',alignItems:'center' }}><Edit size={13} color="var(--gold)"/></button>}
              </div>
              <div style={{ padding:'14px 20px' }}>
                <div style={{ marginBottom:12 }}>
                  <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:ROLE_COLORS[u.adminRole],background:`${ROLE_COLORS[u.adminRole]}15`,padding:'4px 10px',borderRadius:6 }}>
                    {ROLE_LABELS[u.adminRole]}
                  </span>
                </div>
                <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8 }}>Permissions</div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                  {perms.map(p=>(
                    <span key={p} style={{ fontSize:9,fontWeight:600,color:'var(--navy)',background:'var(--gray-100)',padding:'3px 7px',borderRadius:4,letterSpacing:'0.06em',textTransform:'uppercase' }}>{p==='all'?'Full Access':p}</span>
                  ))}
                </div>
                <div style={{ marginTop:12,padding:'10px',background:'var(--gray-50)',borderRadius:8 }}>
                  <div style={{ fontSize:9,color:'var(--gray-400)',marginBottom:4,letterSpacing:'0.08em',textTransform:'uppercase' }}>Demo Login</div>
                  <div style={{ fontSize:11,fontFamily:'monospace',color:'var(--navy)' }}>{u.email}</div>
                  <div style={{ fontSize:11,fontFamily:'monospace',color:'var(--gray-400)' }}>{u.password}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
