import { create } from 'zustand';

/* ── Admin Role Configuration ───────────────────────────────── */
// Demo users removed - all authentication now goes through backend API
// Only the first super admin should be seeded in the database manually

/* ── Admin role permissions ─────────────────────────────────── */
export const ADMIN_PERMISSIONS = {
  super_admin:  ['all'],
  operations:   ['clients','loans','kyc','risk','transactions','book_instrument','approval_hub','pretermination','product_setup','plans','accruals','client_investments','analytics','reports'],
  compliance:   ['kyc','audit_trail','risk'],
  finance:      ['transactions','finance_queue','withdrawals','reports','analytics','client_investments'],
  audit:        ['audit_trail','reports','transactions'],
  investment:   ['plans','book_instrument','approval_hub','pretermination','product_setup','accruals','client_investments','analytics','reports'],
};

/* ── Initial empty state ─────────────────────────────────────── */
// All data now fetched from backend - no demo/sample data
const INITIAL_STATE = {
  plans: [],
  clients: [],
  clientProfile: null,
  approvals: [],
  allTransactions: [],
  instruments: [],
  corpLoanEntities: [],
  preTermQueue: [],
  financeQueue: [],
  orgLedger: [],
  clientInvestments: [],
  auditLog: [],
  serverActivity: [],
  adminUsers: [],
  walletBalance: 0,
  pendingBalance: 0,
  transactions: [],
};

// Sample data removed - all data now fetched from backend API
// Use empty arrays as initial state

/* ── Data removed - now fetched from backend ───────────────── */







/* ── Product + AdminUser mappers (shared between fetchApiData & mutations) ── */
const lockInDisplay = (p) => {
  if (p.lockInStr) return p.lockInStr;
  if (!p.lockInDays) return '\u2014';
  const d = p.lockInDays;
  if (d % 365 === 0) return `${d / 365} year${d / 365 === 1 ? '' : 's'}`;
  if (d % 30  === 0) return `${d / 30}  month${d / 30  === 1 ? '' : 's'}`;
  if (d % 7   === 0) return `${d / 7}   week${d / 7   === 1 ? '' : 's'}`;
  return `${d} day${d === 1 ? '' : 's'}`;
};

const mapProduct = (p) => {
  const roiMin = Number(p.roiMin ?? 0);
  const roiMax = Number(p.roiMax ?? roiMin);
  return {
    ...p,
    roi:               roiMin === roiMax ? `${roiMin}%` : `${roiMin}% \u2013 ${roiMax}%`,
    roiNum:            roiMax,
    roiMin:            roiMin,
    roiMax:            roiMax,
    minInvest:         Number(p.minInvestKobo ?? 0) / 100,
    maxInvest:         p.maxInvestKobo ? Number(p.maxInvestKobo) / 100 : null,
    lockIn:            lockInDisplay(p),
    lockInStr:         p.lockInStr || null,
    desc:              p.description || '',
    tag:               p.isNegotiated ? 'Negotiable' : undefined,
    color:             p.color || '#3b82f6',
    withholdingTaxRate: Number(p.withholdingTaxRate ?? 10),
    clientTypes:       Array.isArray(p.clientTypes) && p.clientTypes.length ? p.clientTypes : ['corporate', 'individual', 'joint'],
    category:          p.category || null,
    riskLevel:         p.riskLevel || null,
    hasTenor:          Boolean(p.hasTenor),
    tenorOptions:      Array.isArray(p.tenorOptions) ? p.tenorOptions : [],
    earlyExitPenalty:  p.earlyExitPenalty ? Number(p.earlyExitPenalty) : null,
    status:            p.status || 'ACTIVE',
  };
};

const mapAdminUser = (u) => ({
  ...u,
  adminRole: u.role?.toLowerCase() || 'operations',
  status:    u.status?.toLowerCase() || 'active',
});

// Maps a backend AuditLog row -> the shape AuditItem.jsx already renders.
const mapAuditEntry = (a) => ({
  id: a.id || a.auditRef,
  time: a.occurredAt ? new Date(a.occurredAt).toLocaleString('en-GB') : '—',
  admin: a.adminName || 'Unknown Admin',
  role: a.adminRole?.toLowerCase() || 'unknown',
  action: a.action,
  target: a.targetEntity || '—',
  category: a.category?.toLowerCase() || 'system',
  ip: a.ipAddress || null,
});

// Maps a backend ActivityLog row (client-facing) -> a simple display shape.
const mapActivityEntry = (a) => ({
  id: a.id,
  time: a.occurredAt ? new Date(a.occurredAt).toLocaleString('en-GB') : '—',
  action: a.action,
  description: a.description || '',
  amount: a.amountKobo != null ? Number(a.amountKobo) / 100 : null,
});

const mapClientProfile = (c) => ({
  id: c.id,
  clientId: c.clientRef,
  clientRef: c.clientRef,
  name: c.name,
  email: c.email,
  phone: c.phone,
  address: c.address,
  type: c.type?.toLowerCase(),
  status: c.status === 'ACTIVE' ? 'verified' : c.status === 'SUSPENDED' ? 'suspended' : 'pending',
  accountStatus: c.status,
  kyc: c.kycRecord?.status === 'APPROVED' ? 'approved' : c.kycRecord?.status === 'PENDING' ? 'pending' : 'flagged',
  kycRecord: c.kycRecord,
  riskProfile: c.riskProfile,
  walletBalance: Number(c.walletBalance || 0) / 100,
  pendingBalance: Number(c.pendingBalance || 0) / 100,
  virtualAccountNo: c.virtualAccountNo ?? null,
  virtualAccountBank: c.virtualAccountBank ?? null,
  joined: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : '—',
  createdAt: c.createdAt,
  secondaryName: c.secondaryName,
  secondaryEmail: c.secondaryEmail,
  mandateType: c.mandateType,
  rcNumber: c.rcNumber,
  taxId: c.taxId,
  holders: getJointHolders(c),
});

const mapWalletTxn = (t) => ({
  ...t,
  amount:      Number(t.amountKobo ?? 0) / 100,
  type:        t.type?.toLowerCase()   || 'wallet_funding',
  status:      t.status?.toLowerCase() || 'pending',
  date:        t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—',
  ref:         t.txnRef || t.paystackRef || t.id,
  description: t.description || 'Transaction',
});

const mapInvestment = (inv) => {
  const amount = Number(inv.principalKobo ?? 0) / 100;
  const roi    = Number(inv.roiRate ?? inv.roi ?? 0);
  const tax    = Number(inv.taxRate ?? inv.withholdingTax ?? inv.tax ?? 10);

  let tenor = inv.tenor;
  if (!tenor && inv.tenorDays) {
    const d = inv.tenorDays;
    if (d % 365 === 0)       tenor = `${d / 365} year${d / 365 === 1 ? '' : 's'}`;
    else if (d % 30 === 0)   tenor = `${d / 30} month${d / 30 === 1 ? '' : 's'}`;
    else if (d % 7 === 0)    tenor = `${d / 7} week${d / 7 === 1 ? '' : 's'}`;
    else                     tenor = `${d} day${d === 1 ? '' : 's'}`;
  }

  const valueDateObj    = inv.valueDate    ? new Date(inv.valueDate)    : null;
  const maturityDateObj = inv.maturityDate ? new Date(inv.maturityDate) : null;

  return {
    ...inv,
    id:           inv.id,
    investRef:    inv.investRef,
    clientId:     inv.clientId,
    planId:       inv.productId,
    plan:         inv.product?.name || inv.planName || '—',
    amount,
    roi,
    tax,
    tenor:        tenor || '—',
    tenorDays:    inv.tenorDays,
    status:       inv.status?.toLowerCase() || 'pending_approval',
    valueDate:    valueDateObj    ? valueDateObj.toLocaleDateString('en-GB',    { day:'2-digit', month:'short', year:'numeric' }) : '—',
    maturityDate: maturityDateObj ? maturityDateObj.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—',
    _valueDate:    valueDateObj,
    _maturityDate: maturityDateObj,
    notes:        inv.notes,
    createdAt:    inv.createdAt,
    _createdAt:   inv.createdAt ? new Date(inv.createdAt) : null,
    history:      (inv.history || []).map(h => ({ ...h, date: (h.occurredAt || h.createdAt) ? new Date(h.occurredAt || h.createdAt).toLocaleDateString('en-GB') : '—' })),
    preTermination: inv.preTermination || null,
    preTermStatus: inv.preTermination?.status?.toLowerCase() || null,
  };
};

/* ── KYC documents ──────────────────────────────────────────── */
export const KYC_REQUIREMENTS = {
  corporate: [
    { key:'cac_cert',        label:'CAC Certificate',                         required:true },
    { key:'memart',          label:'MEMART & Status of Directors',            required:true },
    { key:'scuml',           label:'SCUML Certificate',                       required:true },
    { key:'tax_id',          label:'Tax ID / TIN',                            required:true },
    { key:'directors_id',    label:"Directors' Valid ID",                    required:true },
    { key:'utility_bill',    label:'Utility Bill (not older than 3 months)',  required:true },
    { key:'sig_mandate',     label:'Signature Mandate',                      required:true },
    { key:'sig_upload',      label:'Authorised Signatory Signature Upload',   required:true, isSignature:true },
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

export const getJointHolders = (client = {}, user = {}) => {
  const primary = {
    name: client.name || user.name || 'Primary Holder',
    email: client.email || user.email || '—',
  };
  const secondaryName = client.secondaryName || user.secondaryName;
  const secondaryEmail = client.secondaryEmail || user.secondaryEmail;
  const holders = [primary];
  if (secondaryName || secondaryEmail) {
    holders.push({
      name: secondaryName || 'Secondary Holder',
      email: secondaryEmail || '—',
    });
  }
  return holders;
};

export const getJointMandate = (client = {}, user = {}) =>
  client.mandateType || user.mandateType || 'AND';

// Given the holders array (from getJointHolders) and the documents array
// returned by GET /kyc/me (which always includes one entry per required
// doc, suffixed _p1/_p2 for joint accounts), compute each holder's
// verification percentage and whether they're fully verified.
export const getJointKycProgress = (holders = [], docs = []) =>
  holders.map((holder, idx) => {
    const suffix = `_p${idx + 1}`;
    const holderDocs = (docs || []).filter(d => d.key?.endsWith(suffix));
    const total = holderDocs.length;
    const verifiedCount = holderDocs.filter(d => {
      const s = (d.status || '').toString().toLowerCase();
      return s === 'verified' || s === 'approved';
    }).length;
    return {
      holder,
      docs: holderDocs,
      pct: total ? Math.round((verifiedCount / total) * 100) : 0,
      allVerified: total > 0 && verifiedCount === total,
    };
  });




/* ── Synchronously restore session from localStorage ────────── */
const _restoredUser = (() => {
  try {
    const tokens = localStorage.getItem('prodigy_tokens');
    const user   = localStorage.getItem('prodigy_user');
    if (!tokens || !user) return null;
    const t = JSON.parse(tokens);
    if (!t?.accessToken) return null;
    return JSON.parse(user);
  } catch { return null; }
})();

/* ── Store ──────────────────────────────────────────────────── */
const useAppStore = create((set, get) => ({
  user: _restoredUser,
  isAuthenticated: !!_restoredUser,
  sidebarOpen: false,
  isLoadingData: false,

  // All state starts empty — loaded from backend on login
  ...INITIAL_STATE,

  // Auth — with API integration
  login: (userData) => {
    console.log("userData : ",userData)
    localStorage.setItem('prodigy_user', JSON.stringify(userData));
    set({ user: userData, isAuthenticated: true });
    const store = get();
    store.fetchApiData();
  },
  logout: () => {
    import('../services/api').then(m => m.authApi.logout()).catch(() => {});
    import('../services/api').then(m => m.clearTokens()).catch(() => {});
    localStorage.removeItem('prodigy_user');
    set({ user: null, isAuthenticated: false, sidebarOpen: false, ...INITIAL_STATE });
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Fetch live data from backend APIs
  fetchApiData: async () => {
    set({ isLoadingData: true });
    const tasks = [];
    try {
      const api = await import('../services/api');
      const user = get().user;
      // Products — admin sees all statuses, clients see active only
      if (user?.role === 'admin') {
        tasks.push(api.productApi.findAllAdmin().then(data => {
          if (data && Array.isArray(data)) set({ plans: data.map(mapProduct) });
        }).catch(() => {}));
      } else {
        tasks.push(api.productApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ plans: data.map(mapProduct) });
        }).catch(() => {}));
      }
      // User: Wallet & Investments (only for non-admin users)
      if (user?.role !== 'admin') {
        tasks.push(api.walletApi.getWallet().then(data => {
          if (data) set(s => ({
            walletBalance:  Number(data.walletBalance  ?? 0) / 100,
            pendingBalance: Number(data.pendingBalance ?? 0) / 100,
            user: s.user ? { ...s.user, virtualAccountNo: data.virtualAccountNo ?? null, virtualAccountBank: data.virtualAccountBank ?? null } : s.user,
          }));
        }).catch(() => {}));
        tasks.push(api.walletApi.getTransactions().then(data => {
          if (data && Array.isArray(data)) set({ transactions: data.map(mapWalletTxn) });
        }).catch(() => {}));
        tasks.push(api.investmentApi.getMyInvestments().then(data => {
          if (data && Array.isArray(data)) set({ clientInvestments: data.map(mapInvestment) });
        }).catch(() => {}));
        tasks.push(api.clientApi.getMe().then(data => {
          if (data) set({ clientProfile: mapClientProfile(data) });
        }).catch(() => {}));
        tasks.push(api.activityApi.getMine({ limit: 100 }).then(res => {
          const rows = Array.isArray(res) ? res : (res?.data || []);
          if (rows.length) set({ serverActivity: rows.map(mapActivityEntry) });
        }).catch(() => {}));
      }
      // Admin-only: try to load admin data (silently fails for regular users)
      if (user?.role === 'admin') {
        // Audit trail — only SUPER_ADMIN/COMPLIANCE/AUDIT can read this;
        // the backend 403s for other roles and we just skip populating it.
        tasks.push(api.adminAuditApi.findAll({ limit: 200 }).then(res => {
          const rows = Array.isArray(res) ? res : (res?.data || []);
          if (rows.length) set({ auditLog: rows.map(mapAuditEntry) });
        }).catch(() => {}));
        tasks.push(api.adminClientApi.findAll().then(data => {
          if (data && Array.isArray(data)) {
            // Transform Prisma Client fields to frontend format
            const transformed = data.map(c => ({
              id: c.id,
              clientId: c.clientRef,
              clientRef: c.clientRef,
              name: c.name,
              email: c.email,
              phone: c.phone,
              address: c.address,
              type: c.type?.toLowerCase(),
              status: c.status === 'ACTIVE' ? 'verified' : c.status === 'SUSPENDED' ? 'suspended' : 'pending',
              kyc: c.kycRecord?.status === 'APPROVED' ? 'approved' : c.kycRecord?.status === 'PENDING' ? 'pending' : 'flagged',
              kycRecord: c.kycRecord,
              balance: Number(c.walletBalance || 0) / 100, // kobo to naira
              walletBalance: Number(c.walletBalance || 0) / 100,
              pendingBalance: Number(c.pendingBalance || 0) / 100,
              joined: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : '—',
              createdAt: c.createdAt,
              secondaryName: c.secondaryName,
              secondaryEmail: c.secondaryEmail,
              mandateType: c.mandateType,
              rcNumber: c.rcNumber,
              taxId: c.taxId,
              holders: getJointHolders(c),
            }));
            set({ clients: transformed });
          }
        }).catch(() => {}));
        tasks.push(api.adminApprovalApi.findAll().then(data => {
          if (data && Array.isArray(data)) {
            const transformed = data.map(a => ({
              id: a.id,
              approvalRef: a.approvalRef,
              type: (a.type?.toLowerCase() === 'kyc' ? 'kyc_approval' : a.type?.toLowerCase()) || 'subscription',
              status: a.status?.toLowerCase() || 'pending',
              clientName: a.client?.name || '—',
              clientId: a.client?.clientRef,
              client: a.client,
              details: a.details ? (typeof a.details === 'string' ? a.details : JSON.stringify(a.details)) : '—',
              amount: a.amountKobo ? Number(a.amountKobo) / 100 : null,
              date: a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-GB') : '—',
              submittedAt: a.submittedAt,
              priority: a.details?.priority || 'medium',
              reviewedBy: a.reviewedById,
              reviewedAt: a.reviewedAt,
              reviewNotes: a.reviewNotes,
              investmentId: a.investmentId,
              productId: a.productId,
              product: a.product,
            }));
            set({ approvals: transformed });
          }
        }).catch(() => {}));
        tasks.push(api.adminInvestmentApi.findAll().then(data => {
          if (data && Array.isArray(data)) {
            set({ clientInvestments: data.map(mapInvestment) });
          }
        }).catch(() => {}));
        tasks.push(api.adminTransactionApi.findAll().then(data => {
          if (data && Array.isArray(data)) {
            const transformed = data.map(t => ({
              id: t.id,
              ref: t.txnRef,
              txnRef: t.txnRef,
              client: t.client?.name,
              clientEmail: t.client?.email,
              clientId: t.client?.clientRef,
              clientType: t.client?.type?.toLowerCase(),
              type: t.type?.toLowerCase(),
              amount: Number(t.amountKobo || t.amount || 0) / 100,
              status: t.status?.toLowerCase(),
              date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : '—',
              reference: t.paystackRef || t.txnRef,
              description: t.description,
              bankName: t.bankName,
              bankAcctNo: t.bankAcctNo,
              bankAcctName: t.bankAcctName,
              createdAt: t.createdAt,
              processedAt: t.processedAt,
            }));
            set({ allTransactions: transformed });
          }
        }).catch(() => {}));
        tasks.push(api.adminFinanceQueueApi.findAll().then(data => {
          if (data && Array.isArray(data)) {
            const transformed = data.map(fq => {
              const pt  = fq.preTermination;
              const inv = pt?.investment;
              const cli = inv?.client;
              return {
                id:              fq.id,
                fqRef:           fq.fqRef,
                type:            fq.type,
                status:          fq.status?.toLowerCase(),
                clientId:        cli?.clientRef || fq.clientId,
                client:          cli?.name || '—',
                product:         inv?.product?.name || '—',
                amount:          Number(fq.amountKobo || 0) / 100,
                penalty:         Number(fq.penaltyKobo || 0) / 100,
                reason:          pt?.reason || '—',
                requestDate:     pt?.requestedAt ? new Date(pt.requestedAt).toLocaleDateString('en-GB') : '—',
                requestedBy:     fq.requestedById || '—',
                notes:           fq.notes,
                preTermId:       fq.preTermId,
                preTermination:  pt,
                createdAt:       fq.createdAt,
                approvedAt:      fq.approvedAt,
                rejectedAt:      fq.rejectedAt,
                rejectionReason: fq.rejectionReason,
              };
            });
            set({ financeQueue: transformed });
          }
        }).catch(() => {}));
        tasks.push(api.adminPreTermApi.findAll().then(data => {
          if (data && Array.isArray(data)) {
            const transformed = data.map(pt => {
              const inv = pt.investment;
              const cli = inv?.client;
              const tenorDays = inv?.tenorDays;
              let tenor = '—';
              if (tenorDays) {
                if (tenorDays % 365 === 0)     tenor = `${tenorDays / 365} year${tenorDays / 365 === 1 ? '' : 's'}`;
                else if (tenorDays % 30 === 0) tenor = `${tenorDays / 30} month${tenorDays / 30 === 1 ? '' : 's'}`;
                else                           tenor = `${tenorDays} days`;
              }
              const rawStatus = pt.status?.toLowerCase() || 'pending_ops';
              const status = rawStatus === 'pending_ops' ? 'pending'
                           : rawStatus === 'pending_finance' ? 'approved_ops'
                           : rawStatus === 'disbursed' ? 'disbursed'
                           : rawStatus;
              return {
                id: pt.id,
                preTermRef: pt.preTermRef,
                investmentId: pt.investmentId,
                investment: inv,
                clientId: cli?.clientRef || pt.clientId,
                client: cli?.name || '—',
                status,
                amount: Number(pt.requestedAmountKobo || 0) / 100,
                penalty: Number(pt.penaltyKobo || 0) / 100,
                netPayout: Number(pt.netPayoutKobo || 0) / 100,
                reason: pt.reason || '—',
                requestedAt: pt.requestedAt,
                requestDate: pt.requestedAt ? new Date(pt.requestedAt).toLocaleDateString('en-GB') : '—',
                opsApprovedAt: pt.opsApprovedAt,
                financeApprovedAt: pt.financeApprovedAt,
                disbursedAt: pt.disbursedAt,
                rejectedAt: pt.rejectedAt,
                rejectionReason: pt.rejectionReason,
                rejectReason: pt.rejectionReason || '',
                approvedBy: '',
                rejectedBy: '',
                product: inv?.product?.name || '—',
                tenor,
                maturityDate: inv?.maturityDate ? new Date(inv.maturityDate).toLocaleDateString('en-GB') : '—',
              };
            });
            set({ preTermQueue: transformed });
          }
        }).catch(() => {}));
        tasks.push(api.orgLedgerApi.findAll().then(data => {
          if (data && Array.isArray(data)) {
            const transformed = data.map(entry => ({
              id:          entry.id,
              entryRef:    entry.entryRef,
              type:        entry.type?.toLowerCase(),
              description: entry.description || entry.type,
              amount:      Number(entry.amountKobo || 0) / 100,
              clientId:    entry.clientId,
              clientName:  entry.client?.name || '—',
              clientEmail: entry.client?.email || '—',
              clientRef:   entry.client?.clientRef || '—',
              preTermId:   entry.preTermId,
              fqItemId:    entry.fqItemId,
              recordedById: entry.recordedById,
              date:        entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-GB') : '—',
              createdAt:   entry.createdAt,
            }));
            set({ orgLedger: transformed });
          }
        }).catch(() => {}));
        tasks.push(api.adminStaffLoanApi.getAllEntities().then(data => {
          if (data && Array.isArray(data)) set({ corpLoanEntities: data });
        }).catch(() => {}));
        tasks.push(api.adminUserApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ adminUsers: data.map(mapAdminUser) });
        }).catch(() => {}));
      }
      await Promise.allSettled(tasks);
    } catch { /* Backend offline */ }
    finally { set({ isLoadingData: false }); }
  },

  // Wallet
  addTransaction: (txn) => set((s) => ({
    walletBalance: s.walletBalance + txn.amount,
    transactions: [txn, ...s.transactions],
  })),

  refreshWallet: async () => {
    const api = await import('../services/api');
    try {
      const [wallet, txns] = await Promise.all([
        api.walletApi.getWallet().catch(() => null),
        api.walletApi.getTransactions().catch(() => null),
      ]);
      if (wallet) set(s => ({
        walletBalance:  Number(wallet.walletBalance  ?? 0) / 100,
        pendingBalance: Number(wallet.pendingBalance ?? 0) / 100,
        user: s.user ? { ...s.user, virtualAccountNo: wallet.virtualAccountNo ?? null, virtualAccountBank: wallet.virtualAccountBank ?? null } : s.user,
      }));
      if (txns && Array.isArray(txns)) set({ transactions: txns.map(mapWalletTxn) });
    } catch {}
  },

  // Re-fetch the logged-in client's own authoritative profile (secondaryName,
  // mandateType, kycRecord, etc.) — call after any action that may have
  // changed it (withdrawal, KYC upload, compliance updating the mandate).
  refreshProfile: async () => {
    const api = await import('../services/api');
    try {
      const data = await api.clientApi.getMe();
      if (data) set({ clientProfile: mapClientProfile(data) });
    } catch {}
  },

  refreshInvestments: async () => {
    const api = await import('../services/api');
    try {
      const data = await api.investmentApi.getMyInvestments();
      if (data && Array.isArray(data)) set({ clientInvestments: data.map(mapInvestment) });
    } catch {}
  },

  // Admin: update a plan
  updatePlan: async (id, patch) => {
    set((s) => ({ plans: s.plans.map(p => p.id === id ? { ...p, ...patch } : p) }));
    const api = await import('../services/api');
    try {
      const updated = await api.productApi.update(id, patch);
      if (updated) set((s) => ({ plans: s.plans.map(p => p.id === id ? mapProduct(updated) : p) }));
      return updated;
    } catch (err) {
      console.error('Failed to update product:', err);
      throw err;
    }
  },

  // Admin: add a new plan
  addPlan: async (plan) => {
    const api = await import('../services/api');
    try {
      const created = await api.productApi.create(plan);
      if (created) {
        set((s) => ({ plans: [...s.plans, mapProduct(created)] }));
      }
      return created;
    } catch (err) {
      console.error('Failed to create product:', err);
      throw err;
    }
  },

  // Admin: update approval (accepts patch object or status string)
  updateApproval: (id, patchOrStatus) => {
    const patch = typeof patchOrStatus === 'string' ? { status: patchOrStatus } : patchOrStatus;
    set((s) => ({ approvals: s.approvals.map(a => a.id === id ? { ...a, ...patch } : a) }));
    // Sync to backend
    if (patch.status === 'approved') {
      import('../services/api').then(m => m.adminApprovalApi.approve(id, patch.notes)).catch(() => {});
    } else if (patch.status === 'rejected') {
      import('../services/api').then(m => m.adminApprovalApi.reject(id, patch.rejectReason)).catch(() => {});
    }
  },

  // Admin: update client status
  updateClient: (id, patch) => {
    set((s) => ({ clients: s.clients.map(c => c.id === id ? { ...c, ...patch } : c) }));
    import('../services/api').then(m => m.adminClientApi.updateStatus(id, patch.status)).catch(() => {});
  },

  // Reflect a mandate change locally after the API call has already
  // succeeded (the caller is responsible for calling adminClientApi.updateMandate
  // first) — deliberately does NOT call updateStatus like updateClient does.
  setClientMandateLocal: (id, mandateType) => {
    set((s) => ({ clients: s.clients.map(c => c.id === id ? { ...c, mandateType } : c) }));
  },

  // Admin: add instrument
  addInstrument: (inst) => set((s) => ({ instruments: [inst, ...s.instruments] })),

  // Admin: add audit log entry
  addAuditEntry: (entry) => set((s) => ({ auditLog: [entry, ...s.auditLog] })),

  // Admin: book investment instrument
  bookInvestment: (inv) => {
    set((s) => ({ clientInvestments: [inv, ...s.clientInvestments] }));
    import('../services/api').then(m => m.adminInvestmentApi.book(inv)).catch(() => {});
  },


  // Register new client (adds to clients list + syncs mandate for joint)
  addClient: (client) => {
    set((s) => ({ clients: [...s.clients, client] }));
    if (client.mandate && client.clientId) {
      import('../services/api').then(m => m.adminClientApi.updateMandate(client.clientId, client.mandate)).catch(() => {});
    }
  },

  // Register a new joint account with multiple holders (equal share, auto-computed)
  registerJointAccount: (payload) => {
    const { holders, mandate, phone, address } = payload;
    const n = holders.length;
    const equalShare = parseFloat((100 / n).toFixed(4));
    const holdersWithShare = holders.map((h, i) => ({
      ...h,
      share: i < n - 1 ? equalShare : parseFloat((100 - equalShare * (n - 1)).toFixed(4)),
      kycDone: false,
    }));
    const newClient = {
      id: 'CLI-' + Date.now(),
      clientId: 'CLI-' + Date.now(),
      name: holders[0].name,
      email: holders[0].email,
      type: 'joint',
      accountType: 'joint',
      status: 'pending',
      kyc: 'pending',
      balance: 0,
      joined: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
      phone,
      address,
      mandate,
      holders: holdersWithShare,
    };
    set((s) => ({ clients: [...s.clients, newClient] }));
    import('../services/api').then(m => m.jointApi.register(newClient)).catch(() => {});
    return newClient;
  },

  // Update KYC status for a specific holder on a joint account
  updateJointHolderKyc: (clientId, holderEmail, kycDone) => {
    set((s) => ({
      clients: s.clients.map(c => c.clientId === clientId
        ? { ...c, holders: (c.holders || []).map(h => h.email === holderEmail ? { ...h, kycDone } : h) }
        : c
      ),
    }));
  },

  // Admin: pre-termination actions
  approvePreTerm: async (id, approvedBy) => {
    set(s => ({ preTermQueue: s.preTermQueue.map(p => p.id === id ? { ...p, status: 'approved_ops', approvedBy } : p) }));
    try {
      const api = await import('../services/api');
      await api.adminPreTermApi.approve(id);
      await get().fetchApiData();
    } catch (err) {
      console.error('Pre-term approval failed', err);
    }
  },
  rejectPreTerm: async (id, rejectedBy, rejectReason) => {
    set(s => ({ preTermQueue: s.preTermQueue.map(p => p.id === id ? { ...p, status: 'rejected', rejectedBy, rejectReason } : p) }));
    try {
      const api = await import('../services/api');
      await api.adminPreTermApi.reject(id, rejectReason);
      await get().fetchApiData();
    } catch (err) {
      console.error('Pre-term rejection failed', err);
    }
  },

  // User: request pre-termination (adds to admin queue optimistically)
  requestPreTermination: async (investmentId, reason) => {
    const api = await import('../services/api');
    await api.investmentApi.requestPreTermination(investmentId, reason);
    await get().fetchApiData();
  },

  // Admin: finance queue actions
  approveFinanceItem: async (id, approvedBy) => {
    set(s => ({ financeQueue: s.financeQueue.map(f => f.id === id ? { ...f, status: 'approved', approvedBy } : f) }));
    try {
      const api = await import('../services/api');
      await api.adminFinanceQueueApi.approve(id);
      await get().fetchApiData();
    } catch (err) {
      console.error('Finance approval failed', err);
    }
  },
  rejectFinanceItem: async (id, rejectedBy, rejectReason) => {
    set(s => ({ financeQueue: s.financeQueue.map(f => f.id === id ? { ...f, status: 'rejected', rejectedBy, rejectReason } : f) }));
    try {
      const api = await import('../services/api');
      await api.adminFinanceQueueApi.reject(id, rejectReason);
      await get().fetchApiData();
    } catch (err) {
      console.error('Finance rejection failed', err);
    }
  },

  // Admin: user management
  addAdminUser: async (u) => {
    const api = await import('../services/api');
    try {
      const created = await api.adminUserApi.create(u);
      if (created) {
        set((s) => ({ adminUsers: [...s.adminUsers, mapAdminUser(created)] }));
      }
      return created;
    } catch (err) {
      console.error('Failed to create admin user:', err);
      throw err;
    }
  },
  updateAdminUser: async (id, patch) => {
    const api = await import('../services/api');
    try {
      const updated = await api.adminUserApi.update(id, patch);
      if (updated) {
        set((s) => ({
          adminUsers: s.adminUsers.map(u => u.id === id ? mapAdminUser({ ...u, ...updated }) : u),
        }));
      }
      return updated;
    } catch (err) {
      console.error('Failed to update admin user:', err);
      throw err;
    }
  },
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
