import { create } from 'zustand';

/* ── Demo users ─────────────────────────────────────────────── */
export const DEMO_USERS = [
  { email: 'corp@prodigy.ng',        password: 'Corp@1234',    role: 'corporate',   name: 'Prodigy Holdings Ltd',   clientId: 'CLI-001', entity: 'corporate' },
  { email: 'john.doe@prodigy.ng',    password: 'Ind@1234',     role: 'individual',  name: 'John Doe',               clientId: 'CLI-002', entity: 'individual' },
  { email: 'joint@prodigy.ng',       password: 'Joint@1234',   role: 'joint',       name: 'Awobajo Lanre Daniel',   clientId: 'CLI-003', entity: 'joint',  secondaryName: 'Jane Daniel' },
  { email: 'superadmin@prodigy.ng',  password: 'Admin@1234',   role: 'admin',       name: 'Chukwuemeka Obi',        clientId: 'ADM-001',   adminRole: 'super_admin',  status:'active' },
  { email: 'ops@prodigy.ng',         password: 'Ops@1234',     role: 'admin',       name: 'Funmilayo Adeyemi',      clientId: 'ADM-002',   adminRole: 'operations',   status:'active' },
  { email: 'compliance@prodigy.ng',  password: 'Comply@1234',  role: 'admin',       name: 'Ifeanyi Nwachukwu',      clientId: 'ADM-003',   adminRole: 'compliance',   status:'active' },
  { email: 'finance@prodigy.ng',     password: 'Finance@1234', role: 'admin',       name: 'Ngozi Eze',              clientId: 'ADM-004',   adminRole: 'finance',      status:'active' },
  { email: 'audit@prodigy.ng',       password: 'Audit@1234',   role: 'admin',       name: 'Bello Musa',             clientId: 'ADM-005',   adminRole: 'audit',        status:'active' },
  { email: 'investment@prodigy.ng',  password: 'Invest@1234',  role: 'admin',       name: 'Adaeze Obiechina',       clientId: 'ADM-006',   adminRole: 'investment',   status:'active' },
];

/* ── Admin role permissions ─────────────────────────────────── */
export const ADMIN_PERMISSIONS = {
  super_admin:  ['all'],
  operations:   ['clients','loans','kyc','risk','transactions','book_instrument','approval_hub','pretermination','product_setup','plans','dividends','accruals','eod','client_investments','analytics','reports'],
  compliance:   ['kyc','audit_trail','risk'],
  finance:      ['transactions','finance_queue','reports','analytics','client_investments'],
  audit:        ['audit_trail','reports','transactions'],
  investment:   ['plans','book_instrument','approval_hub','pretermination','product_setup','dividends','accruals','client_investments','analytics','reports'],
};

/* ── Sample investment plans (admin-editable) ───────────────── */
export const DEFAULT_PLANS = [
  { id:'apex',    name:'Prodigy Apex',          roi:'20% ROI',       roiNum:20, color:'#22c55e',  minInvest:50000000,   lockIn:'NONE',      desc:'A tenured note backed by sovereign fixed-income assets.',                        hasTenor:true,  taxRate:10, tenorOptions:['30 Days','60 Days','90 Days','120 Days','150 Days','180 Days','210 Days','240 Days','270 Days','300 Days','330 Days','365 Days'], tag:'' },
  { id:'flex',    name:'Prodigy Flexi-Tenure',  roi:'12-18% ROI',    roiNum:15, color:'#f97316',  minInvest:5000000,    lockIn:'VARIABLE',  desc:'Flexible investment with adjustable tenure options to match liquidity needs.',   hasTenor:true,  taxRate:10, tenorOptions:['30 Days','60 Days','90 Days','120 Days','150 Days','180 Days','210 Days','240 Days','270 Days','300 Days','330 Days','365 Days'], tag:'' },
  { id:'aura',    name:'Prodigy Aura',           roi:'16% ROI',       roiNum:16, color:'#3b82f6',  minInvest:10000000,   lockIn:'180 DAYS',  desc:'Sustainable green energy and impact focused infrastructure fund.',               hasTenor:false, taxRate:10, tenorOptions:[], tag:'' },
  { id:'vantage', name:'Prodigy Vantage',        roi:'FX Linked',     roiNum:0,  color:'#8b5cf6',  minInvest:1000000,    lockIn:'90 DAYS',   desc:'Global diversification & currency hedging FX note.',                             hasTenor:false, taxRate:0,  tenorOptions:[], tag:'FX Linked' },
  { id:'genesis', name:'Prodigy Genesis',        roi:'25-33% ROI',    roiNum:29, color:'#ec4899',  minInvest:100000000,  lockIn:'12 MONTHS', desc:'Asset-backed real estate development focused fund.',                             hasTenor:false, taxRate:15, tenorOptions:[], tag:'' },
  { id:'liquidity',name:'Prodigy Liquidity',     roi:'15% ROI',       roiNum:15, color:'#0d1b35',  minInvest:2000,       lockIn:'NONE',      desc:'Strategic alternative to savings prioritizing immediate liquidity.',             hasTenor:false, taxRate:5,  tenorOptions:[], tag:'' },
  { id:'vcf',     name:'Verified Corp Fund',     roi:'Bespoke ROI',   roiNum:0,  color:'#6366f1',  minInvest:0,          lockIn:'BESPOKE',   desc:'Tailored corporate treasury vehicle.',                                           hasTenor:true,  taxRate:10, tenorOptions:['30 Days','60 Days','90 Days','120 Days','150 Days','180 Days','210 Days','240 Days','270 Days','300 Days','330 Days','365 Days'], tag:'Negotiated', negotiated:true },
];

/* ── Sample clients ─────────────────────────────────────────── */
const SAMPLE_CLIENTS = [
  { id:'CLI-001', clientId:'CLI-001', name:'Prodigy Holdings Ltd',   email:'corp@prodigy.ng',       type:'corporate',   accountType:'corporate',   status:'verified',  kyc:'approved',  balance:25450673, joined:'Jan 15, 2024', phone:'+234 801 234 5678', address:'5 Marina Street, Lagos' },
  { id:'CLI-002', clientId:'CLI-002', name:'John Doe',               email:'john.doe@prodigy.ng',   type:'individual',  accountType:'individual',  status:'verified',  kyc:'approved',  balance:15200000, joined:'Feb 02, 2024', phone:'+234 802 345 6789', address:'12 Adeola Odeku, VI, Lagos' },
  { id:'CLI-003', clientId:'CLI-003', name:'Awobajo Lanre Daniel',   email:'joint@prodigy.ng',      type:'joint',       accountType:'joint',       status:'verified',  kyc:'approved',  balance:8750000,  joined:'Mar 10, 2024', phone:'+234 803 456 7890', secondaryName:'Jane Daniel', address:'18 Akin Adesola, VI, Lagos' },
  { id:'CLI-004', clientId:'CLI-004', name:'Sunshine Ventures Ltd',  email:'sunshine@corp.ng',      type:'corporate',   accountType:'corporate',   status:'pending',   kyc:'pending',   balance:0,        joined:'Apr 20, 2024', phone:'+234 804 567 8901', address:'23 Broad Street, Lagos' },
  { id:'CLI-005', clientId:'CLI-005', name:'Amaka Okonkwo',          email:'amaka@gmail.com',       type:'individual',  accountType:'individual',  status:'pending',   kyc:'pending',   balance:0,        joined:'Apr 22, 2024', phone:'+234 805 678 9012', address:'7 Gbagada Estate, Lagos' },
  { id:'CLI-006', clientId:'CLI-006', name:'Heritage Global Inv.',   email:'heritage@corp.ng',      type:'corporate',   accountType:'corporate',   status:'suspended', kyc:'flagged',   balance:5000000,  joined:'Dec 01, 2023', phone:'+234 806 789 0123', address:'44 Ikorodu Road, Lagos' },
  { id:'CLI-007', clientId:'CLI-007', name:'David Nwosu',            email:'david.n@gmail.com',     type:'individual',  accountType:'individual',  status:'verified',  kyc:'approved',  balance:6500000,  joined:'Mar 05, 2024', phone:'+234 807 890 1234', address:'9 Opebi Road, Ikeja, Lagos' },
  { id:'CLI-008', clientId:'CLI-008', name:'Tunde & Sola Balogun',   email:'tbalogun@gmail.com',    type:'joint',       accountType:'joint',       status:'verified',  kyc:'approved',  balance:18000000, joined:'Jan 28, 2024', phone:'+234 808 901 2345', secondaryName:'Sola Balogun', address:'3 Yetunde Brown, Ikeja' },
];

/* ── Sample approvals ───────────────────────────────────────── */
const SAMPLE_APPROVALS = [
  { id:'APR-001', type:'kyc_approval',   client:'Sunshine Ventures Ltd', clientName:'Sunshine Ventures Ltd', clientId:'CLI-004', details:'Corporate KYC — CAC Certificate + MEMART + Tax ID',      detail:'Corporate KYC — CAC Certificate + MEMART + Tax ID',      date:'Apr 20, 2024', status:'pending',  priority:'high',   bookedBy:'Funmilayo Adeyemi', kycDocs:[{name:'CAC Certificate',status:'uploaded'},{name:'MEMART',status:'uploaded'},{name:'Tax ID',status:'pending'}] },
  { id:'APR-002', type:'kyc_approval',   client:'Amaka Okonkwo',         clientName:'Amaka Okonkwo',         clientId:'CLI-005', details:'Individual KYC — NIN + Passport Photo + Utility Bill',   detail:'Individual KYC — NIN + Passport Photo + Utility Bill',   date:'Apr 22, 2024', status:'pending',  priority:'medium', bookedBy:'Funmilayo Adeyemi', kycDocs:[{name:'NIN',status:'uploaded'},{name:'Passport Photo',status:'uploaded'},{name:'Utility Bill',status:'pending'}] },
  { id:'APR-003', type:'subscription',   client:'John Doe',              clientName:'John Doe',              clientId:'CLI-002', details:'Prodigy Genesis — ₦50,000,000 (12 months)',              detail:'Prodigy Genesis — ₦50,000,000 (12 months)',              date:'Apr 18, 2024', status:'pending',  priority:'high',   bookedBy:'Adaeze Obiechina', amount:50000000 },
  { id:'APR-004', type:'redemption',     client:'Prodigy Holdings Ltd',  clientName:'Prodigy Holdings Ltd',  clientId:'CLI-001', details:'Prodigy Apex — ₦2,000,000 early redemption',            detail:'Prodigy Apex — ₦2,000,000 early redemption',            date:'Apr 17, 2024', status:'pending',  priority:'medium', bookedBy:'Adaeze Obiechina', amount:2000000 },
  { id:'APR-005', type:'loan',           client:'Prodigy Holdings Ltd',  clientName:'Prodigy Holdings Ltd',  clientId:'CLI-001', details:'Corporate Staff Loan — Abiola Johnson — ₦500,000 — 6m', detail:'Corporate Staff Loan — Abiola Johnson — ₦500,000 — 6m', date:'Apr 15, 2024', status:'approved', priority:'low',    bookedBy:'Funmilayo Adeyemi', amount:500000, reviewedBy:'Funmilayo Adeyemi' },
  { id:'APR-006', type:'subscription',   client:'Awobajo Lanre Daniel',  clientName:'Awobajo Lanre Daniel',  clientId:'CLI-003', details:'Prodigy Aura — ₦10,000,000 (180 days)',                  detail:'Prodigy Aura — ₦10,000,000 (180 days)',                  date:'Apr 12, 2024', status:'rejected', priority:'low',    bookedBy:'Adaeze Obiechina', amount:10000000, reviewedBy:'Chukwuemeka Obi', rejectReason:'Insufficient wallet balance' },
  { id:'APR-007', type:'subscription',   client:'David Nwosu',           clientName:'David Nwosu',           clientId:'CLI-007', details:'Individual KYC — Valid ID + NIN + Utility Bill',          detail:'Individual KYC — Valid ID + NIN + Utility Bill',          date:'Mar 05, 2024', status:'approved', priority:'medium', bookedBy:'Ifeanyi Nwachukwu', reviewedBy:'Ifeanyi Nwachukwu' },
];

/* ── Sample transactions (enriched with product) ────────────── */
const SAMPLE_TRANSACTIONS = [
  { id:'TXN-001', client:'Prodigy Holdings Ltd', type:'wallet_funding',  amount:1250000,  date:'Feb 28, 2024', status:'successful', ref:'PSK-ABC123', clientType:'corporate',   product:'N/A',             planId:'' },
  { id:'TXN-002', client:'John Doe',             type:'subscription',    amount:50000000, date:'Feb 20, 2024', status:'successful', ref:'INV-DEF456', clientType:'individual',  product:'Prodigy Genesis', planId:'genesis' },
  { id:'TXN-003', client:'Awobajo Lanre Daniel', type:'wallet_funding',  amount:8750000,  date:'Mar 10, 2024', status:'successful', ref:'PSK-GHI789', clientType:'joint',       product:'N/A',             planId:'' },
  { id:'TXN-004', client:'Prodigy Holdings Ltd', type:'redemption',      amount:2000000,  date:'Apr 17, 2024', status:'pending',    ref:'RED-JKL012', clientType:'corporate',   product:'Prodigy Apex',    planId:'apex' },
  { id:'TXN-005', client:'Amaka Okonkwo',        type:'wallet_funding',  amount:500000,   date:'Apr 22, 2024', status:'failed',     ref:'PSK-MNO345', clientType:'individual',  product:'N/A',             planId:'' },
  { id:'TXN-006', client:'John Doe',             type:'subscription',    amount:12500000, date:'Mar 15, 2024', status:'successful', ref:'INV-PQR678', clientType:'individual',  product:'Prodigy Aura',    planId:'aura' },
  { id:'TXN-007', client:'Heritage Global Inv.', type:'subscription',    amount:75000000, date:'Dec 10, 2023', status:'successful', ref:'INV-STU901', clientType:'corporate',   product:'Verified Corp Fund', planId:'vcf' },
  { id:'TXN-008', client:'David Nwosu',          type:'subscription',    amount:6500000,  date:'Mar 05, 2024', status:'successful', ref:'INV-VWX234', clientType:'individual',  product:'Prodigy Flexi-Tenure', planId:'flex' },
  { id:'TXN-009', client:'Tunde & Sola Balogun', type:'subscription',    amount:18000000, date:'Jan 28, 2024', status:'successful', ref:'INV-YZA567', clientType:'joint',       product:'Prodigy Apex',    planId:'apex' },
  { id:'TXN-010', client:'Prodigy Holdings Ltd', type:'subscription',    amount:10000000, date:'Jan 20, 2024', status:'successful', ref:'INV-BCD890', clientType:'corporate',   product:'Prodigy Liquidity', planId:'liquidity' },
];

/* ── Corporate Staff Loans by entity ───────────────────────── */
export const CORP_LOAN_ENTITIES = [
  {
    id:'CENT-001', company:'Prodigy Holdings Ltd', totalStaff:12, activeLoans:4, totalDisbursed:3250000, status:'active',
    staff:[
      { id:'LOAN-001', employee:'Abiola Johnson',  staffId:'PP-001', dept:'HR',      amount:150000,  tenor:'6 months',  status:'active',    date:'Jan 10, 2024', repaid:75000,   outstanding:75000 },
      { id:'LOAN-002', employee:'Sarah Alabi',     staffId:'PP-002', dept:'Finance', amount:1000000, tenor:'12 months', status:'active',    date:'Feb 14, 2024', repaid:250000,  outstanding:750000 },
      { id:'LOAN-003', employee:'Emeka Okafor',    staffId:'PP-003', dept:'Tech',    amount:500000,  tenor:'6 months',  status:'settled',   date:'Dec 01, 2023', repaid:500000,  outstanding:0 },
      { id:'LOAN-004', employee:'Grace Idowu',     staffId:'PP-004', dept:'Ops',     amount:125000,  tenor:'3 months',  status:'terminated',date:'Nov 15, 2023', repaid:0,       outstanding:125000 },
      { id:'LOAN-005', employee:'Chidi Nwoke',     staffId:'PP-005', dept:'Sales',   amount:200000,  tenor:'6 months',  status:'active',    date:'Mar 01, 2024', repaid:66666,   outstanding:133334 },
    ],
  },
  {
    id:'CENT-002', company:'Sunshine Ventures Ltd', totalStaff:7, activeLoans:2, totalDisbursed:900000, status:'pending',
    staff:[
      { id:'LOAN-006', employee:'Tolu Adekoya',    staffId:'SV-001', dept:'Admin',   amount:300000,  tenor:'6 months',  status:'active',    date:'Mar 15, 2024', repaid:50000,   outstanding:250000 },
      { id:'LOAN-007', employee:'Kemi Balogun',    staffId:'SV-002', dept:'Finance', amount:600000,  tenor:'12 months', status:'active',    date:'Apr 01, 2024', repaid:0,       outstanding:600000 },
    ],
  },
  {
    id:'CENT-003', company:'Heritage Global Inv.', totalStaff:15, activeLoans:1, totalDisbursed:5000000, status:'suspended',
    staff:[
      { id:'LOAN-008', employee:'Musa Ibrahim',    staffId:'HG-001', dept:'Ops',     amount:5000000, tenor:'24 months', status:'active',    date:'Jan 05, 2024', repaid:625000,  outstanding:4375000 },
    ],
  },
];

/* ── Booked instruments ─────────────────────────────────────── */
export const SAMPLE_INSTRUMENTS = [
  { id:'INST-001', type:'Fixed Deposit',    counterparty:'Zenith Bank',        client:'Prodigy Holdings Ltd', principal:25000000, rate:12.5, tenor:'90 Days', valueDate:'Jan 15, 2024', maturityDate:'Apr 14, 2024', status:'matured',  planId:'apex' },
  { id:'INST-002', type:'T-Bill',           counterparty:'CBN/DMO',            client:'Heritage Global Inv.', principal:50000000, rate:18.0, tenor:'182 Days',valueDate:'Dec 01, 2023', maturityDate:'May 31, 2024', status:'active',   planId:'vcf' },
  { id:'INST-003', type:'Eurobond',         counterparty:'FGN/SEC',            client:'John Doe',             principal:10000000, rate:7.875,tenor:'365 Days',valueDate:'Feb 01, 2024', maturityDate:'Feb 01, 2025', status:'active',   planId:'genesis' },
  { id:'INST-004', type:'Commercial Paper', counterparty:'Dangote Industries', client:'Awobajo Lanre Daniel', principal:8000000,  rate:14.5, tenor:'180 Days',valueDate:'Mar 10, 2024', maturityDate:'Sep 06, 2024', status:'active',   planId:'aura' },
  { id:'INST-005', type:'Equity',           counterparty:'NSE',                client:'David Nwosu',          principal:6500000,  rate:0,    tenor:'N/A',     valueDate:'Mar 05, 2024', maturityDate:'N/A',          status:'active',   planId:'flex', stockName:'DANGCEM', costPrice:280, marketPrice:312, units:23214 },
  { id:'INST-006', type:'Mutual Fund',      counterparty:'Stanbic IBTC',       client:'Tunde & Sola Balogun', principal:18000000, rate:16.0, tenor:'180 Days',valueDate:'Jan 28, 2024', maturityDate:'Jul 26, 2024', status:'active',   planId:'apex' },
];

/* ── Pre-termination queue ──────────────────────────────────── */
export const SAMPLE_PRETERMINATIONS = [
  { id:'PT-001', client:'Prodigy Holdings Ltd', clientId:'CLI-001', planId:'apex',    product:'Prodigy Apex',     tenor:'90 Days', amount:2000000,  investDate:'Jan 15, 2024', maturityDate:'Jul 14, 2024', requestDate:'Apr 17, 2024', status:'pending',      penalty:40000,   reason:'Liquidity needs',         approvedBy:'', rejectedBy:'', rejectReason:'' },
  { id:'PT-002', client:'John Doe',             clientId:'CLI-002', planId:'genesis', product:'Prodigy Genesis',  tenor:'12 months',amount:50000000, investDate:'Feb 20, 2024', maturityDate:'Feb 20, 2025', requestDate:'Apr 18, 2024', status:'pending',      penalty:2500000, reason:'Medical emergency',        approvedBy:'', rejectedBy:'', rejectReason:'' },
  { id:'PT-003', client:'Awobajo Lanre Daniel', clientId:'CLI-003', planId:'aura',    product:'Prodigy Aura',     tenor:'180 days',amount:10000000, investDate:'Mar 10, 2024', maturityDate:'Sep 05, 2024', requestDate:'Apr 15, 2024', status:'approved_ops', penalty:200000,  reason:'Business capital needed', approvedBy:'Adaeze Obiechina', rejectedBy:'', rejectReason:'' },
  { id:'PT-004', client:'David Nwosu',          clientId:'CLI-007', planId:'flex',    product:'Prodigy Flexi-Tenure', tenor:'180 days',amount:6500000, investDate:'Mar 05, 2024', maturityDate:'Sep 01, 2024', requestDate:'Apr 10, 2024', status:'rejected',     penalty:130000,  reason:'Early exit request',      approvedBy:'', rejectedBy:'Chukwuemeka Obi', rejectReason:'Insufficient documentation' },
];

/* ── Finance queue ───────────────────────────────────────────── */
export const SAMPLE_FINANCE_QUEUE = [
  { id:'FQ-001', client:'Awobajo Lanre Daniel', clientId:'CLI-003', product:'Prodigy Aura',    type:'Pre-Termination', amount:10000000, penalty:200000, reason:'Business capital needed', requestDate:'Apr 15, 2024', requestedBy:'Adaeze Obiechina (Ops)', status:'pending',  approvedBy:'', rejectedBy:'', rejectReason:'' },
  { id:'FQ-002', client:'Heritage Global Inv.', clientId:'CLI-006', product:'Verified Corp Fund', type:'Maturity Redemption', amount:75000000, penalty:0, reason:'Investment matured', requestDate:'Apr 14, 2024', requestedBy:'System (EOD)', status:'approved', approvedBy:'Ngozi Eze', rejectedBy:'', rejectReason:'' },
];

/* ── Client investments (bookings per client) ───────────────── */
export const SAMPLE_CLIENT_INVESTMENTS = [
  { id:'CINV-001', clientId:'CLI-001', client:'Prodigy Holdings Ltd', planId:'apex',      plan:'Prodigy Apex',          amount:25000000,  tenor:'90 Days',  valueDate:'Jan 15, 2024', maturityDate:'Apr 14, 2024', roi:20, tax:10, status:'matured',  history:[{date:'Jan 15, 2024',action:'Booked'},{date:'Apr 14, 2024',action:'Matured'}] },
  { id:'CINV-002', clientId:'CLI-001', client:'Prodigy Holdings Ltd', planId:'liquidity', plan:'Prodigy Liquidity',     amount:10000000,  tenor:'NONE',     valueDate:'Jan 20, 2024', maturityDate:'N/A',          roi:15, tax:5,  status:'active',   history:[{date:'Jan 20, 2024',action:'Booked'}] },
  { id:'CINV-003', clientId:'CLI-002', client:'John Doe',             planId:'genesis',   plan:'Prodigy Genesis',       amount:50000000,  tenor:'12 months',valueDate:'Feb 20, 2024', maturityDate:'Feb 20, 2025', roi:29, tax:15, status:'active',   history:[{date:'Feb 20, 2024',action:'Booked'}] },
  { id:'CINV-004', clientId:'CLI-002', client:'John Doe',             planId:'aura',      plan:'Prodigy Aura',          amount:12500000,  tenor:'180 days', valueDate:'Mar 15, 2024', maturityDate:'Sep 11, 2024', roi:16, tax:10, status:'active',   history:[{date:'Mar 15, 2024',action:'Booked'}] },
  { id:'CINV-005', clientId:'CLI-003', client:'Awobajo Lanre Daniel', planId:'aura',      plan:'Prodigy Aura',          amount:10000000,  tenor:'180 days', valueDate:'Mar 10, 2024', maturityDate:'Sep 05, 2024', roi:16, tax:10, status:'pre_term', history:[{date:'Mar 10, 2024',action:'Booked'},{date:'Apr 15, 2024',action:'Pre-termination Requested'}] },
  { id:'CINV-006', clientId:'CLI-007', client:'David Nwosu',          planId:'flex',      plan:'Prodigy Flexi-Tenure',  amount:6500000,   tenor:'180 days', valueDate:'Mar 05, 2024', maturityDate:'Sep 01, 2024', roi:15, tax:10, status:'active',   history:[{date:'Mar 05, 2024',action:'Booked'}] },
  { id:'CINV-007', clientId:'CLI-008', client:'Tunde & Sola Balogun', planId:'apex',      plan:'Prodigy Apex',          amount:18000000,  tenor:'180 days', valueDate:'Jan 28, 2024', maturityDate:'Jul 26, 2024', roi:20, tax:10, status:'active',   history:[{date:'Jan 28, 2024',action:'Booked'}] },
  { id:'CINV-008', clientId:'CLI-006', client:'Heritage Global Inv.', planId:'vcf',       plan:'Verified Corp Fund',    amount:75000000,  tenor:'365 days', valueDate:'Dec 10, 2023', maturityDate:'Dec 09, 2024', roi:0,  tax:10, status:'active',   history:[{date:'Dec 10, 2023',action:'Booked'}] },
];

/* ── KYC documents ──────────────────────────────────────────── */
export const KYC_REQUIREMENTS = {
  corporate: [
    { key:'cac_cert',        label:'CAC Certificate',                         required:true },
    { key:'memart',          label:'MEMART & Status of Directors',            required:true },
    { key:'utility_bill',    label:'Utility Bill (Business)',                 required:true },
    { key:'scuml_tax',       label:'SCUML & Tax ID',                         required:true },
    { key:'directors_id',    label:"Directors' Valid ID",                    required:true },
    { key:'sig_mandate',     label:'Signature Mandate',                      required:true },
    { key:'nin',             label:'NIN (Directors)',                         required:true },
    { key:'personal_utility',label:'Personal Utility Bill (Directors)',       required:true },
  ],
  individual: [
    { key:'valid_id',        label:"Client's Valid ID",                      required:true },
    { key:'nin',             label:'NIN',                                     required:true },
    { key:'passport_photo',  label:'Passport Photo',                         required:true },
    { key:'sig_sample',      label:'Signature Sample',                       required:true },
    { key:'utility_bill',    label:'Utility Bill',                           required:true },
  ],
  joint: [
    { key:'valid_id_p1',     label:"Primary Holder's Valid ID",              required:true },
    { key:'nin_p1',          label:'Primary Holder NIN',                     required:true },
    { key:'passport_p1',     label:'Primary Holder Passport Photo',          required:true },
    { key:'sig_p1',          label:'Primary Holder Signature',               required:true },
    { key:'utility_p1',      label:'Primary Holder Utility Bill',            required:true },
    { key:'valid_id_p2',     label:"Secondary Holder's Valid ID",            required:true },
    { key:'nin_p2',          label:'Secondary Holder NIN',                   required:true },
    { key:'passport_p2',     label:'Secondary Holder Passport Photo',        required:true },
    { key:'sig_p2',          label:'Secondary Holder Signature',             required:true },
    { key:'utility_p2',      label:'Secondary Holder Utility Bill',          required:true },
  ],
};

/* ── Full audit log with full names ─────────────────────────── */
export const SAMPLE_AUDIT_LOG = [
  { id:'AUD-001', adminId:'ADM-001', admin:'Chukwuemeka Obi',    role:'super_admin',  action:'Approved KYC',           target:'Prodigy Holdings Ltd',      time:'Apr 22, 2024 09:14', category:'kyc',        ip:'192.168.1.10' },
  { id:'AUD-002', adminId:'ADM-003', admin:'Ifeanyi Nwachukwu',  role:'compliance',   action:'Flagged AML Alert',      target:'Heritage Global Inv.',      time:'Apr 21, 2024 15:32', category:'compliance', ip:'192.168.1.12' },
  { id:'AUD-003', adminId:'ADM-004', admin:'Ngozi Eze',          role:'finance',      action:'Processed Redemption',   target:'₦2,000,000 — Corp Fund',    time:'Apr 20, 2024 11:00', category:'finance',    ip:'192.168.1.13' },
  { id:'AUD-004', adminId:'ADM-006', admin:'Adaeze Obiechina',   role:'investment',   action:'Updated Plan ROI',       target:'Prodigy Apex → 20%',        time:'Apr 19, 2024 14:22', category:'investment', ip:'192.168.1.15' },
  { id:'AUD-005', adminId:'ADM-002', admin:'Funmilayo Adeyemi',  role:'operations',   action:'Approved Subscription',  target:'John Doe — Genesis',        time:'Apr 18, 2024 10:45', category:'operations', ip:'192.168.1.11' },
  { id:'AUD-006', adminId:'ADM-005', admin:'Bello Musa',         role:'audit',        action:'Generated Report',       target:'Q1 2024 Portfolio',         time:'Apr 15, 2024 16:00', category:'audit',      ip:'192.168.1.14' },
  { id:'AUD-007', adminId:'ADM-001', admin:'Chukwuemeka Obi',    role:'super_admin',  action:'Created Admin Account',  target:'investment@prodigy.ng',     time:'Apr 10, 2024 09:00', category:'system',     ip:'192.168.1.10' },
  { id:'AUD-008', adminId:'ADM-003', admin:'Ifeanyi Nwachukwu',  role:'compliance',   action:'Reviewed KYC Document',  target:'Sunshine Ventures CAC',     time:'Apr 08, 2024 12:30', category:'kyc',        ip:'192.168.1.12' },
  { id:'AUD-009', adminId:'ADM-006', admin:'Adaeze Obiechina',   role:'investment',   action:'Booked Instrument',      target:'FD — Zenith Bank — ₦25M',   time:'Apr 05, 2024 08:55', category:'investment', ip:'192.168.1.15' },
  { id:'AUD-010', adminId:'ADM-002', admin:'Funmilayo Adeyemi',  role:'operations',   action:'Approved Pre-termination',target:'Awobajo Lanre Daniel — ₦10M',time:'Apr 15, 2024 14:10',category:'operations', ip:'192.168.1.11' },
  { id:'AUD-011', adminId:'ADM-004', admin:'Ngozi Eze',          role:'finance',      action:'Disbursed Pre-termination',target:'David Nwosu — ₦6.37M',    time:'Apr 12, 2024 11:30', category:'finance',    ip:'192.168.1.13' },
  { id:'AUD-012', adminId:'ADM-001', admin:'Chukwuemeka Obi',    role:'super_admin',  action:'Locked User Account',    target:'heritage@corp.ng',          time:'Dec 02, 2023 10:00', category:'system',     ip:'192.168.1.10' },
];

/* ── Dividend declarations ───────────────────────────────────── */
export const SAMPLE_DIVIDENDS = [
  { id:'DIV-001', equity:'DANGCEM', divPerShare:3.50, qualifyingDate:'Mar 31, 2024', paymentDate:'Apr 15, 2024', totalPayout:81249, status:'paid',    bookedBy:'Adaeze Obiechina' },
  { id:'DIV-002', equity:'GTCO',    divPerShare:1.50, qualifyingDate:'Apr 30, 2024', paymentDate:'May 15, 2024', totalPayout:0,     status:'pending', bookedBy:'Adaeze Obiechina' },
];

/* ── Wallet data ─────────────────────────────────────────────── */
const INITIAL_WALLET = {
  balance: 1250000, pending: 0,
  transactions: [
    { id:'WAL-FT-9910', date:'Feb 28, 2024', amount:1250000, description:'Wallet Funding via Paystack', status:'Successful', ref:'PSK-9910' },
    { id:'WAL-FT-8821', date:'Feb 14, 2024', amount:500000,  description:'Wallet Funding via Paystack', status:'Successful', ref:'PSK-8821' },
    { id:'WAL-FT-7743', date:'Jan 30, 2024', amount:2000000, description:'Wallet Funding via Paystack', status:'Pending',    ref:'PSK-7743' },
  ],
};

/* ── Store ──────────────────────────────────────────────────── */
const useAppStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  sidebarOpen: false,

  // Wallet
  walletBalance: INITIAL_WALLET.balance,
  pendingBalance: INITIAL_WALLET.pending,
  transactions: INITIAL_WALLET.transactions,

  // Investment plans (admin-editable)
  plans: DEFAULT_PLANS,

  // Admin data
  clients: SAMPLE_CLIENTS,
  approvals: SAMPLE_APPROVALS,
  allTransactions: SAMPLE_TRANSACTIONS,

  // New modules
  instruments: SAMPLE_INSTRUMENTS,
  corpLoanEntities: CORP_LOAN_ENTITIES,
  preTermQueue: SAMPLE_PRETERMINATIONS,
  financeQueue: SAMPLE_FINANCE_QUEUE,
  clientInvestments: SAMPLE_CLIENT_INVESTMENTS,
  auditLog: SAMPLE_AUDIT_LOG,
  dividends: SAMPLE_DIVIDENDS,
  adminUsers: DEMO_USERS.filter(u => u.role === 'admin'),

  // Auth
  login: (userData) => set({ user: userData, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Wallet
  addTransaction: (txn) => set((s) => ({
    walletBalance: s.walletBalance + txn.amount,
    transactions: [txn, ...s.transactions],
  })),

  // Admin: update a plan
  updatePlan: (id, patch) => set((s) => ({
    plans: s.plans.map(p => p.id === id ? { ...p, ...patch } : p),
  })),

  // Admin: add a new plan
  addPlan: (plan) => set((s) => ({ plans: [...s.plans, plan] })),

  // Admin: update approval (accepts patch object or status string)
  updateApproval: (id, patchOrStatus) => set((s) => ({
    approvals: s.approvals.map(a => a.id === id ? { ...a, ...(typeof patchOrStatus === 'string' ? { status: patchOrStatus } : patchOrStatus) } : a),
  })),

  // Admin: update client status
  updateClient: (id, patch) => set((s) => ({
    clients: s.clients.map(c => c.id === id ? { ...c, ...patch } : c),
  })),

  // Admin: add instrument
  addInstrument: (inst) => set((s) => ({ instruments: [inst, ...s.instruments] })),

  // Admin: add audit log entry
  addAuditEntry: (entry) => set((s) => ({ auditLog: [entry, ...s.auditLog] })),

  // Admin: add dividend declaration
  addDividend: (div) => set((s) => ({ dividends: [div, ...s.dividends] })),
  declareDividend: (div) => set((s) => ({ dividends: [div, ...s.dividends] })),

  // Admin: book investment instrument
  bookInvestment: (inv) => set((s) => ({ clientInvestments: [inv, ...s.clientInvestments] })),

  // Admin: pre-termination actions
  approvePreTerm: (id, approvedBy) => set((s) => ({
    preTermQueue: s.preTermQueue.map(p => p.id === id ? { ...p, status:'approved_ops', approvedBy } : p),
    financeQueue: [
      ...s.financeQueue,
      (() => { const p = s.preTermQueue.find(x=>x.id===id); return p ? { id:'FQ-'+Date.now(), client:p.client, clientId:p.clientId, product:p.product, type:'Pre-Termination', amount:p.amount, penalty:p.penalty, reason:p.reason, requestDate:p.requestDate, requestedBy:`${approvedBy} (Ops)`, status:'pending', approvedBy:'', rejectedBy:'', rejectReason:'' } : null; })()
    ].filter(Boolean),
  })),
  rejectPreTerm: (id, rejectedBy, rejectReason) => set((s) => ({
    preTermQueue: s.preTermQueue.map(p => p.id === id ? { ...p, status:'rejected', rejectedBy, rejectReason } : p),
  })),

  // Admin: finance queue actions
  approveFinanceItem: (id, approvedBy) => set((s) => ({
    financeQueue: s.financeQueue.map(f => f.id === id ? { ...f, status:'approved', approvedBy } : f),
  })),
  rejectFinanceItem: (id, rejectedBy, rejectReason) => set((s) => ({
    financeQueue: s.financeQueue.map(f => f.id === id ? { ...f, status:'rejected', rejectedBy, rejectReason } : f),
  })),

  // Admin: user management
  addAdminUser: (u) => set((s) => ({ adminUsers: [...s.adminUsers, u] })),
  updateAdminUser: (email, patch) => set((s) => ({
    adminUsers: s.adminUsers.map(u => u.email === email ? { ...u, ...patch } : u),
  })),
}));

export default useAppStore;

export const ROLE_LABELS = {
  super_admin: 'Super Admin', operations: 'Head of Operations',
  compliance: 'Compliance Officer', finance: 'Finance Manager',
  audit: 'Audit Officer', investment: 'Investment Manager',
};

export const ROLE_COLORS = {
  super_admin:'#ef4444', operations:'#3b82f6', compliance:'#8b5cf6',
  finance:'#22c55e', audit:'#f97316', investment:'#e8b84b',
};
