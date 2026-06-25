import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminTransactionApi } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Toast from '../../components/ui/Toast';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
const STATUS_STYLE = {
  PENDING:    { color: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'Pending' },
  SUCCESSFUL: { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)', label: 'Disbursed' },
  FAILED:     { color: 'var(--red)', bg: 'rgba(239,68,68,0.1)', label: 'Failed' },
  REVERSED:   { color: 'var(--gray-400)', bg: 'rgba(0,0,0,0.06)', label: 'Rejected' },
};

function RejectModal({ txn, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    await onConfirm(txn.id, reason);
    setLoading(false);
  };
  return (
    <div style={{ position:'fixed',inset:0,zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div style={{ background:'white',borderRadius:16,maxWidth:440,width:'90%',padding:'28px 26px',boxShadow:'0 24px 48px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--navy)',marginBottom:6 }}>Reject Withdrawal</div>
        <p style={{ fontSize:12,color:'var(--gray-400)',marginBottom:16,lineHeight:1.6 }}>
          This will reject <strong>{fmt(Number(txn.amountKobo)/100)}</strong> withdrawal for <strong>{txn.client?.name || txn.client?.clientRef || txn.clientId}</strong> and return the funds to their wallet immediately.
        </p>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10,color:'var(--gray-400)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6 }}>Reason (optional)</div>
          <textarea
            value={reason} onChange={e=>setReason(e.target.value)}
            placeholder="e.g. Suspicious bank details, client request..."
            style={{ width:'100%',border:'1.5px solid var(--gray-200)',borderRadius:10,padding:'10px 14px',fontFamily:'inherit',fontSize:13,resize:'vertical',minHeight:80,boxSizing:'border-box' }}
          />
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:'12px',border:'1.5px solid var(--gray-200)',borderRadius:8,background:'white',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12 }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ flex:1,padding:'12px',border:'none',borderRadius:8,background:'var(--red)',color:'white',cursor:loading?'not-allowed':'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,opacity:loading?0.7:1 }}>
            {loading ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WithdrawalsQueue() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [rejectTxn, setRejectTxn] = useState(null);
  const [acting,   setActing]   = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminTransactionApi.getPendingWithdrawals();
      setItems(Array.isArray(data) ? data : (data?.data || []));
    } catch { setItems([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setActing(a => ({ ...a, [id]: 'approving' }));
    try {
      const result = await adminTransactionApi.approveWithdrawal(id);
      if (result.status === 'SUCCESSFUL') {
        setToast({ type: 'success', title: 'Disbursed', message: `${fmt(Number(result.amountKobo)/100)} has been sent via Paystack.` });
      } else {
        setToast({ type: 'error', title: 'Disbursement Failed', message: result.failureReason || 'Transfer failed. Funds returned to client wallet.' });
      }
      await load();
    } catch (e) {
      setToast({ type: 'error', title: 'Error', message: e?.message || 'Could not process approval.' });
    }
    setActing(a => ({ ...a, [id]: null }));
  };

  const handleReject = async (id, reason) => {
    setActing(a => ({ ...a, [id]: 'rejecting' }));
    try {
      await adminTransactionApi.rejectWithdrawal(id, reason);
      setToast({ type: 'success', title: 'Rejected', message: 'Funds returned to client wallet.' });
      setRejectTxn(null);
      await load();
    } catch (e) {
      setToast({ type: 'error', title: 'Error', message: e?.message || 'Could not reject.' });
    }
    setActing(a => ({ ...a, [id]: null }));
  };

  const pending = items.filter(t => t.status === 'PENDING');
  const processed = items.filter(t => t.status !== 'PENDING');

  return (
    <div>
      <PageHeader
        title="Withdrawals Queue"
        subtitle="Pending wallet withdrawal requests — approve to disburse via Paystack"
        action={{ label: 'Refresh', onClick: load, icon: RefreshCw }}
      />

      {/* Pending */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
          <Clock size={14} color="#f97316"/>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase' }}>
            Pending ({pending.length})
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign:'center',padding:40,color:'var(--gray-400)',fontSize:13 }}>Loading…</div>
        ) : pending.length === 0 ? (
          <div style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'32px',textAlign:'center',color:'var(--gray-400)',fontSize:13 }}>
            No pending withdrawals — all clear.
          </div>
        ) : pending.map(txn => {
          const amtNaira = Number(txn.amountKobo || 0) / 100;
          const isActing = acting[txn.id];
          return (
            <div key={txn.id} style={{ background:'white',borderRadius:12,border:'1px solid var(--gray-200)',padding:'18px 22px',marginBottom:12,display:'flex',alignItems:'center',flexWrap:'wrap',gap:12 }}>
              <div style={{ width:40,height:40,borderRadius:10,background:'rgba(249,115,22,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                <ArrowUpRight size={18} color="#f97316"/>
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'var(--navy)',marginBottom:3 }}>{fmt(amtNaira)}</div>
                <div style={{ fontSize:11,color:'var(--gray-400)' }}>
                  {txn.bankName} · {txn.bankAcctNo} · {txn.bankAcctName}
                </div>
                <div style={{ fontSize:10,color:'var(--gray-400)',marginTop:2 }}>
                  {txn.txnRef} · {txn.client?.name || txn.client?.clientRef || txn.clientId} · {txn.createdAt ? new Date(txn.createdAt).toLocaleString() : ''}
                </div>
              </div>
              <div style={{ display:'flex',gap:8,flexShrink:0 }}>
                <button
                  onClick={() => handleApprove(txn.id)}
                  disabled={!!isActing}
                  style={{ display:'flex',alignItems:'center',gap:5,padding:'9px 16px',background: isActing==='approving' ? 'var(--gray-100)' : 'rgba(34,197,94,0.1)',border:'none',borderRadius:8,cursor:isActing?'not-allowed':'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color: isActing==='approving' ? 'var(--gray-400)' : 'var(--green)' }}
                >
                  <CheckCircle size={13}/> {isActing==='approving' ? 'Disbursing…' : 'Approve & Disburse'}
                </button>
                <button
                  onClick={() => setRejectTxn(txn)}
                  disabled={!!isActing}
                  style={{ display:'flex',alignItems:'center',gap:5,padding:'9px 16px',background:'rgba(239,68,68,0.08)',border:'none',borderRadius:8,cursor:isActing?'not-allowed':'pointer',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11,color:'var(--red)' }}
                >
                  <XCircle size={13}/> Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent processed */}
      {processed.length > 0 && (
        <div>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:14 }}>
            Recently Processed ({processed.length})
          </h3>
          {processed.slice(0, 20).map(txn => {
            const st = STATUS_STYLE[txn.status] || STATUS_STYLE.PENDING;
            const amtNaira = Number(txn.amountKobo || 0) / 100;
            return (
              <div key={txn.id} style={{ background:'white',borderRadius:10,border:'1px solid var(--gray-200)',padding:'14px 18px',marginBottom:8,display:'flex',alignItems:'center',flexWrap:'wrap',gap:10,opacity:0.85 }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--navy)',marginBottom:2 }}>{fmt(amtNaira)}</div>
                  <div style={{ fontSize:11,color:'var(--gray-400)' }}>{txn.bankName} · {txn.bankAcctName} · {txn.txnRef}</div>
                  {txn.failureReason && <div style={{ fontSize:11,color:'var(--red)',marginTop:2,display:'flex',alignItems:'center',gap:4 }}><AlertTriangle size={11}/> {txn.failureReason}</div>}
                  {txn.paystackTransferCode && <div style={{ fontSize:10,color:'var(--green)',marginTop:2 }}>Transfer: {txn.paystackTransferCode}</div>}
                </div>
                <span style={{ fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:5,background:st.bg,color:st.color }}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {rejectTxn && <RejectModal txn={rejectTxn} onClose={() => setRejectTxn(null)} onConfirm={handleReject} />}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
