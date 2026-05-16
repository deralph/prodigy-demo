import React, { useState } from 'react';
import { PlayCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const STEPS = [
  { key:'accruals',    label:'Post Daily Interest Accruals',   desc:'Calculates and posts daily interest for all active investments' },
  { key:'maturities',  label:'Process Matured Investments',     desc:'Moves matured investments to matured status and queues redemption' },
  { key:'dividends',   label:'Pay Pending Dividends',           desc:'Processes all declared dividends not yet paid' },
  { key:'statements',  label:'Generate Daily Statements',       desc:'Creates daily portfolio statements per client' },
  { key:'reports',     label:'Snapshot End-of-Day Reports',     desc:'Captures AUM and position snapshot for analytics' },
  { key:'audit',       label:'Archive Audit Log',               desc:'Archives completed audit entries for the day' },
];

export default function EODRun() {
  const { user, addAuditEntry } = useAppStore();
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState({});
  const [step, setStep]         = useState(-1);
  const [finished, setFinished] = useState(false);
  const isOps = ['super_admin','operations'].includes(user?.adminRole);

  const runEOD = async () => {
    setRunning(true); setDone({}); setFinished(false);
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 900 + Math.random()*600));
      setDone(d => ({ ...d, [STEPS[i].key]: true }));
    }
    setStep(-1); setRunning(false); setFinished(true);
    addAuditEntry({
      id:'AUD-'+Date.now(), adminId:user?.clientId, admin:user?.name, role:user?.adminRole,
      action:'EOD Run Completed', target: `${STEPS.length} steps executed`,
      time: new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),
      category:'system', ip:'—',
    });
  };

  const progress = Object.keys(done).length;

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>EOD Run</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>End-of-day batch processing — run only once per trading day</p>
      </div>

      {!isOps && (
        <div style={{ background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:10 }}>
          <AlertTriangle size={16} color="var(--red)"/>
          <span style={{ fontSize:13,color:'var(--red)',fontWeight:600 }}>Operations role required to execute EOD run</span>
        </div>
      )}

      {finished && (
        <div style={{ background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:9,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:10 }}>
          <CheckCircle size={16} color="var(--green)"/>
          <span style={{ fontSize:13,color:'var(--green)',fontWeight:600 }}>EOD run completed — all {STEPS.length} steps executed successfully</span>
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'1fr 0.6fr',gap:22,alignItems:'start' }}>
        {/* Steps */}
        <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-1">
          <div style={{ padding:'16px 20px',borderBottom:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase' }}>Processing Steps</h3>
            {running && (
              <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--gold)',fontWeight:700 }}>
                <span className="animate-pulse">●</span> Running…
              </div>
            )}
          </div>
          {STEPS.map((s,i)=>{
            const isDone    = done[s.key];
            const isCurrent = running && step === i;
            return (
              <div key={s.key} style={{ padding:'16px 20px',borderBottom:i<STEPS.length-1?'1px solid var(--gray-100)':'none',display:'flex',alignItems:'center',gap:14,opacity:(!running&&!finished&&!isDone)?0.5:1,transition:'opacity 0.3s' }}>
                <div style={{ width:32,height:32,borderRadius:'50%',background:isDone?'rgba(34,197,94,0.1)':isCurrent?'rgba(232,184,75,0.12)':'var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.3s' }}>
                  {isDone ? <CheckCircle size={16} color="var(--green)"/> : isCurrent ? <Clock size={16} color="var(--gold)"/> : <span style={{ fontSize:11,fontWeight:700,color:'var(--gray-400)' }}>{i+1}</span>}
                </div>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:isDone?'var(--green)':isCurrent?'var(--navy)':'var(--gray-600)',transition:'color 0.3s' }}>{s.label}</div>
                  <div style={{ fontSize:11,color:'var(--gray-400)',marginTop:2 }}>{s.desc}</div>
                </div>
              </div>
            );
          })}

          {/* Progress bar */}
          {running && (
            <div style={{ padding:'14px 20px',borderTop:'1px solid var(--gray-100)' }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                <span style={{ fontSize:11,color:'var(--gray-400)' }}>Progress</span>
                <span style={{ fontSize:11,fontWeight:700,color:'var(--navy)' }}>{progress}/{STEPS.length}</span>
              </div>
              <div style={{ height:6,background:'var(--gray-100)',borderRadius:3,overflow:'hidden' }}>
                <div style={{ height:'100%',background:'var(--navy)',borderRadius:3,width:`${(progress/STEPS.length)*100}%`,transition:'width 0.5s ease' }}/>
              </div>
            </div>
          )}
        </div>

        {/* Launch panel */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }} className="animate-in delay-2">
          <div style={{ background:running?'rgba(232,184,75,0.08)':finished?'rgba(34,197,94,0.06)':'var(--navy)',borderRadius:14,padding:'26px',border:running||finished?'1px solid var(--gray-200)':'none',textAlign:'center' }}>
            <div style={{ width:60,height:60,borderRadius:'50%',background:running?'rgba(232,184,75,0.15)':finished?'rgba(34,197,94,0.12)':'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',transition:'all 0.3s' }}>
              {finished ? <CheckCircle size={26} color="var(--green)"/> : <PlayCircle size={26} color={running?'var(--gold)':'white'}/>}
            </div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:running||finished?'var(--navy)':'white',marginBottom:6 }}>
              {finished ? 'Run Complete' : running ? 'Processing…' : 'EOD Batch Run'}
            </div>
            <div style={{ fontSize:12,color:running||finished?'var(--gray-400)':'rgba(255,255,255,0.6)',marginBottom:20,lineHeight:1.6 }}>
              {finished ? `All ${STEPS.length} batch jobs completed successfully` : running ? `Processing step ${step+1} of ${STEPS.length}…` : 'Runs all end-of-day batch jobs in sequence. Do not interrupt.'}
            </div>
            <button
              onClick={isOps&&!running&&!finished ? runEOD : undefined}
              disabled={!isOps||running||finished}
              style={{ width:'100%',padding:'14px',background:finished?'var(--green)':running?'rgba(232,184,75,0.3)':isOps?'white':'rgba(255,255,255,0.2)',color:finished?'white':running?'var(--gold)':isOps?'var(--navy)':'rgba(255,255,255,0.4)',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:12,letterSpacing:'0.06em',border:'none',borderRadius:8,cursor:isOps&&!running&&!finished?'pointer':'default',transition:'all 0.3s' }}>
              {finished ? '✓ COMPLETED' : running ? 'RUNNING…' : isOps ? 'LAUNCH EOD RUN' : 'NO PERMISSION'}
            </button>
          </div>

          <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'16px' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color:'var(--navy)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:10 }}>Notes</div>
            {[
              'Run only once after markets close',
              'Ensure all approvals are processed first',
              'Finance queue should be clear',
              'Do not interrupt mid-run',
            ].map(n=>(
              <div key={n} style={{ display:'flex',alignItems:'flex-start',gap:7,marginBottom:7,fontSize:12,color:'var(--gray-600)' }}>
                <span style={{ width:4,height:4,borderRadius:'50%',background:'var(--gold)',flexShrink:0,marginTop:6 }}/>
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} .animate-pulse{animation:pulse 1.2s ease-in-out infinite}`}</style>
    </div>
  );
}
