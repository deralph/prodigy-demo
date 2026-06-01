import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import PageHeader from '../../components/ui/PageHeader';
import SignatoryGroup from '../../components/ui/SignatoryGroup';
import AuditPortalCard from '../../components/ui/AuditPortalCard';
import CertificateGrid from '../../components/ui/CertificateGrid';

export default function CorporateAudit() {
  const { user, clientInvestments } = useAppStore();
  const [auditEmail, setAuditEmail] = useState(user?.email || '');
  const [linkSent,   setLinkSent]   = useState(false);

  const mandate     = user?.mandateType || 'AND';
  const primaryName = user?.name;
  const secondaryName = user?.secondaryName;

  const groupA = primaryName ? [{ name: primaryName, signed: true }] : [];
  const groupB = secondaryName ? [{ name: secondaryName, signed: false }] : [];

  const certs = clientInvestments.map(inv => ({
    name: inv.plan?.name || inv.planName || inv.id,
    date: inv.maturityDate
      ? new Date(inv.maturityDate).toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric' })
      : inv.createdAt
        ? new Date(inv.createdAt).toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric' })
        : '—',
  }));

  return (
    <div>
      <PageHeader title="Security & Mandate Verification" subtitle="Bespoke Asset Management System V2.0" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:24, marginBottom:24 }}>
        <div className="card animate-in delay-1">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color:'var(--navy)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>
                Signatory Mandate Control
              </h3>
              <p style={{ fontSize:11, color:'var(--gray-400)' }}>
                {mandate === 'OR' ? 'Either holder may authorise' : 'Both holders must authorise'}
              </p>
            </div>
            <Lock size={16} color="var(--red)" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <SignatoryGroup title="Primary Holder"   members={groupA} emptyLabel="No primary holder" />
            <SignatoryGroup title="Secondary Holder" members={groupB} emptyLabel="No secondary holder" />
          </div>
        </div>

        <AuditPortalCard email={auditEmail} onEmailChange={setAuditEmail} onGenerate={() => setLinkSent(true)} sent={linkSent} />
      </div>

      <CertificateGrid certificates={certs} />

      <style>{`@media(max-width:768px){div[style*="1fr 280px"]{grid-template-columns:1fr!important;}div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
