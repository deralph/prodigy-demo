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

  const mandate     = user?.secondaryName ? (user?.mandateType || 'AND') : 'SINGLE';
  const primaryName   = user?.name;
  const secondaryName = user?.secondaryName;

  const groupA = primaryName ? [{ name: primaryName, role: user?.email || '', signed: true }] : [];
  const groupB = secondaryName ? [{ name: secondaryName, role: user?.secondaryEmail || '', signed: false }] : [];

  const mandateLabel =
    mandate === 'SINGLE' ? 'Single authorised signatory' :
    mandate === 'OR'     ? 'Either holder may authorise (OR mandate)' :
                           'Both holders must authorise (AND mandate)';

  const certs = clientInvestments.map(inv => ({
    name:   inv.plan || inv.investRef || inv.id,
    ref:    inv.investRef || '—',
    status: inv.status,
    date: inv.maturityDate && inv.maturityDate !== '—'
      ? inv.maturityDate
      : inv.valueDate && inv.valueDate !== '—'
        ? inv.valueDate
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
              <p style={{ fontSize:11, color:'var(--gray-400)' }}>{mandateLabel}</p>
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

      <CertificateGrid certificates={certs} onDownload={cert => {
        const lines = [
          'PRODIGY FINANCE LIMITED',
          'CORPORATE INVESTMENT CERTIFICATE',
          '='.repeat(50),
          `Product  : ${cert.name}`,
          `Ref      : ${cert.ref}`,
          `Status   : ${cert.status?.toUpperCase()}`,
          `Date     : ${cert.date}`,
          `Entity   : ${user?.name || 'Corporate Client'}`,
          '='.repeat(50),
          'Prodigy Finance Limited',
        ].join('\n');
        const blob = new Blob([lines], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement('a'), { href: url, download: `Certificate_${cert.ref || cert.name}.txt` });
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      }} />

      <style>{`@media(max-width:768px){div[style*="1fr 280px"]{grid-template-columns:1fr!important;}div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
