import React, { useState } from 'react';
import { TrendingUp, X, ArrowUpRight } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { investmentApi } from '../../services/api';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import ProductCard from '../../components/ui/ProductCard';
import ModalOverlay from '../../components/ui/ModalOverlay';
import DetailRow from '../../components/ui/DetailRow';
import AlertBanner from '../../components/ui/AlertBanner';

const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');

export default function Products() {
  const { plans, user, walletBalance, refreshWallet } = useAppStore();
  const [selected, setSelected]   = useState(null);
  const [subModal, setSubModal]   = useState(null);
  const [subForm, setSubForm]     = useState({ amount: '', tenor: '' });
  const [subSuccess, setSubSuccess] = useState(false);
  const [subError, setSubError]   = useState('');
  const [subLoading, setSubLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleSubscribe = async () => {
    if (!subModal || !subForm.amount) return;
    const amount = parseFloat(subForm.amount);
    if (!isAdmin && amount > walletBalance) {
      setSubError(`Insufficient balance. Available: ${fmt(walletBalance)}. Please fund your wallet first.`);
      return;
    }
    setSubError('');
    setSubLoading(true);
    try {
      await investmentApi.subscribe({ productId: subModal.id, amount, tenor: subForm.tenor || undefined });
      await refreshWallet();
      setSubSuccess(true);
      setTimeout(() => { setSubSuccess(false); setSubModal(null); setSubForm({ amount: '', tenor: '' }); }, 2500);
    } catch (err) {
      setSubError(err.message || 'Subscription failed. Please try again.');
    } finally {
      setSubLoading(false);
    }
  };

  const closeSubModal = () => { setSubModal(null); setSubSuccess(false); setSubError(''); };

  return (
    <div>
      <PageHeader
        title="Investment Products"
        subtitle="Explore available investment opportunities"
      />

      {plans.length === 0 && (
        <EmptyState icon={TrendingUp} title="No investment products yet" message="Investment products will appear here once they are set up by the Prodigy Finance team." />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }} className="animate-in delay-1">
        {plans.map((plan, idx) => (
          <div key={plan.id} className={`animate-in delay-${Math.min(idx + 1, 4)}`}>
            <ProductCard
              plan={plan}
              variant="client"
              onClick={setSelected}
              onInvest={setSubModal}
            />
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && !subModal && (
        <ModalOverlay
          onClose={() => setSelected(null)}
          maxWidth={520}
          headerContent={
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18, color: 'white' }}>{selected.name}</div>
              {selected.tag && (
                <span style={{ fontSize: 9, fontWeight: 700, color: selected.color, background: `${selected.color}15`, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4, display: 'inline-block' }}>
                  {selected.tag}
                </span>
              )}
            </div>
          }
          headerColor={selected.color}
        >
          <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 20 }}>{selected.desc}</p>
          {[
            ['ROI', selected.roi],
            ['Minimum Investment', selected.minInvest > 0 ? fmt(selected.minInvest) : 'Negotiable'],
            ['Lock-in Period', selected.lockIn],
            ['Type', selected.isNegotiated ? 'Negotiable Terms' : 'Fixed Terms'],
            ['Status', selected.status === 'ACTIVE' ? 'Open for Investment' : 'Closed'],
          ].map(([l, v]) => <DetailRow key={l} label={l} value={v} />)}
          <button
            onClick={() => { setSelected(null); setSubModal(selected); }}
            style={{ width: '100%', marginTop: 20, background: selected.color, color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, border: 'none', borderRadius: 8, padding: '14px', cursor: 'pointer', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <ArrowUpRight size={14} /> INVEST IN THIS PRODUCT
          </button>
        </ModalOverlay>
      )}

      {/* Subscribe Modal */}
      {subModal && (
        <ModalOverlay
          onClose={closeSubModal}
          maxWidth={440}
          headerContent={
            <div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: 'white' }}>Subscribe to {subModal.name}</h3>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', marginTop: 2 }}>{subModal.roi}</p>
            </div>
          }
          headerColor={subModal.color}
        >
          {subSuccess ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <TrendingUp size={22} color="var(--green)" />
              </div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'var(--navy)', marginBottom: 6 }}>Subscription Submitted!</div>
              <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Your investment request is pending approval.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(13,27,53,0.03)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--gray-200)' }}>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Wallet Balance</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', fontFamily: 'Syne,sans-serif' }}>{fmt(walletBalance)}</span>
                </div>
              )}

              {subError && <AlertBanner message={subError} type="error" />}

              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Investment Amount (₦)</div>
                <input
                  type="number"
                  placeholder={subModal.minInvest > 0 ? `Min: ${fmt(subModal.minInvest)}` : 'Enter amount'}
                  value={subForm.amount}
                  onChange={e => setSubForm(f => ({ ...f, amount: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '12px', fontFamily: 'DM Sans,sans-serif', fontSize: 14, outline: 'none', fontWeight: 600 }}
                  onFocus={e => e.target.style.borderColor = subModal.color}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              {subModal.hasTenor && subModal.tenorOptions?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Select Tenor</div>
                  <select value={subForm.tenor} onChange={e => setSubForm(f => ({ ...f, tenor: e.target.value }))} style={{ width: '100%', border: '1.5px solid var(--gray-200)', borderRadius: 9, padding: '12px', fontFamily: 'DM Sans,sans-serif', fontSize: 13, outline: 'none', background: 'white' }}>
                    <option value="">Choose tenor...</option>
                    {subModal.tenorOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              {subForm.amount && (
                <div style={{ background: 'rgba(13,27,53,0.03)', borderRadius: 10, padding: '14px', border: '1px solid var(--gray-200)' }}>
                  <DetailRow label="Amount" value={fmt(parseFloat(subForm.amount))} noBorder={!subModal.roiNum} />
                  {subModal.roiNum > 0 && (
                    <DetailRow label="Est. Annual Return" value={fmt(Math.round(parseFloat(subForm.amount) * subModal.roiNum / 100))} noBorder valueStyle={{ color: 'var(--green)' }} />
                  )}
                </div>
              )}

              <button
                onClick={handleSubscribe}
                disabled={subLoading || !subForm.amount || (subModal.minInvest > 0 && parseFloat(subForm.amount) < subModal.minInvest) || (!isAdmin && parseFloat(subForm.amount) > walletBalance)}
                style={{
                  background: subModal.color, color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12,
                  border: 'none', borderRadius: 8, padding: '14px', cursor: subLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  opacity: (subLoading || !subForm.amount || (subModal.minInvest > 0 && parseFloat(subForm.amount) < subModal.minInvest) || (!isAdmin && parseFloat(subForm.amount) > walletBalance)) ? 0.5 : 1,
                }}
              >
                <ArrowUpRight size={14} /> {subLoading ? 'PROCESSING…' : 'SUBSCRIBE'}
              </button>
            </div>
          )}
        </ModalOverlay>
      )}
    </div>
  );
}
