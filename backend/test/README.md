# Test Suite — Prodigy Finance Backend

Comprehensive test suite covering **Unit Tests**, **Integration Tests**, and **E2E/System Tests**.

## 📁 Structure

```
test/
├── helpers/
│   ├── mock-prisma.ts    # Shared Prisma mock factory + test IDs
│   └── jwt.helper.ts     # JWT token generator for test auth
├── integration/
│   └── api.integration.spec.ts   # HTTP layer tests (full app + mock DB)
├── e2e/
│   └── system.e2e-spec.ts      # Full user journeys & admin flows
└── README.md

src/
├── auth/auth.service.spec.ts         # Unit tests
├── clients/clients.service.spec.ts
├── investments/investments.service.spec.ts
├── wallet/wallet.service.spec.ts
├── kyc/kyc.service.spec.ts
├── approvals/approvals.service.spec.ts
└── products/products.service.spec.ts
```

## 🚀 How to Run

```bash
# All tests
npm run test:all

# Unit tests only (fast, mocks only)
npm run test:unit

# Integration tests only (HTTP layer, full app)
npm run test:integration

# E2E / System tests only (full user journeys)
npm run test:e2e

# Watch mode during development
npm run test:watch

# Coverage report
npm run test:cov
```

## 📊 Test Coverage

| Layer | What’s Tested |
|-------|---------------|
| **Unit** | Each service in isolation with mocked Prisma. Tests business logic, error handling, authorization checks. |
| **Integration** | Full NestJS app with mocked database. Tests HTTP status codes, request validation, guards (JWT + Roles), DTO transformation. |
| **E2E/System** | Multi-step user journeys simulating real usage: registration → login → KYC → investment → admin approval → wallet. |

## 🔐 Test Authentication

Tests use pre-generated JWT tokens (no real database required). The `jwt.helper.ts` sets `JWT_SECRET` to a test value and signs tokens with `jsonwebtoken` directly.

## 🧪 Mock Prisma

The `mock-prisma.ts` factory creates a fully typed mock of `PrismaService` with jest spies for every model method. Use it in unit tests like:

```ts
import { createMockPrisma, IDS, MOCK } from '../../test/helpers/mock-prisma';

const prisma = createMockPrisma();
prisma.client.findUnique.mockResolvedValue(MOCK.client);
```

## 🎯 Key Test Scenarios

### Auth
- ✅ Register individual (single/joint) and corporate accounts
- ✅ Login with valid/invalid credentials
- ✅ Forgot password (safe response regardless of email existence)
- ✅ Refresh token & logout

### Client
- ✅ View own profile (`GET /clients/me`)
- ✅ Update mandate type (AND/OR) for joint accounts
- ✅ Admin: list clients, search, view single, update status

### KYC
- ✅ Upload documents (individual 5 docs, joint 10 docs, corporate 5 docs)
- ✅ Auto-submit KYC when all required docs uploaded
- ✅ Admin: compliance board, approve/reject KYC

### Investments
- ✅ Subscribe to product (creates PENDING_APPROVAL investment)
- ✅ View own investments
- ✅ Request early redemption (pre-termination)
- ✅ Admin: book investment directly (ACTIVE status)
- ✅ Admin: approve/reject subscription approvals

### Wallet
- ✅ View balance & virtual account
- ✅ View transaction history
- ✅ Request withdrawal (validates sufficient balance)
- ✅ Admin: view all transactions with filters

### Products
- ✅ Public listing (no auth required)
- ✅ Admin: update product settings (ROI, status, min investment)

### Security
- ✅ 401 for missing/invalid JWT
- ✅ 403 for non-admin accessing admin routes
- ✅ 403 for accessing other clients’ data
