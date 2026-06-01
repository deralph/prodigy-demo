import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import PageHeader from './components/ui/PageHeader';
import SignatoryGroup from './components/ui/SignatoryGroup';
import AuditPortalCard from './components/ui/AuditPortalCard';
import CertificateGrid from './components/ui/CertificateGrid';

const GROUP_A = [{ name:'Chukwuma Adeyemi', signed:true }, { name:'Amina Yusuf', signed:false }];
const GROUP_B = [{ name:'Oluwaseun Fatunase', signed:true }];
const CERTS   = [
  { name:'Prodigy Aura',             date:'Oct 13, 2024' },
  { name:'Prodigy Flex-Tenure Note', date:'Oct 13, 2024' },
  { name:'Prodigy Bonds',            date:'Oct 13, 2024' },
  { name:'Prodigy Liquidity Fund',   date:'Oct 13, 2024' },
  { name:'Verified Corp Fund',       date:'Oct 13, 2024' },
];

export default function Audit() {
  const [auditEmail, setAuditEmail] = useState('nofatunase@ijaware.net');
  const [linkSent,   setLinkSent]   = useState(false);

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
              <p style={{ fontSize:11, color:'var(--gray-400)' }}>Any two from Group A or One A · One B</p>
            </div>
            <Lock size={16} color="var(--red)" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <SignatoryGroup title="Group A Signatories" members={GROUP_A} />
            <SignatoryGroup title="Group B Signatories" members={GROUP_B} />
          </div>
        </div>

        <AuditPortalCard email={auditEmail} onEmailChange={setAuditEmail} onGenerate={() => setLinkSent(true)} sent={linkSent} />
      </div>

      <CertificateGrid certificates={CERTS} />

      <style>{`@media(max-width:768px){div[style*="1fr 280px"]{grid-template-columns:1fr!important;}div[style*="1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
