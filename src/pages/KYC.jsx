import React from 'react';
import PageHeader from './components/ui/PageHeader';
import SignatoryRegistry from './components/ui/SignatoryRegistry';
import KycStatusPanel from './components/ui/KycStatusPanel';

const DIRECTORS = [
  { name:'Chukwuma Adeyemi',   role:'Managing Director (Signatory A)', expiry:'2027-10-12', avatar:'CA' },
  { name:'Oluwaseun Fatunase', role:'Finance Director (Signatory B)',   expiry:'2026-05-15', avatar:'OF' },
  { name:'Ibrahim Bello',      role:'Non-Exec Director',               expiry:'2030-01-01', avatar:'IB' },
];
const KYC_DOCS = [
  { key:'cacCert',     label:'CAC',     status:'VERIFIED' },
  { key:'taxId',       label:'Tax ID',  status:'VERIFIED' },
  { key:'scuml',       label:'SCUML',   status:'VERIFIED' },
  { key:'utilityBill', label:'Utility', status:'VERIFIED' },
];

export default function KYC() {
  return (
    <div>
      <PageHeader title="Corporate KYC Registry" subtitle="Bespoke Asset Management System V2.0" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:24, alignItems:'start' }}>
        <SignatoryRegistry directors={DIRECTORS} />
        <KycStatusPanel docs={KYC_DOCS} getStatus={key => KYC_DOCS.find(d => d.key === key)?.status || 'NOT_UPLOADED'} />
      </div>

      <style>{`@media(max-width:768px){div[style*="grid-template-columns: 1fr 280px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
