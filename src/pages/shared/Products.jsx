import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, Shield, ChevronRight, X, ArrowUpRight } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { productApi, investmentApi } from '../../services/api';
import EmptyState from '../../components/EmptyState';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

export default function Products() {
  const { plans, user } = useAppStore();
  const [selected, setSelected] = useState(null);
  const [subModal, setSubModal] = useState(null);
  const [subForm, setSubForm] = useState({ amount:'', tenor:'' });
  const [subSuccess, setSubSuccess] = useState(false);

  const handleSubscribe = () => {
    if (!subModal || !subForm.amount) return;
    // Try backend
    investmentApi.subscribe({
      productId: subModal.id,
      amount: parseFloat(subForm.amount),
      tenor: subForm.tenor || undefined,
    }).catch(() => {});
    setSubSuccess(true);
    setTimeout(() => { setSubSuccess(false); setSubModal(null); setSubForm({ amount:'', tenor:'' }); }, 2000);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Investment Products</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>Explore available investment opportunities</p>
      </div>

      {/* Product Cards Grid */}
      {plans.length === 0 && (
        <EmptyState icon={TrendingUp} title="No investment products yet" message="Investment products will appear here once they are set up by the Prodigy Finance team." />
      )}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:18 }} className="animate-in delay-1">
        {plans.map((plan, idx) => (
          <div key={plan.id} className={`animate-in delay-${Math.min(idx+1,4)}`}
            style={{
              background:'white',borderRadius:16,border:'1px solid var(--gray-200)',overflow:'hidden',
              transition:'transform 0.2s, box-shadow 0.2s',cursor:'pointer',
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(13,27,53,0.1)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
            onClick={() => setSelected(plan)}
          >
            {/* Color bar */}
            <div style={{ height:5, background:plan.color }} />
            <div style={{ padding:'20px 22px' }}>
              {/* Header */}
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'var(--navy)',letterSpacing:'0.02em' }}>{plan.name}</div>
                  {plan.tag && (
                    <span style={{ fontSize:9,fontWeight:700,color:plan.color,background:`${plan.color}15`,padding:'2px 7px',borderRadius:4,letterSpacing:'0.08em',textTransform:'uppercase',marginTop:4,display:'inline-block' }}>{plan.tag}</span>
                  )}
                </div>
                <div style={{ background:`${plan.color}12`,borderRadius:8,padding:'8px 12px',textAlign:'right' }}>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:plan.color }}>{plan.roi}</div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize:12,color:'var(--gray-500)',lineHeight:1.5,marginBottom:16 }}>{plan.desc}</p>

              {/* Details Grid */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
                <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                  <DollarSign size={12} color="var(--gray-400)"/>
                  <div>
                    <div style={{ fontSize:8,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Min. Investment</div>
                    <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{plan.minInvest > 0 ? fmt(plan.minInvest) : 'Negotiable'}</div>
                  </div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                  <Clock size={12} color="var(--gray-400)"/>
                  <div>
                    <div style={{ fontSize:8,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Lock-in Period</div>
                    <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{plan.lockIn}</div>
                  </div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                  <Shield size={12} color="var(--gray-400)"/>
                  <div>
                    <div style={{ fontSize:8,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Tax Rate</div>
                    <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{plan.taxRate}% WHT</div>
                  </div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                  <TrendingUp size={12} color="var(--gray-400)"/>
                  <div>
                    <div style={{ fontSize:8,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase' }}>Tenor</div>
                    <div style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>{plan.hasTenor ? 'Flexible' : 'Fixed'}</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button onClick={(e) => { e.stopPropagation(); setSubModal(plan); }} style={{
                width:'100%',background:plan.color,color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,
                fontSize:11,border:'none',borderRadius:8,padding:'12px',cursor:'pointer',letterSpacing:'0.06em',
                textTransform:'uppercase',display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                transition:'opacity 0.2s',
              }}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
              >
                <ArrowUpRight size={13}/> Invest Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && !subModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>setSelected(null)}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:520,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
            <div style={{ height:5,background:selected.color }}/>
            <div style={{ padding:'24px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'var(--navy)' }}>{selected.name}</div>
                  {selected.tag && <span style={{ fontSize:9,fontWeight:700,color:selected.color,background:`${selected.color}15`,padding:'2px 7px',borderRadius:4,letterSpacing:'0.08em',textTransform:'uppercase',marginTop:4,display:'inline-block' }}>{selected.tag}</span>}
                </div>
                <button onClick={()=>setSelected(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)' }}><X size={18}/></button>
              </div>
              <p style={{ fontSize:13,color:'var(--gray-500)',lineHeight:1.6,marginBottom:20 }}>{selected.desc}</p>
              <div style={{ display:'flex',flexDirection:'column',gap:0 }}>
                {[
                  ['ROI', selected.roi],
                  ['Minimum Investment', selected.minInvest > 0 ? fmt(selected.minInvest) : 'Negotiable'],
                  ['Lock-in Period', selected.lockIn],
                  ['Tax Rate', `${selected.taxRate}% WHT`],
                  ['Tenor Type', selected.hasTenor ? 'Flexible Tenor' : 'Fixed Tenor'],
                  ...(selected.hasTenor && selected.tenorOptions.length > 0 ? [['Available Tenors', selected.tenorOptions.join(', ')]] : []),
                ].map(([l,v]) => (
                  <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.06em',textTransform:'uppercase' }}>{l}</span>
                    <span style={{ fontSize:12,fontWeight:600,color:'var(--navy)',textAlign:'right',maxWidth:'55%' }}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setSelected(null); setSubModal(selected); }} style={{
                width:'100%',marginTop:20,background:selected.color,color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,
                fontSize:12,border:'none',borderRadius:8,padding:'14px',cursor:'pointer',letterSpacing:'0.06em',
                display:'flex',alignItems:'center',justifyContent:'center',gap:7,
              }}>
                <ArrowUpRight size={14}/> INVEST IN THIS PRODUCT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscribe Modal */}
      {subModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(13,27,53,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:20 }} onClick={()=>{setSubModal(null);setSubSuccess(false);}}>
          <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:440,overflow:'hidden',boxShadow:'0 32px 80px rgba(13,27,53,0.25)',animation:'modalIn 0.25s ease' }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:subModal.color,padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'white' }}>Subscribe to {subModal.name}</h3>
                <p style={{ fontSize:10,color:'rgba(255,255,255,0.6)',letterSpacing:'0.08em',marginTop:2 }}>{subModal.roi}</p>
              </div>
              <button onClick={()=>{setSubModal(null);setSubSuccess(false);}} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {subSuccess ? (
                <div style={{ textAlign:'center',padding:'30px 0' }}>
                  <div style={{ width:52,height:52,borderRadius:'50%',background:'rgba(34,197,94,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px' }}>
                    <TrendingUp size={22} color="var(--green)"/>
                  </div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--navy)',marginBottom:6 }}>Subscription Submitted!</div>
                  <p style={{ fontSize:12,color:'var(--gray-400)' }}>Your investment request is pending approval.</p>
                </div>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                  <div>
                    <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Investment Amount (₦)</div>
                    <input type="number" placeholder={subModal.minInvest > 0 ? `Min: ${fmt(subModal.minInvest)}` : 'Enter amount'}
                      value={subForm.amount} onChange={e=>setSubForm(f=>({...f,amount:e.target.value}))}
                      style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'12px',fontFamily:'DM Sans,sans-serif',fontSize:14,outline:'none',fontWeight:600 }}
                      onFocus={e=>e.target.style.borderColor=subModal.color} onBlur={e=>e.target.style.borderColor='var(--gray-200)'}/>
                  </div>
                  {subModal.hasTenor && subModal.tenorOptions.length > 0 && (
                    <div>
                      <div style={{ fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:6 }}>Select Tenor</div>
                      <select value={subForm.tenor} onChange={e=>setSubForm(f=>({...f,tenor:e.target.value}))}
                        style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:9,padding:'12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}>
                        <option value="">Choose tenor...</option>
                        {subModal.tenorOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                  {subForm.amount && (
                    <div style={{ background:'rgba(13,27,53,0.03)',borderRadius:10,padding:'14px',border:'1px solid var(--gray-200)' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                        <span style={{ fontSize:10,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.08em' }}>Amount</span>
                        <span style={{ fontSize:13,fontWeight:700,color:'var(--navy)' }}>{fmt(parseFloat(subForm.amount))}</span>
                      </div>
                      {subModal.roiNum > 0 && (
                        <div style={{ display:'flex',justifyContent:'space-between' }}>
                          <span style={{ fontSize:10,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.08em' }}>Est. Annual Return</span>
                          <span style={{ fontSize:13,fontWeight:700,color:'var(--green)' }}>{fmt(Math.round(parseFloat(subForm.amount) * subModal.roiNum / 100))}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={handleSubscribe} disabled={!subForm.amount || (subModal.minInvest > 0 && parseFloat(subForm.amount) < subModal.minInvest)}
                    style={{
                      background:subModal.color,color:'white',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,
                      border:'none',borderRadius:8,padding:'14px',cursor:'pointer',letterSpacing:'0.06em',
                      display:'flex',alignItems:'center',justifyContent:'center',gap:7,
                      opacity:(!subForm.amount || (subModal.minInvest > 0 && parseFloat(subForm.amount) < subModal.minInvest)) ? 0.5 : 1,
                    }}>
                    <ArrowUpRight size={14}/> SUBSCRIBE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
