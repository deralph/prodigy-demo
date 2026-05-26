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




/* ── Store ──────────────────────────────────────────────────── */
const useAppStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  sidebarOpen: false,
  isLoadingData: false,

  // All state starts empty — loaded from backend on login
  ...INITIAL_STATE,

  // Auth — with API integration
  login: (userData) => {
    set({ user: userData, isAuthenticated: true });
    const store = get();
    store.fetchApiData();
  },
  logout: () => {
    import('../services/api').then(m => m.authApi.logout()).catch(() => {});
    import('../services/api').then(m => m.clearTokens()).catch(() => {});
    set({ user: null, isAuthenticated: false, sidebarOpen: false, ...INITIAL_STATE });
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Fetch live data from backend APIs
  fetchApiData: async () => {
    set({ isLoadingData: true });
    try {
      const api = await import('../services/api');
      // Products (available to all)
      api.productApi.findAll().then(data => {
        if (data && Array.isArray(data)) set({ plans: data });
      }).catch(() => {});
      // User: Wallet
      api.walletApi.getWallet().then(data => {
        if (data) set({ walletBalance: data.balance || 0, pendingBalance: data.pending || 0 });
      }).catch(() => {});
      api.walletApi.getTransactions().then(data => {
        if (data && Array.isArray(data)) set({ transactions: data });
      }).catch(() => {});
      // User investments (individual / corporate / joint)
      api.investmentApi.getMyInvestments().then(data => {
        if (data && Array.isArray(data)) set({ clientInvestments: data });
      }).catch(() => {});
      // Admin-only: try to load admin data (silently fails for regular users)
      const user = get().user;
      if (user?.role === 'admin') {
        api.adminClientApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ clients: data });
        }).catch(() => {});
        api.adminApprovalApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ approvals: data });
        }).catch(() => {});
        api.adminInvestmentApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ clientInvestments: data });
        }).catch(() => {});
        api.adminTransactionApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ allTransactions: data });
        }).catch(() => {});
        api.adminFinanceQueueApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ financeQueue: data });
        }).catch(() => {});
        api.adminPreTermApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ preTermQueue: data });
        }).catch(() => {});
        api.adminDividendApi.findAll().then(data => {
          if (data && Array.isArray(data)) set({ dividends: data });
        }).catch(() => {});
      }
    } catch { /* Backend offline */ }
    finally { set({ isLoadingData: false }); }
  },

  // Wallet
  addTransaction: (txn) => set((s) => ({
    walletBalance: s.walletBalance + txn.amount,
    transactions: [txn, ...s.transactions],
  })),

  // Admin: update a plan
  updatePlan: (id, patch) => {
    set((s) => ({ plans: s.plans.map(p => p.id === id ? { ...p, ...patch } : p) }));
    import('../services/api').then(m => m.productApi.update(id, patch)).catch(() => {});
  },

  // Admin: add a new plan
  addPlan: (plan) => set((s) => ({ plans: [...s.plans, plan] })),

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
