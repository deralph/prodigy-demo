import { create } from 'zustand';

/* ── Demo users ─────────────────────────────────────────────── */
export const DEMO_USERS = [
  // Corporate
  { email: 'corp@prodigy.ng',        password: 'Corp@1234',    role: 'corporate',   name: 'Prodigy Holdings Ltd',   clientId: 'CORP-2764', entity: 'corporate' },
  // Individual
  { email: 'john.doe@prodigy.ng',    password: 'Ind@1234',     role: 'individual',  name: 'John Doe',               clientId: 'IND-2764',  entity: 'individual' },
  // Joint
  { email: 'joint@prodigy.ng',       password: 'Joint@1234',   role: 'joint',       name: 'Awobajo Lanre Daniel',   clientId: 'JNT-2764',  entity: 'joint',  secondaryName: 'Jane Daniel' },
  // Admins
  { email: 'superadmin@prodigy.ng',  password: 'Admin@1234',   role: 'admin',       name: 'Super Administrator',    clientId: 'ADM-001',   adminRole: 'super_admin' },
  { email: 'ops@prodigy.ng',         password: 'Ops@1234',     role: 'admin',       name: 'Head of Operations',     clientId: 'ADM-002',   adminRole: 'operations' },
  { email: 'compliance@prodigy.ng',  password: 'Comply@1234',  role: 'admin',       name: 'Compliance Officer',     clientId: 'ADM-003',   adminRole: 'compliance' },
  { email: 'finance@prodigy.ng',     password: 'Finance@1234', role: 'admin',       name: 'Finance Manager',        clientId: 'ADM-004',   adminRole: 'finance' },
  { email: 'audit@prodigy.ng',       password: 'Audit@1234',   role: 'admin',       name: 'Audit Officer',          clientId: 'ADM-005',   adminRole: 'audit' },
  { email: 'investment@prodigy.ng',  password: 'Invest@1234',  role: 'admin',       name: 'Investment Manager',     clientId: 'ADM-006',   adminRole: 'investment' },
];

/* ── Admin role permissions ─────────────────────────────────── */
export const ADMIN_PERMISSIONS = {
  super_admin:  ['all'],
  operations:   ['clients','approvals','loans','kyc','transactions'],
  compliance:   ['kyc','audit_trail','risk'],
  finance:      ['transactions','wallet','redemptions'],
  audit:        ['audit_trail','reports','transactions_readonly'],
  investment:   ['plans','subscriptions','portfolios'],
};

/* ── Sample investment plans (editable by admin) ────────────── */
export const DEFAULT_PLANS = [
  { id:'apex',    name:'Prodigy Apex',          roi:'20% ROI',       roiNum:20, color:'#22c55e',  minInvest:50000000,   lockIn:'NONE',      desc:'A tenured note backed by sovereign fixed-income assets.',                        hasTenor:true,  tenorOptions:['30 Days','60 Days','90 Days','120 Days','150 Days','180 Days','210 Days','240 Days','270 Days','300 Days','330 Days','365 Days'], tag:'' },
  { id:'flex',    name:'Prodigy Flexi-Tenure',  roi:'12-18% ROI',    roiNum:15, color:'#f97316',  minInvest:5000000,    lockIn:'VARIABLE',  desc:'Flexible investment with adjustable tenure options to match liquidity needs.',   hasTenor:true,  tenorOptions:['30 Days','60 Days','90 Days','120 Days','150 Days','180 Days','210 Days','240 Days','270 Days','300 Days','330 Days','365 Days'], tag:'' },
  { id:'aura',    name:'Prodigy Aura',           roi:'16% ROI',       roiNum:16, color:'#3b82f6',  minInvest:10000000,   lockIn:'180 DAYS',  desc:'Sustainable green energy and impact focused infrastructure fund.',               hasTenor:false, tenorOptions:[], tag:'' },
  { id:'vantage', name:'Prodigy Vantage',        roi:'FX Linked',     roiNum:0,  color:'#8b5cf6',  minInvest:1000000,    lockIn:'90 DAYS',   desc:'Global diversification & currency hedging FX note.',                             hasTenor:false, tenorOptions:[], tag:'FX Linked' },
  { id:'genesis', name:'Prodigy Genesis',        roi:'25-33% ROI',    roiNum:29, color:'#ec4899',  minInvest:100000000,  lockIn:'12 MONTHS', desc:'Asset-backed real estate development focused fund.',                             hasTenor:false, tenorOptions:[], tag:'' },
  { id:'liquidity',name:'Prodigy Liquidity',     roi:'15% ROI',       roiNum:15, color:'#0d1b35',  minInvest:2000,       lockIn:'NONE',      desc:'Strategic alternative to savings prioritizing immediate liquidity.',             hasTenor:false, tenorOptions:[], tag:'' },
  { id:'vcf',     name:'Verified Corp Fund',     roi:'Bespoke ROI',   roiNum:0,  color:'#6366f1',  minInvest:0,          lockIn:'BESPOKE',   desc:'Tailored corporate treasury vehicle.',                                           hasTenor:true,  tenorOptions:['30 Days','60 Days','90 Days','120 Days','150 Days','180 Days','210 Days','240 Days','270 Days','300 Days','330 Days','365 Days'], tag:'Negotiated', negotiated:true },
];

/* ── Sample clients for admin ───────────────────────────────── */
const SAMPLE_CLIENTS = [
  { id:'CLI-001', name:'Prodigy Holdings Ltd',   email:'corp@prodigy.ng',       type:'corporate',   status:'verified',  kyc:'approved',  balance:25450673, joined:'Jan 15, 2024' },
  { id:'CLI-002', name:'John Doe',               email:'john.doe@prodigy.ng',   type:'individual',  status:'verified',  kyc:'approved',  balance:15200000, joined:'Feb 02, 2024' },
  { id:'CLI-003', name:'Awobajo Lanre Daniel',   email:'joint@prodigy.ng',      type:'joint',       status:'verified',  kyc:'approved',  balance:8750000,  joined:'Mar 10, 2024' },
  { id:'CLI-004', name:'Sunshine Ventures Ltd',  email:'sunshine@corp.ng',      type:'corporate',   status:'pending',   kyc:'pending',   balance:0,        joined:'Apr 20, 2024' },
  { id:'CLI-005', name:'Amaka Okonkwo',          email:'amaka@gmail.com',       type:'individual',  status:'pending',   kyc:'pending',   balance:0,        joined:'Apr 22, 2024' },
  { id:'CLI-006', name:'Heritage Global Inv.',   email:'heritage@corp.ng',      type:'corporate',   status:'suspended', kyc:'flagged',   balance:5000000,  joined:'Dec 01, 2023' },
];

const SAMPLE_APPROVALS = [
  { id:'APR-001', type:'kyc',          client:'Sunshine Ventures Ltd', clientId:'CLI-004', detail:'Corporate KYC — Certificate of Incorporation + Tax Clearance',  date:'Apr 20, 2024', status:'pending', priority:'high' },
  { id:'APR-002', type:'kyc',          client:'Amaka Okonkwo',         clientId:'CLI-005', detail:'Individual KYC — BVN + Utility Bill',                           date:'Apr 22, 2024', status:'pending', priority:'medium' },
  { id:'APR-003', type:'subscription', client:'John Doe',              clientId:'CLI-002', detail:'Prodigy Genesis — ₦50,000,000 (12 months)',                     date:'Apr 18, 2024', status:'pending', priority:'high' },
  { id:'APR-004', type:'redemption',   client:'Prodigy Holdings Ltd',  clientId:'CLI-001', detail:'Prodigy Apex — ₦2,000,000 pre-termination',                    date:'Apr 17, 2024', status:'pending', priority:'medium' },
  { id:'APR-005', type:'loan',         client:'Prodigy Holdings Ltd',  clientId:'CLI-001', detail:'Staff Loan — Abiola Johnson — ₦500,000 — 6 months',            date:'Apr 15, 2024', status:'approved', priority:'low' },
  { id:'APR-006', type:'subscription', client:'Awobajo Lanre Daniel',  clientId:'CLI-003', detail:'Prodigy Aura — ₦10,000,000 (180 days)',                        date:'Apr 12, 2024', status:'rejected', priority:'low' },
];

const SAMPLE_TRANSACTIONS = [
  { id:'TXN-001', client:'Prodigy Holdings Ltd', type:'funding',      amount:1250000,   date:'Feb 28, 2024', status:'successful', ref:'PSK-ABC123' },
  { id:'TXN-002', client:'John Doe',             type:'subscription', amount:50000000,  date:'Feb 20, 2024', status:'successful', ref:'INV-DEF456' },
  { id:'TXN-003', client:'Awobajo Lanre Daniel', type:'funding',      amount:8750000,   date:'Mar 10, 2024', status:'successful', ref:'PSK-GHI789' },
  { id:'TXN-004', client:'Prodigy Holdings Ltd', type:'redemption',   amount:2000000,   date:'Apr 17, 2024', status:'pending',    ref:'RED-JKL012' },
  { id:'TXN-005', client:'Amaka Okonkwo',        type:'funding',      amount:500000,    date:'Apr 22, 2024', status:'failed',     ref:'PSK-MNO345' },
];

/* ── Wallet data per user ───────────────────────────────────── */
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

  // Admin: update approval status
  updateApproval: (id, status) => set((s) => ({
    approvals: s.approvals.map(a => a.id === id ? { ...a, status } : a),
  })),

  // Admin: update client status
  updateClient: (id, patch) => set((s) => ({
    clients: s.clients.map(c => c.id === id ? { ...c, ...patch } : c),
  })),
}));

export default useAppStore;

export const ROLE_LABELS = {
  super_admin: 'Super Admin', operations: 'Head of Operations',
  compliance: 'Compliance', finance: 'Finance Manager',
  audit: 'Audit Officer', investment: 'Investment Manager',
};
