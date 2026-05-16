import React, { useState } from 'react';
import { BookOpen, Check } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');
const BLANK = { clientId:'', planId:'', amount:'', tenor:'', valueDate:'', rollover:false, notes:'' };

export default function BookInstrument() {
  const { clients, plans, user, bookInvestment, addAuditEntry } = useAppStore();
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState(false);

  const plan = plans.find(p => p.id === form.planId);
  const client = clients.find(c => c.clientId === form.clientId);
  const maturity = () => {
    if (!form.valueDate || !form.tenor) return '—';
    const months = parseInt(form.tenor);
    const d = new Date(form.valueDate);
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  };
  const expectedReturn = () => {
    if (!plan || !form.amount || !form.tenor) return '₦—';
    const roi = parseFloat(plan.roi) / 100;
    const months = parseInt(form.tenor);
    const gross = parseFloat(form.amount) * roi * (months / 12);
    const tax = gross * ((plan.taxRate||0)/100);
    return fmt(Math.round(gross - tax));
  };

  const handleBook = () => {
    if (!form.clientId || !form.planId || !form.amount || !form.valueDate) return;
    const entry = {
      id: 'INV-' + Date.now(),
      clientId: form.clientId,
      client: client?.name || client?.companyName || '—',
      planId: form.planId,
      plan: plan?.name,
      amount: parseFloat(form.amount),
      tenor: `${form.tenor} months`,
      valueDate: new Date(form.valueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
      maturityDate: maturity(),
      roi: parseFloat(plan?.roi),
      tax: plan?.taxRate || 0,
      status: 'active',
      rollover: form.rollover,
      notes: form.notes,
      bookedBy: user?.name,
    };
    bookInvestment(entry);
    addAuditEntry({
      id: 'AUD-'+Date.now(), adminId: user?.clientId, admin: user?.name, role: user?.adminRole,
      action: 'Booked Investment Instrument', target: `${client?.name||client?.companyName} — ${plan?.name} — ${fmt(entry.amount)}`,
      time: new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),
      category:'investment', ip:'—',
    });
    setSaved(true); setTimeout(()=>setSaved(false),3000);
    setForm(BLANK);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Book Instrument</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Book an investment for an existing client</p>
      </div>

      {saved && (
        <div style={{ background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:9,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:10 }}>
          <Check size={16} color="var(--green)"/>
          <span style={{ fontSize:13,color:'var(--green)',fontWeight:600 }}>Investment booked successfully</span>
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'1.2fr 0.8fr',gap:22,alignItems:'start' }}>
        {/* Form */}
        <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',padding:'24px' }} className="animate-in delay-1">
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:20 }}>Investment Details</h3>
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            {/* Client */}
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Client</div>
              <select value={form.clientId} onChange={e=>setForm(f=>({...f,clientId:e.target.value}))}
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}>
                <option value="">Select client…</option>
                {clients.map(c=><option key={c.clientId} value={c.clientId}>{c.name||c.companyName} ({c.accountType})</option>)}
              </select>
            </div>
            {/* Product */}
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Investment Product</div>
              <select value={form.planId} onChange={e=>setForm(f=>({...f,planId:e.target.value}))}
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}>
                <option value="">Select product…</option>
                {plans.map(p=><option key={p.id} value={p.id}>{p.name} ({p.roi} ROI)</option>)}
              </select>
            </div>
            {/* Amount & Tenor */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
              <div>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Principal Amount (₦)</div>
                <input type="number" placeholder="e.g. 5000000" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
              </div>
              <div>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Tenor (Months)</div>
                <input type="number" min="1" max="60" placeholder="e.g. 6" value={form.tenor} onChange={e=>setForm(f=>({...f,tenor:e.target.value}))}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
              </div>
            </div>
            {/* Value Date */}
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Value Date</div>
              <input type="date" value={form.valueDate} onChange={e=>setForm(f=>({...f,valueDate:e.target.value}))}
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            </div>
            {/* Rollover */}
            <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--gray-50)',borderRadius:8,cursor:'pointer' }} onClick={()=>setForm(f=>({...f,rollover:!f.rollover}))}>
              <div style={{ width:18,height:18,borderRadius:5,border:`2px solid ${form.rollover?'var(--navy)':'var(--gray-300)'}`,background:form.rollover?'var(--navy)':'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                {form.rollover && <Check size={11} color="white"/>}
              </div>
              <span style={{ fontSize:12,color:'var(--navy)',fontWeight:600 }}>Auto Rollover at maturity</span>
            </div>
            {/* Notes */}
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Notes (optional)</div>
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} placeholder="Internal booking notes..."
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',resize:'vertical' }}
                onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
            </div>
            <button onClick={handleBook} disabled={!form.clientId||!form.planId||!form.amount||!form.valueDate}
              style={{ background:'var(--navy)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,border:'none',borderRadius:8,padding:'14px',cursor:'pointer',letterSpacing:'0.06em',display:'flex',alignItems:'center',justifyContent:'center',gap:7,opacity:(!form.clientId||!form.planId||!form.amount||!form.valueDate)?0.5:1 }}>
              <BookOpen size={14}/> BOOK INSTRUMENT
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ background:'var(--navy)',borderRadius:14,padding:'24px',color:'white' }} className="animate-in delay-2">
          <div style={{ fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',marginBottom:16 }}>Preview</div>
          {[
            ['Client',         client?.name || client?.companyName || '—'],
            ['Product',        plan?.name || '—'],
            ['Amount',         form.amount ? fmt(parseFloat(form.amount)) : '—'],
            ['Tenor',          form.tenor ? `${form.tenor} months` : '—'],
            ['Value Date',     form.valueDate ? new Date(form.valueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'],
            ['Maturity Date',  maturity()],
            ['ROI Rate',       plan ? `${plan.roi}% p.a.` : '—'],
            ['Tax Rate',       plan ? `${plan.taxRate}%` : '—'],
            ['Net Return',     expectedReturn()],
            ['Auto Rollover',  form.rollover ? 'Yes' : 'No'],
          ].map(([l,v])=>(
            <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.5)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
              <span style={{ fontSize:12,fontWeight:600,color:'white' }}>{v}</span>
            </div>
          ))}
          {plan && form.amount && (
            <div style={{ marginTop:16,background:'rgba(232,184,75,0.15)',borderRadius:9,padding:'12px 14px',border:'1px solid rgba(232,184,75,0.3)' }}>
              <div style={{ fontSize:10,color:'var(--gold)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4 }}>Est. Gross Return</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'var(--gold)' }}>
                {form.tenor ? fmt(Math.round(parseFloat(form.amount||0)*(parseFloat(plan.roi)/100)*(parseInt(form.tenor)/12))) : '—'}
              </div>
              <div style={{ fontSize:9,color:'rgba(232,184,75,0.6)',marginTop:3 }}>Before {plan.taxRate}% withholding tax</div>
            </div>
          )}
        </div>
      </div>
      <style>{`@media(max-width:700px){div[style*="grid-template-columns: 1.2fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
