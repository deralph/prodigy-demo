import React, { useState } from 'react';
import { Gift, Check, ChevronRight } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

export default function DividendDeclaration() {
  const { plans, clientInvestments, dividends, declareDividend, user, addAuditEntry } = useAppStore();
  const [form, setForm]     = useState({ planId:'', rate:'', declarationDate:'', paymentDate:'', notes:'' });
  const [success, setSuccess] = useState(false);

  const plan        = plans.find(p => p.id === form.planId);
  const eligible    = clientInvestments.filter(i => i.planId === form.planId && i.status === 'active');
  const totalPayout = eligible.reduce((s,i) => s + (i.amount * (parseFloat(form.rate)||0)/100), 0);

  const log = (action, target) => addAuditEntry({
    id:'AUD-'+Date.now(), adminId:user?.clientId, admin:user?.name, role:user?.adminRole,
    action, target, category:'investment',
    time: new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}), ip:'—',
  });

  const handleDeclare = () => {
    if (!form.planId || !form.rate || !form.declarationDate) return;
    const entry = {
      id: 'DIV-'+Date.now(),
      planId: form.planId, plan: plan?.name,
      rate: parseFloat(form.rate), totalPayout,
      eligibleCount: eligible.length,
      declarationDate: form.declarationDate,
      paymentDate: form.paymentDate,
      notes: form.notes,
      declaredBy: user?.name,
      status: 'declared',
    };
    declareDividend(entry);
    log('Declared Dividend', `${plan?.name} — ${form.rate}% — ${fmt(totalPayout)}`);
    setSuccess(true); setTimeout(()=>setSuccess(false),3500);
    setForm({ planId:'', rate:'', declarationDate:'', paymentDate:'', notes:'' });
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Dividend Declaration</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Declare dividends per investment product</p>
      </div>

      {success && (
        <div style={{ background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:9,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:10 }}>
          <Check size={16} color="var(--green)"/>
          <span style={{ fontSize:13,color:'var(--green)',fontWeight:600 }}>Dividend declared successfully</span>
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'1.2fr 0.8fr',gap:22,alignItems:'start' }}>
        <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',padding:'24px' }} className="animate-in delay-1">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:20 }}>New Declaration</h3>
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Investment Product</div>
              <select value={form.planId} onChange={e=>setForm(f=>({...f,planId:e.target.value}))}
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}>
                <option value="">Select product…</option>
                {plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
              <div>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Dividend Rate (%)</div>
                <input type="number" step="0.01" placeholder="e.g. 5.5" value={form.rate} onChange={e=>setForm(f=>({...f,rate:e.target.value}))}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
              </div>
              <div>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Declaration Date</div>
                <input type="date" value={form.declarationDate} onChange={e=>setForm(f=>({...f,declarationDate:e.target.value}))}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
              </div>
              <div>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Payment Date</div>
                <input type="date" value={form.paymentDate} onChange={e=>setForm(f=>({...f,paymentDate:e.target.value}))}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
              </div>
            </div>
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Notes</div>
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} placeholder="Optional internal notes..."
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',resize:'vertical' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            </div>
            <button onClick={handleDeclare} disabled={!form.planId||!form.rate||!form.declarationDate}
              style={{ background:'var(--navy)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,border:'none',borderRadius:8,padding:'14px',cursor:'pointer',letterSpacing:'0.06em',display:'flex',alignItems:'center',justifyContent:'center',gap:7,opacity:(!form.planId||!form.rate||!form.declarationDate)?0.5:1 }}>
              <Gift size={14}/> DECLARE DIVIDEND
            </button>
          </div>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          {form.planId && form.rate && (
            <div style={{ background:'var(--navy)',borderRadius:14,padding:'22px',color:'white' }} className="animate-in">
              <div style={{ fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',marginBottom:14 }}>Impact Preview</div>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {[
                  ['Product', plan?.name],
                  ['Eligible Investors', eligible.length],
                  ['Dividend Rate', `${form.rate}%`],
                  ['Total Payout', fmt(Math.round(totalPayout))],
                ].map(([l,v])=>(
                  <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize:11,color:'rgba(255,255,255,0.5)' }}>{l}</span>
                    <span style={{ fontSize:12,fontWeight:700,color:'white' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14,background:'rgba(232,184,75,0.15)',borderRadius:9,padding:'12px',border:'1px solid rgba(232,184,75,0.3)' }}>
                <div style={{ fontSize:10,color:'var(--gold)',marginBottom:4 }}>Total Cash Out</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:'var(--gold)' }}>{fmt(Math.round(totalPayout))}</div>
              </div>
            </div>
          )}

          {/* History */}
          <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }}>
            <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--gray-100)' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Declaration History</div>
            </div>
            {dividends.length === 0 ? (
              <EmptyState
                icon={Gift}
                title="No dividends declared yet"
                message="Dividend declarations will appear here once declared by admin."
                compact
              />
            ) : dividends.map((d,i)=>(
              <div key={d.id} style={{ padding:'14px 18px',borderBottom:i<dividends.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:12,color:'var(--navy)' }}>{d.plan}</div>
                  <div style={{ fontSize:10,color:'var(--gray-400)',marginTop:2 }}>{d.declarationDate} · {d.eligibleCount} investors</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--green)' }}>{d.rate}%</div>
                  <div style={{ fontSize:10,color:'var(--gray-400)' }}>{fmt(d.totalPayout)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:700px){div[style*="1.2fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
