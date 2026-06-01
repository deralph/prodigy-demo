import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Users, Shield, CheckCircle, Clock, Info } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');
const HOLDER_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6'];

export default function SharedLegacy() {
  const { user, clientInvestments, clients } = useAppStore();
  const client  = clients.find(c => c.clientId === user?.clientId);
  const myInvs  = clientInvestments.filter(i => i.clientId === user?.clientId);
  const totalAUM = myInvs.reduce((s, i) => s + i.amount, 0);

  const holders = client?.holders || [];
  const n = holders.length;
  const mandate = client?.mandate || 'AND';
  const allKycDone = holders.every(h => h.kycDone);

  return (
    <div>
      <PageHeader
        title="Joint Account Overview"
        subtitle="Shared ownership · Equal distribution · {n}-holder account"
      />

      {/* Policy banner */}
      <div style={{ background:'rgba(59,130,246,0.07)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:10,padding:'12px 18px',marginBottom:18,display:'flex',alignItems:'flex-start',gap:10 }} className="animate-in">
        <Info size={14} color="#3b82f6" style={{ flexShrink:0,marginTop:1 }}/>
        <span style={{ fontSize:12,color:'var(--navy)',lineHeight:1.6 }}>
          <strong>Equal Share Policy:</strong> All assets in this joint account are shared equally among all {n} holders ({(100/n).toFixed(2)}% each). Mandate type: <strong style={{ color:mandate==='AND'?'#3b82f6':'#22c55e' }}>{mandate==='AND'?'ALL SIGNATORIES required':'ANY SIGNATORY can authorise'}</strong> for transactions.
        </span>
      </div>

      {/* AUM Hero */}
      <div style={{ background:'var(--navy)',borderRadius:14,padding:'22px 26px',marginBottom:22,position:'relative',overflow:'hidden' }} className="animate-in delay-1">
        <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(232,184,75,0.05)',pointerEvents:'none' }} />
        <p style={{ fontSize:9,letterSpacing:'0.14em',color:'var(--gold)',textTransform:'uppercase',fontWeight:600,marginBottom:8,display:'flex',alignItems:'center',gap:5 }}>
          <Users size={11} color="var(--gold)"/> Total Joint Portfolio Value
        </p>
        <h2 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(26px,4vw,36px)',color:'white',letterSpacing:'-0.01em',marginBottom:6 }}>{fmt(totalAUM)}</h2>
        <div style={{ fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:14 }}>{myInvs.length} investment{myInvs.length!==1?'s':''} · shared equally across {n} holders</div>
        <div style={{ display:'flex',gap:20,flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Each Holder's Share</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'var(--gold)' }}>{fmt(totalAUM / (n||1))}</div>
          </div>
          <div>
            <div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Split %</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'var(--green)' }}>{(100/n).toFixed(2)}% each</div>
          </div>
          <div>
            <div style={{ fontSize:9,color:'rgba(255,255,255,0.4)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Mandate</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:mandate==='AND'?'#f97316':'var(--green)' }}>{mandate}</div>
          </div>
        </div>
      </div>

      {/* Equal share bar */}
      <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'18px 22px',marginBottom:18 }} className="animate-in delay-2">
        <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12 }}>Equal Share Distribution</h3>
        <div style={{ height:14,borderRadius:7,overflow:'hidden',display:'flex',marginBottom:12 }}>
          {holders.map((h,i)=>(
            <div key={i} style={{ flex:1,background:HOLDER_COLORS[i%HOLDER_COLORS.length],display:'flex',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontSize:9,color:'white',fontWeight:700 }}>{(100/n).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:'6px 18px' }}>
          {holders.map((h,i)=>(
            <div key={i} style={{ display:'flex',alignItems:'center',gap:6 }}>
              <div style={{ width:8,height:8,borderRadius:2,background:HOLDER_COLORS[i%HOLDER_COLORS.length] }}/>
              <span style={{ fontSize:11,color:'var(--navy)',fontWeight:600 }}>{h.name}</span>
              <span style={{ fontSize:11,color:'var(--gray-400)' }}>{(100/n).toFixed(2)}% · {fmt(totalAUM/n)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Holder cards */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ padding:'16px 22px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Account Holders ({n})</h3>
          <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:allKycDone?'var(--green)':'#f97316',background:allKycDone?'rgba(34,197,94,0.1)':'rgba(249,115,22,0.1)',padding:'3px 9px',borderRadius:4 }}>
            {allKycDone ? 'All KYC Complete' : `${holders.filter(h=>h.kycDone).length}/${n} KYC Done`}
          </span>
        </div>
        {holders.map((h, i) => (
          <div key={i} style={{ padding:'16px 22px',borderBottom:i<holders.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <div style={{ width:44,height:44,borderRadius:12,background:`${HOLDER_COLORS[i%HOLDER_COLORS.length]}18`,border:`2px solid ${HOLDER_COLORS[i%HOLDER_COLORS.length]}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:HOLDER_COLORS[i%HOLDER_COLORS.length],flexShrink:0 }}>
              {h.name.charAt(0)}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',marginBottom:2 }}>
                {h.name} {i===0 && <span style={{ fontSize:9,letterSpacing:'0.06em',textTransform:'uppercase',color:'var(--gold)',background:'rgba(232,184,75,0.12)',padding:'2px 7px',borderRadius:4,marginLeft:4 }}>Primary</span>}
              </div>
              <div style={{ fontSize:11,color:'var(--gray-400)' }}>{h.email} · {h.phone}</div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:14,flexShrink:0 }}>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:17,color:HOLDER_COLORS[i%HOLDER_COLORS.length] }}>{(100/n).toFixed(2)}%</div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>{fmt(totalAUM/n)}</div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                {h.kycDone
                  ? <CheckCircle size={16} color="var(--green)"/>
                  : <Clock size={16} color="#f97316"/>
                }
                <span style={{ fontSize:10,fontWeight:700,color:h.kycDone?'var(--green)':'#f97316' }}>{h.kycDone?'KYC Done':'KYC Pending'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mandate and policy note */}
      <div style={{ background:'rgba(232,184,75,0.08)',border:'1px solid rgba(232,184,75,0.25)',borderRadius:10,padding:'14px 18px',marginTop:18,fontSize:12,color:'var(--navy)',lineHeight:1.6,display:'flex',gap:10,alignItems:'flex-start' }} className="animate-in delay-3">
        <Shield size={14} color="var(--gold)" style={{ flexShrink:0,marginTop:1 }}/>
        <span>
          <strong>Joint Account Policy:</strong> All assets are divided equally among all {n} holders ({(100/n).toFixed(2)}% each).
          Liquidation requires <strong>{mandate==='AND'?'all holders':'any one holder'}</strong> to authorise (mandate: {mandate}).
          The mandate type was locked at account creation and cannot be changed without compliance review.
        </span>
      </div>
    </div>
  );
}
