import React, { useState } from 'react';
import { Download, Search } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import StatusBadge from '../../components/shared/StatusBadge';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits:0 });

const ALL_TXN = [
  { id:'TXN-001', client:'Prodigy Holdings Ltd', type:'wallet_funding',  amount:1250000,  date:'Feb 28, 2024', status:'successful', ref:'PSK-ABC123', clientType:'corporate' },
  { id:'TXN-002', client:'John Doe',             type:'subscription',    amount:50000000, date:'Feb 20, 2024', status:'successful', ref:'INV-DEF456', clientType:'individual' },
  { id:'TXN-003', client:'Awobajo Lanre Daniel', type:'wallet_funding',  amount:8750000,  date:'Mar 10, 2024', status:'successful', ref:'PSK-GHI789', clientType:'joint' },
  { id:'TXN-004', client:'Prodigy Holdings Ltd', type:'redemption',      amount:2000000,  date:'Apr 17, 2024', status:'pending',    ref:'RED-JKL012', clientType:'corporate' },
  { id:'TXN-005', client:'Amaka Okonkwo',        type:'wallet_funding',  amount:500000,   date:'Apr 22, 2024', status:'failed',     ref:'PSK-MNO345', clientType:'individual' },
  { id:'TXN-006', client:'John Doe',             type:'subscription',    amount:12500000, date:'Mar 15, 2024', status:'successful', ref:'INV-PQR678', clientType:'individual' },
  { id:'TXN-007', client:'Heritage Global Inv.', type:'subscription',    amount:75000000, date:'Dec 10, 2023', status:'successful', ref:'INV-STU901', clientType:'corporate' },
];

const typeColor = { wallet_funding:'#3b82f6', subscription:'#22c55e', redemption:'#f97316' };
const typeLabel = { wallet_funding:'Wallet Funding', subscription:'Subscription', redemption:'Redemption' };

export default function TransactionLedger() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = ALL_TXN.filter(t => {
    const ms = t.client.toLowerCase().includes(search.toLowerCase()) || t.ref.toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'all' || t.type === typeFilter;
    return ms && mt;
  });

  const total = filtered.reduce((s,t) => s + (t.status==='successful'?t.amount:0), 0);

  const exportCSV = () => {
    const rows = filtered.map(t => `"${t.date}","${t.id}","${t.client}","${typeLabel[t.type]}","${t.amount}","${t.ref}","${t.status}"`).join('\n');
    const blob = new Blob(['Date,ID,Client,Type,Amount,Reference,Status\n'+rows],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }} className="animate-in">
        <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(18px,3vw,24px)',color:'var(--navy)',letterSpacing:'0.02em',textTransform:'uppercase' }}>Transaction Ledger</h1>
        <p style={{ fontSize:11,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:4 }}>All transactions across clients and account types</p>
      </div>

      {/* Summary */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:22 }} className="animate-in delay-1">
        {[
          { label:'Total Volume',    val: fmt(ALL_TXN.reduce((s,t)=>s+t.amount,0)), color:'var(--navy)' },
          { label:'Successful',      val: ALL_TXN.filter(t=>t.status==='successful').length, color:'var(--green)' },
          { label:'Pending',         val: ALL_TXN.filter(t=>t.status==='pending').length,    color:'var(--gold)' },
          { label:'Failed',          val: ALL_TXN.filter(t=>t.status==='failed').length,     color:'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ background:'white',borderRadius:10,padding:'16px 18px',border:'1px solid var(--gray-200)' }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:s.color,marginBottom:4 }}>{s.val}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.08em',textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:'flex',gap:12,marginBottom:18,flexWrap:'wrap',alignItems:'center' }} className="animate-in delay-2">
        <div style={{ position:'relative',flex:1,minWidth:200 }}>
          <Search size={14} color="var(--gray-400)" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }} />
          <input type="text" placeholder="Search client or reference..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:'100%',border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 12px 10px 36px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white' }}
            onFocus={e=>e.target.style.borderColor='var(--navy)'} onBlur={e=>e.target.style.borderColor='var(--gray-200)'} />
        </div>
        <div style={{ position:'relative' }}>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ border:'1px solid var(--gray-200)',borderRadius:9,padding:'10px 32px 10px 12px',fontFamily:'DM Sans,sans-serif',fontSize:13,outline:'none',background:'white',appearance:'none',cursor:'pointer' }}>
            <option value="all">All Types</option>
            <option value="wallet_funding">Wallet Funding</option>
            <option value="subscription">Subscription</option>
            <option value="redemption">Redemption</option>
          </select>
          <span style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--gray-400)',fontSize:11 }}>▾</span>
        </div>
        <button onClick={exportCSV} style={{ display:'flex',alignItems:'center',gap:6,padding:'10px 16px',background:'white',border:'1px solid var(--gray-200)',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:700,color:'#3b82f6',fontFamily:'Syne,sans-serif',letterSpacing:'0.04em' }}>
          <Download size={13}/> Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ background:'white',borderRadius:14,border:'1px solid var(--gray-200)',overflow:'hidden' }} className="animate-in delay-3">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f4f6fa' }}>
                {['Date','ID','Client','Type','Amount','Reference','Status'].map(h=>(
                  <th key={h} style={{ padding:'11px 18px',textAlign:'left',fontSize:10,color:'var(--gray-400)',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ borderTop:'1px solid var(--gray-100)',transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'13px 18px',fontSize:12,color:'var(--gray-600)',whiteSpace:'nowrap' }}>{t.date}</td>
                  <td style={{ padding:'13px 18px',fontSize:12,fontFamily:'monospace',fontWeight:600,color:'var(--navy)',whiteSpace:'nowrap' }}>{t.id}</td>
                  <td style={{ padding:'13px 18px' }}>
                    <div style={{ fontSize:13,fontWeight:600,color:'var(--navy)' }}>{t.client}</div>
                    <div style={{ fontSize:10,color:'var(--gray-400)',textTransform:'uppercase' }}>{t.clientType}</div>
                  </td>
                  <td style={{ padding:'13px 18px' }}><span style={{ fontSize:10,fontWeight:700,color:typeColor[t.type]||'var(--gray-400)',background:`${typeColor[t.type]||'#ccc'}18`,padding:'3px 8px',borderRadius:4,letterSpacing:'0.06em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{typeLabel[t.type]||t.type}</span></td>
                  <td style={{ padding:'13px 18px',fontSize:13,fontWeight:700,color:'var(--navy)',whiteSpace:'nowrap' }}>{fmt(t.amount)}</td>
                  <td style={{ padding:'13px 18px',fontSize:11,fontFamily:'monospace',color:'var(--gray-400)',whiteSpace:'nowrap' }}>{t.ref}</td>
                  <td style={{ padding:'13px 18px' }}><StatusBadge status={t.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'12px 18px',borderTop:'1px solid var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontSize:11,color:'var(--gray-400)' }}>{filtered.length} records</span>
          <span style={{ fontSize:12,fontWeight:700,color:'var(--navy)' }}>Filtered Volume: {fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
