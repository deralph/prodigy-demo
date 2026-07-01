import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Ban, CheckCircle, Save, Users, Wallet, TrendingUp, FileText, User, Phone, MapPin, Shield, AlertTriangle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { adminClientApi, kycApi } from '../../services/api';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/shared/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';
import ModalOverlay from '../../components/ui/ModalOverlay';
import TabBar from '../../components/ui/TabBar';
import DataTable from '../../components/ui/DataTable';
import DetailRow from '../../components/ui/DetailRow';
import AlertBanner from '../../components/ui/AlertBanner';
import ClientInfoPanel from '../../components/ui/ClientInfoPanel';
import KycDocViewer from '../../components/ui/KycDocViewer';
import SearchFilterBar from '../../components/ui/SearchFilterBar';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

const TYPE_COLORS = { corporate: '#3b82f6', individual: '#22c55e', joint: '#8b5cf6' };

/* ── Client table columns ── */
const buildColumns = (onView, onEdit, onToggleSuspend) => [
  {
    key: 'name', label: 'Client',
    render: (v, row) => (
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{v}</div>
        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{row.id}</div>
      </div>
    ),
  },
  {
    key: 'type', label: 'Type',
    render: v => <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLORS[v], background: `${TYPE_COLORS[v]}15`, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{v}</span>,
  },
  { key: 'email',   label: 'Email',   style: { fontSize: 12, color: 'var(--gray-600)' } },
  { key: 'kyc',     label: 'KYC',     render: v => <StatusBadge status={v} /> },
  { key: 'balance', label: 'Balance', render: v => <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{fmt(v)}</span> },
  { key: 'status',  label: 'Status',  render: v => <StatusBadge status={v} /> },
  {
    key: 'id', label: 'Actions',
    render: (_, row) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={e => { e.stopPropagation(); onView(row); }} style={{ background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', display: 'flex' }}>
          <Eye size={13} color="#3b82f6" />
        </button>
        <button onClick={e => { e.stopPropagation(); onEdit(row); }} style={{ background: 'rgba(232,184,75,0.1)', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', display: 'flex' }}>
          <Edit size={13} color="var(--gold)" />
        </button>
        <button onClick={e => { e.stopPropagation(); onToggleSuspend(row); }} style={{ background: row.status === 'suspended' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '6px', cursor: 'pointer', display: 'flex' }}>
          {row.status === 'suspended' ? <CheckCircle size={13} color="var(--green)" /> : <Ban size={13} color="var(--red)" />}
        </button>
      </div>
    ),
  },
];

/* ── Wallet tab content ── */
function WalletTab({ client, allTransactions, clients }) {
  const txns = allTransactions.filter(t => {
    const cl = clients.find(c => c.clientId === client.clientId);
    return cl && t.client === cl.name;
  });
  const COLS = [
    { key: 'id',     label: 'Ref',    style: { fontSize: 12, fontWeight: 600, color: 'var(--navy)' } },
    { key: 'type',   label: 'Type',   render: v => v?.replace(/_/g, ' ') },
    { key: 'amount', label: 'Amount', render: v => fmt(v) },
    { key: 'date',   label: 'Date',   style: { fontSize: 11, color: 'var(--gray-400)' } },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {[['Wallet Balance', fmt(client.balance), 'rgba(34,197,94,0.06)', 'rgba(34,197,94,0.2)'], ['Total Transactions', txns.length, 'rgba(59,130,246,0.06)', 'rgba(59,130,246,0.2)']].map(([l, v, bg, border]) => (
          <div key={l} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--navy)' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ border: '1px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden' }}>
        <DataTable columns={COLS} rows={txns} emptyMsg="No transactions found for this client." />
      </div>
    </div>
  );
}

/* ── Investments tab content ── */
function InvestmentsTab({ client, clientInvestments }) {
  const invs = clientInvestments.filter(i => i.clientId === client.clientId);
  return (
    <div>
      {invs.length === 0
        ? <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-400)', fontSize: 13 }}>No investments found for this client.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {invs.map(inv => (
              <div key={inv.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: '16px', background: '#fafbfd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{inv.plan}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{inv.id}</div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[['Principal', fmt(inv.amount)], ['ROI', `${inv.roi}%`], ['Tenor', inv.tenor], ['Value Date', inv.valueDate], ['Maturity', inv.maturityDate], ['Tax', `${inv.tax}%`]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 9, color: 'var(--gray-400)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

/* ── Edit form ── */
function EditClientModal({ client, onClose, onSave }) {
  const [form,    setForm]    = useState({ name: client.name, email: client.email, phone: client.phone || '', address: client.address || '', status: client.status, kyc: client.kyc });
  const [saved,   setSaved]   = useState('');
  const upd = patch => setForm(f => ({ ...f, ...patch }));

  const handleSave = () => {
    onSave(form);
    setSaved('Client updated successfully');
    setTimeout(() => { setSaved(''); onClose(); }, 1500);
  };

  const inputStyle = { width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '10px 12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none' };

  return (
    <ModalOverlay onClose={onClose} maxWidth={480} headerContent={
      <div>
        <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'white' }}>Edit Client</h3>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{client.id} · {client.type}</p>
      </div>
    }>
      {saved && <AlertBanner message={saved} type="success" />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { key: 'name',    label: 'Client Name', icon: User },
          { key: 'email',   label: 'Email' },
          { key: 'phone',   label: 'Phone',   icon: Phone },
          { key: 'address', label: 'Address', icon: MapPin },
        ].map(f => (
          <div key={f.key}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>{f.label}</div>
            <input value={form[f.key] || ''} onChange={e => upd({ [f.key]: e.target.value })} style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--navy)'} onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { key: 'status', label: 'Account Status', opts: [['verified', 'Verified'], ['pending', 'Pending'], ['suspended', 'Suspended']] },
            { key: 'kyc',    label: 'KYC Status',     opts: [['approved', 'Approved'], ['pending', 'Pending'], ['flagged', 'Flagged']] },
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>{f.label}</div>
              <select value={form[f.key] || ''} onChange={e => upd({ [f.key]: e.target.value })} style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}>
                {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button onClick={handleSave} style={{ background: 'var(--navy)', color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, border: 'none', borderRadius: 8, padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Save size={14} /> SAVE CHANGES
        </button>
      </div>
    </ModalOverlay>
  );
}

/* ── Mandate Change Modal (compliance / super_admin only) ── */
function MandateChangeModal({ client, onClose, onSave }) {
  const [mandateType, setMandateType] = useState(client.mandateType || 'AND');
  const [confirmed,   setConfirmed]   = useState(false);
  const [saving,       setSaving]      = useState(false);
  const [error,        setError]       = useState('');

  const changed = mandateType !== (client.mandateType || 'AND');

  const handleSave = async () => {
    if (!changed || !confirmed) return;
    setSaving(true);
    setError('');
    try {
      await adminClientApi.updateMandate(client.clientId, mandateType);
      onSave(mandateType);
      onClose();
    } catch (e) {
      setError(e?.message || 'Could not update mandate. Please try again.');
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={440} headerContent={
      <div>
        <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'white' }}>Change Mandate Type</h3>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{client.id} · Joint Account · Compliance Action</p>
      </div>
    }>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
        <AlertTriangle size={14} color="#f97316" style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--navy)', lineHeight: 1.6 }}>
          This directly changes whether one holder or both holders must authorize withdrawals from this account. Only change this on explicit, verified instruction from all account holders.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {['AND', 'OR'].map(m => (
          <button
            key={m}
            onClick={() => setMandateType(m)}
            style={{
              padding: '16px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              border: `2px solid ${mandateType === m ? 'var(--navy)' : 'var(--gray-200)'}`,
              background: mandateType === m ? 'rgba(13,27,53,0.04)' : 'white',
            }}
          >
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: 'var(--navy)', marginBottom: 4 }}>{m}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)', lineHeight: 1.5 }}>
              {m === 'AND' ? 'All holders must co-sign every withdrawal.' : 'Any one holder may authorize independently.'}
            </div>
          </button>
        ))}
      </div>

      {changed && (
        <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 11, color: 'var(--navy)', marginBottom: 16, cursor: 'pointer', lineHeight: 1.5 }}>
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 2 }} />
          I confirm all account holders have verifiably requested this change to <strong>{mandateType}</strong>.
        </label>
      )}

      {error && <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', padding: '10px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>}

      <button
        onClick={handleSave}
        disabled={!changed || !confirmed || saving}
        style={{
          width: '100%', padding: '13px', borderRadius: 9, border: 'none', cursor: (!changed || !confirmed || saving) ? 'not-allowed' : 'pointer',
          background: (!changed || !confirmed) ? 'var(--gray-100)' : 'var(--navy)', color: (!changed || !confirmed) ? 'var(--gray-400)' : 'white',
          fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}
      >
        <Shield size={13} /> {saving ? 'UPDATING…' : 'CONFIRM MANDATE CHANGE'}
      </button>
      <p style={{ fontSize: 9, color: 'var(--gray-400)', textAlign: 'center', marginTop: 10 }}>This action is logged to the audit trail.</p>
    </ModalOverlay>
  );
}

/* ── Main Page ── */
const DETAIL_TABS = [
  { key: 'info',        label: 'Account Info',          icon: User },
  { key: 'wallet',      label: 'Wallet & Transactions', icon: Wallet },
  { key: 'investments', label: 'Investments',           icon: TrendingUp },
  { key: 'kyc',         label: 'KYC Documents',         icon: FileText },
];

export default function ClientManagement() {
  const { clients, updateClient, setClientMandateLocal, allTransactions, clientInvestments, user } = useAppStore();
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected,     setSelected]     = useState(null);
  const [detailTab,    setDetailTab]    = useState('info');
  const [editModal,    setEditModal]    = useState(null);
  const [mandateModal, setMandateModal] = useState(false);
  const [kycDocs,      setKycDocs]      = useState(null);
  const [kycLoading,   setKycLoading]   = useState(false);
  const [actingDoc,    setActingDoc]    = useState(null);
  const [msg,          setMsg]          = useState('');

  // Mirrors the backend's AdminRoles('SUPER_ADMIN', 'COMPLIANCE') gate on
  // the mandate-update endpoint — changing AND/OR governs whether one or
  // both holders must authorize withdrawals, so this stays compliance-only.
  const canManageMandate = ['super_admin', 'compliance'].includes(user?.adminRole);

  const filtered = clients.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'all' || c.type === typeFilter;
    const mst = statusFilter === 'all' || c.status === statusFilter;
    return ms && mt && mst;
  });

  useEffect(() => {
    if (detailTab === 'kyc' && selected?.id) {
      setKycLoading(true);
      kycApi.getClientKyc(selected.id)
        .then(data => setKycDocs(data))
        .catch(() => setKycDocs(null))
        .finally(() => setKycLoading(false));
    }
  }, [detailTab, selected?.id]);

  const openDetail = c => { setSelected(c); setDetailTab('info'); setKycDocs(null); };
  const handleSaveEdit = (form) => {
    updateClient(editModal.id, form);
    adminClientApi.updateStatus(editModal.clientId, form.status === 'verified' ? 'ACTIVE' : form.status === 'suspended' ? 'SUSPENDED' : 'PENDING_KYC').catch(() => {});
  };

  const handleApproveKyc = async () => {
    try {
      setMsg('');
      await kycApi.approveKyc(selected.id);
      updateClient(selected.id, { kyc: 'approved', status: 'verified' });
      setMsg('Account activated successfully');
      setTimeout(() => { setSelected(null); setMsg(''); }, 1200);
    } catch (e) {
      setMsg(e?.message || 'Approval failed');
    }
  };

  const handleFlagSuspend = async () => {
    try {
      setMsg('');
      await kycApi.rejectKyc(selected.id, 'Account flagged by admin');
      updateClient(selected.id, { kyc: 'flagged', status: 'suspended' });
      setSelected({ ...selected, kyc: 'flagged', status: 'suspended' });
      setMsg('Account flagged and suspended');
    } catch (e) {
      setMsg(e?.message || 'Action failed');
    }
  };

  const handleMandateSaved = (mandateType) => {
    setClientMandateLocal(selected.id, mandateType);
    setSelected(s => ({ ...s, mandateType }));
    setMsg(`Mandate updated to ${mandateType}`);
  };

  const refreshKyc = async () => {
    if (!selected?.id) return;
    setKycLoading(true);
    try {
      const data = await kycApi.getClientKyc(selected.id);
      setKycDocs(data);
    } catch {
      setKycDocs(null);
    } finally {
      setKycLoading(false);
    }
  };

  const handleApproveDoc = async (clientId, docKey) => {
    setActingDoc({ clientId, docKey });
    try {
      await kycApi.approveDocument(clientId, docKey);
      await refreshKyc();
    } catch (e) {
      setMsg(e?.message || 'Failed to approve document');
    } finally {
      setActingDoc(null);
    }
  };

  const handleRejectDoc = async (clientId, docKey, reason) => {
    if (!reason.trim()) return;
    setActingDoc({ clientId, docKey });
    try {
      await kycApi.rejectDocument(clientId, docKey, reason);
      await refreshKyc();
    } catch (e) {
      setMsg(e?.message || 'Failed to reject document');
    } finally {
      setActingDoc(null);
    }
  };

  const columns = buildColumns(
    openDetail,
    c => setEditModal(c),
    c => updateClient(c.id, { status: c.status === 'suspended' ? 'verified' : 'suspended' }),
  );

  return (
    <div>
      <PageHeader title="Client Management" subtitle="All registered clients across account types" />

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search clients..."
        filters={[
          { label: 'Type',   value: typeFilter,   set: setTypeFilter,   options: [{ value: 'all', label: 'All Types' }, { value: 'corporate', label: 'Corporate' }, { value: 'individual', label: 'Individual' }, { value: 'joint', label: 'Joint' }] },
          { label: 'Status', value: statusFilter, set: setStatusFilter, options: [{ value: 'all', label: 'All Statuses' }, { value: 'verified', label: 'Verified' }, { value: 'pending', label: 'Pending' }, { value: 'suspended', label: 'Suspended' }] },
        ]}
        style={{ marginBottom: 20 }}
        className="animate-in delay-1"
      />

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-200)', overflow: 'hidden' }} className="animate-in delay-2">
        <DataTable
          columns={columns}
          rows={filtered}
          onRow={openDetail}
          emptyMsg={clients.length === 0 ? 'No clients yet.' : 'No matching clients. Adjust your filters.'}
        />
      </div>

      {/* Detail Modal */}
      {selected && (
        <ModalOverlay onClose={() => setSelected(null)} maxWidth={720} scrollable
          headerContent={
            <div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'white' }}>{selected.name}</h3>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{selected.id} · {selected.type} · {selected.status}</p>
            </div>
          }
        >
          <TabBar tabs={DETAIL_TABS} active={detailTab} onChange={setDetailTab} />
          <div style={{ paddingTop: 20 }}>
            {msg && <div style={{ marginBottom: 16 }}><AlertBanner message={msg} type={msg.includes('successfully') || msg.includes('activated') ? 'success' : 'error'} /></div>}
            {detailTab === 'info' && (
              <ClientInfoPanel
                client={selected}
                onApproveKyc={handleApproveKyc}
                onFlagSuspend={handleFlagSuspend}
                onChangeMandate={canManageMandate && selected.type === 'joint' ? () => setMandateModal(true) : undefined}
              />
            )}
            {detailTab === 'wallet' && <WalletTab client={selected} allTransactions={allTransactions} clients={clients} />}
            {detailTab === 'investments' && <InvestmentsTab client={selected} clientInvestments={clientInvestments} />}
            {detailTab === 'kyc' && (
              <KycDocViewer
                docs={kycDocs?.documents || []}
                kycStatus={kycDocs?.kycRecord?.status || selected.kyc}
                submittedAt={kycDocs?.kycRecord?.submittedAt}
                loading={kycLoading}
                isAdmin
                clientId={selected.id}
                onApproveDoc={handleApproveDoc}
                onRejectDoc={handleRejectDoc}
                actingDoc={actingDoc}
              />
            )}
          </div>
        </ModalOverlay>
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditClientModal
          client={editModal}
          onClose={() => setEditModal(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Mandate Change Modal (compliance / super_admin only) */}
      {mandateModal && selected && (
        <MandateChangeModal
          client={selected}
          onClose={() => setMandateModal(false)}
          onSave={handleMandateSaved}
        />
      )}
    </div>
  );
}
