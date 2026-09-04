/**
 * Shared mock factory for PrismaService.
 * Every service test imports this instead of the real DB.
 */

// ── Shared test IDs ───────────────────────────────────────────────
export const IDS = {
  CLIENT_DB:    'cuid-client-001',
  CLIENT_DB2:   'cuid-client-002',
  AUTH_USER:    'cuid-auth-001',
  ADMIN_AUTH:   'cuid-admin-auth-001',
  ADMIN_USER:   'cuid-admin-user-001',
  PRODUCT:      'cuid-product-001',
  INVESTMENT:   'cuid-investment-001',
  APPROVAL:     'cuid-approval-001',
  KYC_RECORD:   'cuid-kyc-001',
  WALLET_TX:    'cuid-wallet-tx-001',
  PRE_TERM:     'cuid-preterm-001',
};

// ── Shared mock objects ───────────────────────────────────────────
export const MOCK = {
  client: {
    id: IDS.CLIENT_DB,
    clientRef: 'CLI-001',
    type: 'INDIVIDUAL',
    status: 'ACTIVE',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '08012345678',
    walletBalance: BigInt(1_000_000_00),
    pendingBalance: BigInt(0),
    mandateType: null,
    kycRecord: { id: IDS.KYC_RECORD, status: 'APPROVED' },
  },

  corporateClient: {
    id: IDS.CLIENT_DB2,
    clientRef: 'CLI-002',
    type: 'CORPORATE',
    status: 'ACTIVE',
    name: 'Prodigy Holdings Ltd',
    email: 'corp@example.com',
    walletBalance: BigInt(0),
    pendingBalance: BigInt(0),
  },

  authUser: {
    id: IDS.AUTH_USER,
    email: 'john@example.com',
    // bcrypt hash of 'Test1234!'
    passwordHash: '$2b$12$K9WUqaezSHFqNvS2gZFLCOwFWTx/tT.V.7.MFZYfzMxc83xjFVfE.',
    role: 'individual',
    isActive: true,
    clientId: IDS.CLIENT_DB,
    adminUserId: null,
    refreshToken: null,
    lastLoginAt: null,
  },

  adminAuthUser: {
    id: IDS.ADMIN_AUTH,
    email: 'admin@prodigy.ng',
    passwordHash: '$2b$12$K9WUqaezSHFqNvS2gZFLCOwFWTx/tT.V.7.MFZYfzMxc83xjFVfE.',
    role: 'admin',
    isActive: true,
    clientId: null,
    adminUserId: IDS.ADMIN_USER,
    refreshToken: null,
  },

  adminUser: {
    id: IDS.ADMIN_USER,
    adminRef: 'ADM-001',
    name: 'Super Admin',
    email: 'admin@prodigy.ng',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
  },

  product: {
    id: IDS.PRODUCT,
    code: 'aura',
    name: 'Aura Fixed Income',
    status: 'ACTIVE',
    roiMin: 15.0,
    roiMax: 18.0,
    minInvestKobo: BigInt(100_000_00),
    lockInDays: 90,
  },

  investment: {
    id: IDS.INVESTMENT,
    investRef: 'INV-0001',
    clientId: IDS.CLIENT_DB,
    productId: IDS.PRODUCT,
    status: 'ACTIVE',
    principalKobo: BigInt(500_000_00),
    roiRate: 15.0,
    tenorDays: 90,
    valueDate: new Date('2024-01-01'),
    maturityDate: new Date('2024-04-01'),
  },

  approval: {
    id: IDS.APPROVAL,
    approvalRef: 'APP-001',
    type: 'SUBSCRIPTION',
    status: 'PENDING',
    investmentId: IDS.INVESTMENT,
    clientId: IDS.CLIENT_DB,
  },

  walletTx: {
    id: IDS.WALLET_TX,
    txnRef: 'WAL-FT-001',
    clientId: IDS.CLIENT_DB,
    type: 'WALLET_FUNDING',
    status: 'SUCCESSFUL',
    amountKobo: BigInt(100_000_00),
    description: 'Wallet Funding',
  },

  kycRecord: {
    id: IDS.KYC_RECORD,
    clientId: IDS.CLIENT_DB,
    status: 'PENDING',
  },
};

// ── Mock PrismaService factory ────────────────────────────────────
export function createMockPrisma() {
  const mock = {
    authUser:    { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    client:      { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    kycRecord:   { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    kycDocument: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    identityVerification: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
    product:     { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    investment:  { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    investmentEvent: { create: jest.fn(), findMany: jest.fn() },
    walletTransaction: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
    approval:    { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    preTermination: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    activityLog:  { findMany: jest.fn(), create: jest.fn() },
    auditLog:     { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    auditToken:   { create: jest.fn(), findUnique: jest.fn() },
    adminUser:    { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    financeQueueItem: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    dividend:       { findMany: jest.fn(), create: jest.fn() },
    dividendEntry:  { findMany: jest.fn(), create: jest.fn() },
    orgLedger:      { findMany: jest.fn(), create: jest.fn() },
    corporateEntity: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    staffLoan:      { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    loanRepayment:  { create: jest.fn() },
    session:        { findUnique: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([]),
    $executeRaw: jest.fn().mockResolvedValue(1),
    $connect:    jest.fn(),
    $disconnect: jest.fn(),
  };

  // Default: supports both Prisma $transaction forms —
  // callback form: $transaction(async (tx) => ...) runs against the mock itself,
  // array form:    $transaction([promiseA, promiseB]) resolves like Promise.all.
  mock.$transaction.mockImplementation(async (arg: any) =>
    Array.isArray(arg) ? Promise.all(arg) : arg(mock),
  );

  return mock;
}
