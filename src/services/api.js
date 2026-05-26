const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/* ── Token helpers ────────────────────────────────────────── */
export function getTokens() {
  const raw = localStorage.getItem('prodigy_tokens');
  return raw ? JSON.parse(raw) : null;
}

export function setTokens(tokens) {
  localStorage.setItem('prodigy_tokens', JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem('prodigy_tokens');
}

/* ── Base fetch wrapper ───────────────────────────────────── */
async function request(path, opts = {}) {
  const tokens = getTokens();
  const headers = { ...(opts.headers || {}) };

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  // Try token refresh on 401
  if (res.status === 401 && tokens?.refreshToken) {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.refreshToken}`,
      },
    });
    if (refreshRes.ok) {
      const newTokens = await refreshRes.json();
      setTokens(newTokens);
      headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
      const retry = await fetch(`${API_BASE}${path}`, { ...opts, headers });
      if (!retry.ok) throw await buildError(retry);
      return retry.status === 204 ? null : retry.json();
    }
    // Refresh failed — force logout
    clearTokens();
    window.location.href = '/login';
    return;
  }

  if (!res.ok) throw await buildError(res);
  return res.status === 204 ? null : res.json();
}

async function buildError(res) {
  let body;
  try { body = await res.json(); } catch { body = {}; }
  const err = new Error(body.message || `Request failed (${res.status})`);
  err.status = res.status;
  err.body = body;
  return err;
}

/* ── AUTH ─────────────────────────────────────────────────── */
export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  registerCorporate: (data) =>
    request('/auth/register/corporate', { method: 'POST', body: JSON.stringify(data) }),
  registerIndividual: (data) =>
    request('/auth/register/individual', { method: 'POST', body: JSON.stringify(data) }),
  registerJoint: (data) =>
    request('/auth/register/joint', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

/* ── NIBSS VERIFICATION ──────────────────────────────────── */
export const nibssApi = {
  verifyNin: (nin, expectedName) =>
    request('/nibss/verify/nin', { method: 'POST', body: JSON.stringify({ nin, expectedName }) }),
  verifyBvn: (bvn, expectedName) =>
    request('/nibss/verify/bvn', { method: 'POST', body: JSON.stringify({ bvn, expectedName }) }),
  verifyCac: (cacNumber, companyName) =>
    request('/nibss/verify/cac', { method: 'POST', body: JSON.stringify({ cacNumber, companyName }) }),
};

/* ── CLIENTS (own profile) ───────────────────────────────── */
export const clientApi = {
  getMe: () => request('/clients/me'),
  updateMandate: (mandateType) =>
    request('/clients/me/mandate', { method: 'PATCH', body: JSON.stringify({ mandateType }) }),
};

/* ── ADMIN CLIENTS ───────────────────────────────────────── */
export const adminClientApi = {
  findAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/clients${qs ? '?' + qs : ''}`);
  },
  findOne: (clientId) => request(`/admin/clients/${clientId}`),
  updateStatus: (clientId, status) =>
    request(`/admin/clients/${clientId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

/* ── KYC ─────────────────────────────────────────────────── */
export const kycApi = {
  getMyKyc: () => request('/kyc/me'),
  uploadDocument: (docKey, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request(`/kyc/documents/${docKey}`, { method: 'POST', body: fd });
  },
  uploadCorporateDocs: (files) => {
    const fd = new FormData();
    for (const [key, file] of Object.entries(files)) { fd.append(key, file); }
    return request('/kyc/corporate/upload', { method: 'POST', body: fd });
  },
  uploadIndividualDocs: (files) => {
    const fd = new FormData();
    for (const [key, file] of Object.entries(files)) { fd.append(key, file); }
    return request('/kyc/individual/upload', { method: 'POST', body: fd });
  },
  // Admin
  getComplianceBoard: () => request('/kyc/compliance-board'),
  approveKyc: (clientId) => request(`/kyc/${clientId}/approve`, { method: 'POST' }),
  rejectKyc: (clientId, reason) =>
    request(`/kyc/${clientId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

/* ── PRODUCTS ────────────────────────────────────────────── */
export const productApi = {
  findAll: () => request('/products'),
  findOne: (id) => request(`/products/${id}`),
  update: (id, data) => request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

/* ── INVESTMENTS ─────────────────────────────────────────── */
export const investmentApi = {
  getMyInvestments: () => request('/investments/me'),
  subscribe: (data) => request('/investments/subscribe', { method: 'POST', body: JSON.stringify(data) }),
  requestRedemption: (id, reason) =>
    request(`/investments/${id}/redeem`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getStatement: (id) => request(`/investments/${id}/statement`),
  getCertificate: (id) => request(`/investments/${id}/certificate`),
  requestPreTermination: (id, reason) =>
    request(`/investments/${id}/preterminate`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

export const adminInvestmentApi = {
  findAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/investments${qs ? '?' + qs : ''}`);
  },
  book: (data) => request('/admin/investments/book', { method: 'POST', body: JSON.stringify(data) }),
  getStatement: (id) => request(`/admin/investments/${id}/statement`),
  getCertificate: (id) => request(`/admin/investments/${id}/certificate`),
  sell: (id, data) => request(`/admin/investments/${id}/sell`, { method: 'POST', body: JSON.stringify(data) }),
};

/* ── WALLET ──────────────────────────────────────────────── */
export const walletApi = {
  getWallet: () => request('/wallet/me'),
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/wallet/me/transactions${qs ? '?' + qs : ''}`);
  },
  requestWithdrawal: (data) =>
    request('/wallet/withdraw', { method: 'POST', body: JSON.stringify(data) }),
};

export const adminTransactionApi = {
  findAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/transactions${qs ? '?' + qs : ''}`);
  },
  exportCsv: (params = {}) => {
    const qs = new URLSearchParams({ ...params, format: 'csv' }).toString();
    return request(`/admin/transactions/export${qs ? '?' + qs : ''}`);
  },
  inflowByProduct: () => request('/admin/transactions/inflow-by-product'),
};

/* ── REPORTS ─────────────────────────────────────────────── */
export const reportsApi = {
  getPortfolioReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/reports/portfolio${qs ? '?' + qs : ''}`);
  },
  getInflowByProduct: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/reports/inflow-by-product${qs ? '?' + qs : ''}`);
  },
  exportTransactionsCsv: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/reports/transactions/export${qs ? '?' + qs : ''}`);
  },
  exportProductCsv: (productId) =>
    request(`/admin/reports/products/${productId}/export`),
};

/* ── APPROVALS ───────────────────────────────────────────── */
export const adminApprovalApi = {
  findAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/approvals${qs ? '?' + qs : ''}`);
  },
  approve: (id, notes) =>
    request(`/admin/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ notes }) }),
  reject: (id, reason) =>
    request(`/admin/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

/* ── PRE-TERMINATION ─────────────────────────────────────── */
export const adminPreTermApi = {
  findAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/preterminations${qs ? '?' + qs : ''}`);
  },
  findOne: (id) => request(`/admin/preterminations/${id}`),
  approve: (id) => request(`/admin/preterminations/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) =>
    request(`/admin/preterminations/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

/* ── FINANCE QUEUE ───────────────────────────────────────── */
export const adminFinanceQueueApi = {
  findAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/finance-queue${qs ? '?' + qs : ''}`);
  },
  findOne: (id) => request(`/admin/finance-queue/${id}`),
  approve: (id, notes) =>
    request(`/admin/finance-queue/${id}/approve`, { method: 'POST', body: JSON.stringify({ notes }) }),
  reject: (id, reason) =>
    request(`/admin/finance-queue/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

/* ── STAFF LOANS ─────────────────────────────────────────── */
export const staffLoanApi = {
  getMyLoans: () => request('/loans/corporate/me'),
};

export const adminStaffLoanApi = {
  getAllEntities: () => request('/admin/loans/corporate'),
  getEntityLoans: (entityId) => request(`/admin/loans/corporate/${entityId}/staff`),
  findOne: (id) => request(`/admin/loans/${id}`),
};

/* ── DIVIDENDS ───────────────────────────────────────────── */
export const adminDividendApi = {
  findAll: () => request('/admin/dividends'),
  declare: (data) => request('/admin/dividends', { method: 'POST', body: JSON.stringify(data) }),
};

/* ── JOINT ACCOUNTS ──────────────────────────────────────── */
export const jointApi = {
  register: (data) =>
    request('/joint/register', { method: 'POST', body: JSON.stringify(data) }),
  getHolders: (clientId) =>
    request(`/joint/${clientId}/holders`),
  updateHolderKyc: (clientId, holderEmail, status) =>
    request(`/joint/${clientId}/holders/kyc`, { method: 'PATCH', body: JSON.stringify({ holderEmail, status }) }),
  uploadHolderDoc: (clientId, holderIndex, docKey, file) => {
    const fd = new FormData();
    fd.append('holderIndex', holderIndex);
    fd.append('docKey', docKey);
    fd.append('file', file);
    return request(`/joint/${clientId}/kyc/upload`, { method: 'POST', body: fd, headers: {} });
  },
};
