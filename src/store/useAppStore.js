import { create } from 'zustand';

/* ── Admin Role Configuration ───────────────────────────────── */
// Demo users removed - all authentication now goes through backend API
// Only the first super admin should be seeded in the database manually

/* ── Admin role permissions ─────────────────────────────────── */
export const ADMIN_PERMISSIONS = {
  super_admin:  ['all'],
  operations:   ['clients','loans','kyc','risk','transactions','book_instrument','approval_hub','pretermination','product_setup','plans','dividends','accruals','eod','client_investments','analytics','reports'],
  compliance:   ['kyc','audit_trail','risk'],
  finance:      ['transactions','finance_queue','reports','analytics','client_investments'],
  audit:        ['audit_trail','reports','transactions'],
  investment:   ['plans','book_instrument','approval_hub','pretermination','product_setup','dividends','accruals','client_investments','analytics','reports'],
};

/* ── Initial empty state ─────────────────────────────────────── */
// All data now fetched from backend - no demo/sample data
const INITIAL_STATE = {
  plans: [],
  clients: [],
  approvals: [],
  allTransactions: [],
  instruments: [],
  corpLoanEntities: [],
  preTermQueue: [],
  financeQueue: [],
  clientInvestments: [],
  auditLog: [],
  dividends: [],
  adminUsers: [],
  walletBalance: 0,
  pendingBalance: 0,
  transactions: [],
};

// Sample data removed - all data now fetched from backend API
// Use empty arrays as initial state

/* ── Data removed - now fetched from backend ───────────────── */







/* ── Product + AdminUser mappers (shared between fetchApiData & mutations) ── */
const mapProduct = (p) => {
  const roiMin = Number(p.roiMin ?? 0);
  const roiMax = Number(p.roiMax ?? roiMin);
  return {
    ...p,
    roi:       roiMin === roiMax ? `${roiMin}%` : `${roiMin}% \u2013 ${roiMax}%`,
    roiNum:    roiMax,
    minInvest: Number(p.minInvestKobo ?? 0) / 100,
    lockIn:    p.lockInDays ? `${p.lockInDays} day${p.lockInDays === 1 ? '' : 's'}` : '\u2014',
    desc:      p.description || '',
    tag:       p.isNegotiated ? 'Negotiable' : undefined,
    color:     p.color || '#3b82f6',
  };
};

const mapAdminUser = (u) => ({
  ...u,
  adminRole: u.role?.toLowerCase() || 'operations',
  status:    u.status?.toLowerCase() || 'active',
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

/* ── KYC documents ──────────────────────────────────────────── */
export const KYC_REQUIREMENTS = {
  corporate: [
    { key:'cac_cert',        label:'CAC Certificate',                         required:true },
    { key:'memart',          label:'MEMART & Status of Directors',            required:true },
    { key:'scuml_tax',       label:'SCUML & Tax ID',                         required:true },
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
      // Products (available to all)
      tasks.push(api.productApi.findAll().then(data => {
        if (data && Array.isArray(data)) set({ plans: data.map(mapProduct) });
      }).catch(() => {}));
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
          if (data && Array.isArray(data)) set({ clientInvestments: data });
        }).catch(() => {}));
      }
      // Admin-only: try to load admin data (silently fails for regular users)
      if (user?.role === 'admin') {
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
            const transformed = data.map(inv => ({
              id: inv.id,
              investRef: inv.investRef,
              clientId: inv.client?.clientRef || inv.clientId,
              clientName: inv.client?.name,
              client: inv.client,
              plan: inv.product?.name || inv.planName,
              planId: inv.productId || inv.planId,
              product: inv.product,
              amount: Number(inv.principalKobo || inv.principalAmount || inv.amount || 0) / 100,
              principalAmount: Number(inv.principalKobo || inv.principalAmount || 0) / 100,
              roi: inv.roiRate || inv.roi || inv.product?.roiMin,
              tenor: inv.tenorDays || inv.tenor,
              tenorDays: inv.tenorDays,
              status: inv.status?.toLowerCase(),
              valueDate: inv.valueDate ? new Date(inv.valueDate).toLocaleDateString('en-GB') : '—',
              maturityDate: inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString('en-GB') : '—',
              tax: inv.withholdingTax || 0,
              autoRollover: inv.autoRollover,
              notes: inv.notes,
              createdAt: inv.createdAt,
              history: inv.history,
            }));
            set({ clientInvestments: transformed });
          }
        }).catch(() => {}));
        tasks.push(api.adminTransactionApi.findAll().then(data => {
          if (data && Array.isArray(data)) {
            const transformed = data.map(t => ({
              id: t.id,
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
            const transformed = data.map(fq => ({
              id: fq.id,
              fqRef: fq.fqRef,
              type: fq.type,
              status: fq.status?.toLowerCase(),
              clientId: fq.client?.clientRef,
              client: fq.client?.name,
              amount: Number(fq.amountKobo || 0) / 100,
              penalty: Number(fq.penaltyKobo || 0) / 100,
              notes: fq.notes,
              preTermId: fq.preTermId,
              preTermination: fq.preTermination,
              createdAt: fq.createdAt,
              approvedAt: fq.approvedAt,
              rejectedAt: fq.rejectedAt,
              rejectionReason: fq.rejectionReason,
            }));
            set({ financeQueue: transformed });
          }
        }).catch(() => {}));
        tasks.push(api.adminPreTermApi.findAll().then(data => {
          if (data && Array.isArray(data)) {
            const transformed = data.map(pt => ({
              id: pt.id,
              preTermRef: pt.preTermRef,
              investmentId: pt.investmentId,
              investment: pt.investment,
              clientId: pt.client?.clientRef,
              client: pt.client?.name,
              status: pt.status?.toLowerCase().replace('pending_ops', 'pending').replace('approved_ops', 'approved_ops').replace('pending_finance', 'pending'),
              amount: Number(pt.requestedAmountKobo || 0) / 100,
              penalty: Number(pt.penaltyKobo || 0) / 100,
              netPayout: Number(pt.netPayoutKobo || 0) / 100,
              reason: pt.reason,
              requestedAt: pt.requestedAt,
              opsApprovedAt: pt.opsApprovedAt,
              financeApprovedAt: pt.financeApprovedAt,
              disbursedAt: pt.disbursedAt,
              rejectedAt: pt.rejectedAt,
              rejectionReason: pt.rejectionReason,
            }));
            set({ preTermQueue: transformed });
          }
        }).catch(() => {}));
        tasks.push(api.adminDividendApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ dividends: data });
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

  // Admin: update a plan
  updatePlan: (id, patch) => {
    set((s) => ({ plans: s.plans.map(p => p.id === id ? { ...p, ...patch } : p) }));
    import('../services/api').then(m => m.productApi.update(id, patch)).catch(() => {});
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

  // Admin: add instrument
  addInstrument: (inst) => set((s) => ({ instruments: [inst, ...s.instruments] })),

  // Admin: add audit log entry
  addAuditEntry: (entry) => set((s) => ({ auditLog: [entry, ...s.auditLog] })),

  // Admin: add dividend declaration
  addDividend: (div) => set((s) => ({ dividends: [div, ...s.dividends] })),
  declareDividend: (div) => {
    set((s) => ({ dividends: [div, ...s.dividends] }));
    import('../services/api').then(m => m.adminDividendApi.declare(div)).catch(() => {});
  },

  // Admin: book investment instrument
  bookInvestment: (inv) => {
    set((s) => ({ clientInvestments: [inv, ...s.clientInvestments] }));
    import('../services/api').then(m => m.adminInvestmentApi.book(inv)).catch(() => {});
  },

  // Admin: sell pre-termination instrument
  sellPreTerm: (id, sellData) => {
    set((s) => ({
      preTermQueue: s.preTermQueue.map(p => p.id === id ? { ...p, status:'sold', sellData } : p),
    }));
    import('../services/api').then(m => m.adminInvestmentApi.sell(id, sellData)).catch(() => {});
  },

  // Register new client (adds to clients list + syncs mandate for joint)
  addClient: (client) => {
    set((s) => ({ clients: [...s.clients, client] }));
    if (client.mandate) {
      import('../services/api').then(m => m.clientApi.updateMandate(client.mandate)).catch(() => {});
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
  approvePreTerm: (id, approvedBy) => {
    set((s) => ({
      preTermQueue: s.preTermQueue.map(p => p.id === id ? { ...p, status:'approved_ops', approvedBy } : p),
      financeQueue: [
        ...s.financeQueue,
        (() => { const p = s.preTermQueue.find(x=>x.id===id); return p ? { id:'FQ-'+Date.now(), client:p.client, clientId:p.clientId, product:p.product, type:'Pre-Termination', amount:p.amount, penalty:p.penalty, reason:p.reason, requestDate:p.requestDate, requestedBy:`${approvedBy} (Ops)`, status:'pending', approvedBy:'', rejectedBy:'', rejectReason:'' } : null; })()
      ].filter(Boolean),
    }));
    import('../services/api').then(m => m.adminPreTermApi.approve(id)).catch(() => {});
  },
  rejectPreTerm: (id, rejectedBy, rejectReason) => {
    set((s) => ({
      preTermQueue: s.preTermQueue.map(p => p.id === id ? { ...p, status:'rejected', rejectedBy, rejectReason } : p),
    }));
    import('../services/api').then(m => m.adminPreTermApi.reject(id, rejectReason)).catch(() => {});
  },

  // Admin: finance queue actions
  approveFinanceItem: (id, approvedBy) => {
    set((s) => ({ financeQueue: s.financeQueue.map(f => f.id === id ? { ...f, status:'approved', approvedBy } : f) }));
    import('../services/api').then(m => m.adminFinanceQueueApi.approve(id)).catch(() => {});
  },
  rejectFinanceItem: (id, rejectedBy, rejectReason) => {
    set((s) => ({ financeQueue: s.financeQueue.map(f => f.id === id ? { ...f, status:'rejected', rejectedBy, rejectReason } : f) }));
    import('../services/api').then(m => m.adminFinanceQueueApi.reject(id, rejectReason)).catch(() => {});
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
