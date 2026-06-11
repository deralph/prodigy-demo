import React, { useState, useMemo } from 'react';
import { ArrowRight, AlertTriangle, CheckCircle, XCircle, Clock, Inbox } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import ModalOverlay from '../../components/ui/ModalOverlay';
import DetailRow from '../../components/ui/DetailRow';
import SearchFilterBar from '../../components/ui/SearchFilterBar';
import AlertBanner from '../../components/ui/AlertBanner';
import TypeBadge from '../../components/ui/TypeBadge';

const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

/* ── Flow step pill ── */
function FlowStep({ icon: Icon, label, color, isLast }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 8 }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.04em' }}>{label}</span>
      </div>
      {!isLast && <ArrowRight size={14} color="var(--gray-300)" />}
    </>
  );
}

/* ── Item row ── */
function PreTermItem({ item, canApprove, onReview }) {
  const statusCfg = {
    pending:      { color: 'var(--gold)',  bg: 'rgba(232,184,75,0.12)', label: 'Pending Review' },
    approved_ops: { color: 'var(--green)', bg: 'rgba(34,197,94,0.1)',   label: 'Sent to Finance' },
    rejected:     { color: 'var(--red)',   bg: 'rgba(239,68,68,0.1)',   label: 'Rejected' },
  };
  const st = statusCfg[item.status] || statusCfg.pending;

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AlertTriangle size={18} color={st.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{item.client}</span>
            <TypeBadge label={st.label} color={st.color} bg={st.bg} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 2 }}>{item.product || '—'} · {item.tenor || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4 }}>
            Request date: {item.requestDate || '—'} · Maturity: {item.maturityDate || '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--navy)' }}>
            Reason: <span style={{ color: 'var(--gray-600)', fontWeight: 400 }}>{item.reason}</span>
          </div>
          {item.approvedBy && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>Approved by: {item.approvedBy}</div>}
          {item.rejectedBy  && <div style={{ fontSize: 11, color: 'var(--red)',   marginTop: 4 }}>Rejected by: {item.rejectedBy} — {item.rejectReason}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 2 }}>{fmt(item.amount)}</div>
          <div style={{ fontSize: 11, color: 'var(--red)' }}>Penalty: {fmt(item.penalty)}</div>
          <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, marginBottom: 8 }}>Net: {fmt(item.amount - item.penalty)}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {item.status === 'pending' && canApprove && (
              <button onClick={() => onReview(item)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 11 }}>
                Review <ArrowRight size={12} />
              </button>
            )}
            {item.status === 'approved_ops' && (
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, padding: '5px 10px', background: 'rgba(34,197,94,0.08)', borderRadius: 6, border: '1px solid rgba(34,197,94,0.2)' }}>✓ Sent to Finance Queue</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Review modal ── */
function ReviewModal({ item, onApprove, onReject, onClose }) {
  const [rejectNote, setRejectNote] = useState('');
  return (
    <ModalOverlay onClose={onClose} maxWidth={500} headerContent={
      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: 'white', textTransform: 'uppercase' }}>Review Pre-Termination</div>
    }>
      {[
        ['Client', item.client], ['Product', item.product], ['Tenor', item.tenor],
        ['Principal', fmt(item.amount)], ['Penalty', fmt(item.penalty)],
        ['Net Payout', fmt(item.amount - item.penalty)],
        ['Reason', item.reason], ['Request Date', item.requestDate],
      ].map(([l, v]) => <DetailRow key={l} label={l} value={v} />)}
      <div style={{ marginTop: 14, background: 'rgba(239,68,68,0.05)', borderRadius: 8, padding: '12px', border: '1px solid rgba(239,68,68,0.12)', marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Early Exit Penalty Applied</div>
        <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Client forfeits {fmt(item.penalty)} for early exit before maturity</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Rejection Note (if rejecting)</div>
        <input placeholder="Reason for rejection…" value={rejectNote} onChange={e => setRejectNote(e.target.value)}
          style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 8, padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => onReject(item, rejectNote)} style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <XCircle size={14} /> REJECT
        </button>
        <button onClick={() => onApprove(item)} style={{ flex: 1, padding: '12px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <CheckCircle size={14} /> APPROVE → FINANCE
        </button>
      </div>
    </ModalOverlay>
  );
}

/* ── Main Page ── */
export default function PreTermination() {
  const { preTermQueue, approvePreTerm, rejectPreTerm, user, addAuditEntry } = useAppStore();
  const [reviewing,    setReviewing]    = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProduct,setFilterProduct]= useState('');
  const [search,       setSearch]       = useState('');

  const isOps = ['super_admin', 'operations'].includes(user?.adminRole);

  const log = (action, target) => addAuditEntry({
    id: 'AUD-' + Date.now(), adminId: user?.clientId, admin: user?.name, role: user?.adminRole,
    action, target, category: 'operations',
    time: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), ip: '—',
  });

  const handleApprove = (item) => { approvePreTerm(item.id, user?.name); log('Approved Pre-Termination', `${item.client} — ${fmt(item.amount)}`); setReviewing(null); };
  const handleReject  = (item, note) => { rejectPreTerm(item.id, user?.name, note); log('Rejected Pre-Termination', `${item.client} — ${note}`); setReviewing(null); };

  const allProducts = [...new Set(preTermQueue.map(i => i.product))];
  const filtered    = useMemo(() => preTermQueue.filter(item => {
    return (filterStatus === 'all' || item.status === filterStatus) &&
           (!filterProduct || item.product === filterProduct) &&
           (!search || (item.client || '').toLowerCase().includes(search.toLowerCase()) || (item.product || '').toLowerCase().includes(search.toLowerCase()));
  }), [preTermQueue, filterStatus, filterProduct, search]);

  const pending  = preTermQueue.filter(i => i.status === 'pending');
  const approved = preTermQueue.filter(i => i.status === 'approved_ops');
  const rejected = preTermQueue.filter(i => i.status === 'rejected');

  return (
    <div>
      <PageHeader title="Pre-Termination Queue" subtitle="Review early exit requests — approve routes to Finance Queue" />

      {/* Approval flow diagram */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, flexWrap: 'wrap' }} className="animate-in delay-1">
        <FlowStep icon={Clock}        label="Client Request"    color="#64748b"       isLast={false} />
        <FlowStep icon={CheckCircle}  label="Operations Review" color="var(--navy)"   isLast={false} />
        <FlowStep icon={ArrowRight}   label="Finance Disburse"  color="var(--green)"  isLast />
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }} className="animate-in delay-2">
        {[
          { label: 'Pending Review', val: pending.length,  color: 'var(--gold)',  total: fmt(pending.reduce((s, i) => s + i.amount, 0)) },
          { label: 'Sent to Finance',val: approved.length, color: 'var(--green)', total: fmt(approved.reduce((s, i) => s + i.amount, 0)) },
          { label: 'Rejected',       val: rejected.length, color: 'var(--red)',   total: fmt(rejected.reduce((s, i) => s + i.amount, 0)) },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)' }}>{s.total}</div>
          </div>
        ))}
      </div>

      {!isOps && <AlertBanner message="View-only — Operations role required to approve/reject pre-termination requests" type="warning" />}

      {/* Filter bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }} className="animate-in delay-3">
        <SearchFilterBar search={search} onSearch={setSearch} placeholder="Search client or product…"
          filters={[
            { value: filterStatus,  set: setFilterStatus,  options: [{ value: 'all', label: 'All Statuses' }, { value: 'pending', label: 'Pending Review' }, { value: 'approved_ops', label: 'Sent to Finance' }, { value: 'rejected', label: 'Rejected' }] },
            { value: filterProduct, set: setFilterProduct, options: [{ value: '', label: 'All Products' }, ...allProducts.map(p => ({ value: p, label: p }))] },
          ]}
        />
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-in delay-3">
        {filtered.length === 0
          ? <EmptyState icon={Inbox} title={preTermQueue.length === 0 ? 'No pre-termination requests' : 'No matching requests'} message={preTermQueue.length === 0 ? 'Pre-termination requests will appear here when clients request early exit.' : 'Try adjusting your filters.'} compact />
          : filtered.map(item => <PreTermItem key={item.id} item={item} canApprove={isOps} onReview={setReviewing} />)
        }
      </div>

      {reviewing && <ReviewModal item={reviewing} onApprove={handleApprove} onReject={handleReject} onClose={() => setReviewing(null)} />}
    </div>
  );
}
