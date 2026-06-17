import React, { useState } from 'react';
import { walletApi } from '../../services/api';

export default function WithdrawModal({ onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [acctNo, setAcctNo] = useState('');
  const [acctName, setAcctName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const n = Number(amount.replace(/,/g, ''));
    if (!n || n <= 0) return setError('Enter a valid amount');
    if (!bankName || !acctNo || !acctName) return setError('Enter bank details');
    setLoading(true);
    try {
      const res = await walletApi.requestWithdrawal({ amountKobo: Math.round(n * 100), bankName, bankAcctNo: acctNo, bankAcctName: acctName });
      onDone({ success: true, amount: n, ref: res.txnRef || res.ref });
      onClose();
    } catch (err) {
      setError(err?.body?.message || err.message || 'Request failed');
      onDone({ success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-card">
        <h3>Request Withdrawal</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Amount (NGN)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="form-row">
            <label>Bank Name</label>
            <input value={bankName} onChange={e => setBankName(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Account Number</label>
            <input value={acctNo} onChange={e => setAcctNo(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Account Name</label>
            <input value={acctName} onChange={e => setAcctName(e.target.value)} />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn-muted" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={loading}>{loading ? 'Requesting...' : 'Request Withdrawal'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
