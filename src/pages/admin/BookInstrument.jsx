import React, { useState } from 'react';
import { BookOpen, Check, TrendingUp } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');
const BLANK = { clientId:'', planId:'', amount:'', tenor:'', valueDate:'', rollover:false, notes:'', instrumentType:'product' };

const INSTRUMENT_TYPES = [
  { id:'product',     label:'Investment Product',    desc:'Book from available product plans' },
  { id:'tbill_91',    label:'Treasury Bill — 91 Day',  desc:'Federal Govt. T-Bill · 91-day tenor · ~18% p.a.' },
  { id:'tbill_182',   label:'Treasury Bill — 182 Day', desc:'Federal Govt. T-Bill · 182-day tenor · ~19.5% p.a.' },
  { id:'tbill_364',   label:'Treasury Bill — 364 Day', desc:'Federal Govt. T-Bill · 364-day tenor · ~21% p.a.' },
  { id:'fixed_income',label:'Fixed Income Bond',       desc:'Corporate / Govt bond · custom rate & tenor' },
  { id:'eurobond',    label:'Eurobond',                desc:'USD-denominated sovereign bond' },
];

const TBILL_RATES = { tbill_91: 18, tbill_182: 19.5, tbill_364: 21 };

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
  const isTBill = form.instrumentType.startsWith('tbill');
  const tbillRate = TBILL_RATES[form.instrumentType] || 0;
  const effectiveRate = isTBill ? tbillRate : (plan ? parseFloat(plan.roi) : 0);
  const effectiveTax  = isTBill ? 10 : (plan?.taxRate || 0);

  const expectedReturn = () => {
    if (!form.amount || !form.tenor) return '₦—';
    const roi = effectiveRate / 100;
    const months = parseInt(form.tenor);
    const gross = parseFloat(form.amount) * roi * (months / 12);
    const tax = gross * (effectiveTax / 100);
    return fmt(Math.round(gross - tax));
  };

  const instrumentLabel = isTBill ? INSTRUMENT_TYPES.find(i=>i.id===form.instrumentType)?.label : (plan?.name || form.instrumentType);

  const handleBook = () => {
    if (!form.clientId || !form.amount || !form.valueDate) return;
    if (!isTBill && !form.planId) return;
    const entry = {
      id: 'INV-' + Date.now(),
      clientId: form.clientId,
      client: client?.name || client?.companyName || '—',
      planId: form.planId || form.instrumentType,
      plan: instrumentLabel,
      amount: parseFloat(form.amount),
      tenor: `${form.tenor} months`,
      valueDate: new Date(form.valueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
      maturityDate: maturity(),
      roi: effectiveRate,
      tax: effectiveTax,
      status: 'active',
      rollover: form.rollover,
      notes: form.notes,
      bookedBy: user?.name,
      instrumentType: form.instrumentType,
    };
    bookInvestment(entry);
    addAuditEntry({
      id: 'AUD-'+Date.now(), adminId: user?.clientId, admin: user?.name, role: user?.adminRole,
      action: 'Booked Investment Instrument', target: `${client?.name||client?.companyName} — ${instrumentLabel} — ${fmt(entry.amount)}`,
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
            {/* Instrument Type */}
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:8 }}>Instrument Type</div>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {INSTRUMENT_TYPES.map(it=>(
                  <div key={it.id} onClick={()=>setForm(f=>({...f,instrumentType:it.id,planId:it.id==='product'?f.planId:'',tenor:it.id==='tbill_91'?'3':it.id==='tbill_182'?'6':it.id==='tbill_364'?'12':f.tenor}))} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,border:`1.5px solid ${form.instrumentType===it.id?'var(--navy)':'var(--gray-200)'}`,cursor:'pointer',background:form.instrumentType===it.id?'var(--navy)':'white',transition:'all 0.15s' }}>
                    <div style={{ width:14,height:14,borderRadius:'50%',border:`2px solid ${form.instrumentType===it.id?'var(--gold)':'var(--gray-300)'}`,background:form.instrumentType===it.id?'var(--gold)':'white',flexShrink:0 }}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:12,fontWeight:700,color:form.instrumentType===it.id?'white':'var(--navy)' }}>{it.label}</div>
                      <div style={{ fontSize:10,color:form.instrumentType===it.id?'rgba(255,255,255,0.6)':'var(--gray-400)' }}>{it.desc}</div>
                    </div>
                    {isTBill && it.id===form.instrumentType && <span style={{ fontSize:11,fontWeight:800,color:'var(--gold)' }}>{tbillRate}% p.a.</span>}
                  </div>
                ))}
              </div>
            </div>
            {/* Client */}
            <div>
              <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Client</div>
              <select value={form.clientId} onChange={e=>setForm(f=>({...f,clientId:e.target.value}))}
                style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}>
                <option value="">Select client…</option>
                {clients.map(c=><option key={c.clientId} value={c.clientId}>{c.name||c.companyName} ({c.accountType})</option>)}
              </select>
            </div>
            {/* Product — only show when instrument type is 'product' */}
            {form.instrumentType === 'product' && (
              <div>
                <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Investment Product</div>
                <select value={form.planId} onChange={e=>setForm(f=>({...f,planId:e.target.value}))}
                  style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}>
                  <option value="">Select product…</option>
                  {plans.map(p=><option key={p.id} value={p.id}>{p.name} ({p.roi} ROI)</option>)}
                </select>
              </div>
            )}
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
            <button onClick={handleBook} disabled={!form.clientId||(!isTBill&&!form.planId)||!form.amount||!form.valueDate}
              style={{ background:'var(--navy)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,border:'none',borderRadius:8,padding:'14px',cursor:'pointer',letterSpacing:'0.06em',display:'flex',alignItems:'center',justifyContent:'center',gap:7,opacity:(!form.clientId||(!isTBill&&!form.planId)||!form.amount||!form.valueDate)?0.5:1 }}>
              <BookOpen size={14}/> BOOK INSTRUMENT
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ background:'var(--navy)',borderRadius:14,padding:'24px',color:'white' }} className="animate-in delay-2">
          <div style={{ fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.5)',marginBottom:16 }}>Preview</div>
          {[
            ['Client',         client?.name || client?.companyName || '—'],
            ['Instrument',     instrumentLabel || '—'],
            ['Amount',         form.amount ? fmt(parseFloat(form.amount)) : '—'],
            ['Tenor',          form.tenor ? `${form.tenor} months` : '—'],
            ['Value Date',     form.valueDate ? new Date(form.valueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'],
            ['Maturity Date',  maturity()],
            ['ROI Rate',       effectiveRate ? `${effectiveRate}% p.a.` : '—'],
            ['Tax Rate',       effectiveTax !== undefined ? `${effectiveTax}%` : '—'],
            ['Net Return',     expectedReturn()],
            ['Auto Rollover',  form.rollover ? 'Yes' : 'No'],
          ].map(([l,v])=>(
            <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.5)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
              <span style={{ fontSize:12,fontWeight:600,color:'white' }}>{v}</span>
            </div>
          ))}
          {(isTBill || plan) && form.amount && (
            <div style={{ marginTop:16,background:'rgba(232,184,75,0.15)',borderRadius:9,padding:'12px 14px',border:'1px solid rgba(232,184,75,0.3)' }}>
              <div style={{ fontSize:10,color:'var(--gold)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4 }}>Est. Gross Return</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'var(--gold)' }}>
                {form.tenor ? fmt(Math.round(parseFloat(form.amount||0)*(effectiveRate/100)*(parseInt(form.tenor)/12))) : '—'}
              </div>
              <div style={{ fontSize:9,color:'rgba(232,184,75,0.6)',marginTop:3 }}>Before {effectiveTax}% withholding tax</div>
            </div>
          )}
        </div>
      </div>
      <style>{`@media(max-width:700px){div[style*="grid-template-columns: 1.2fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
