/**
 * JWT helper for generating test tokens without hitting the database.
 */
import * as jwt from 'jsonwebtoken';
import { IDS } from './mock-prisma';

export const TEST_JWT_SECRET         = 'prodigy-test-jwt-secret-do-not-use-in-prod';
export const TEST_JWT_REFRESH_SECRET = 'prodigy-test-refresh-secret-do-not-use-in-prod';

export function makeMagicToken(overrides: Partial<{
  clientId: string; clientRef: string; secondaryEmail: string; purpose: string;
}> = {}) {
  return jwt.sign(
    { clientId: IDS.CLIENT_DB, clientRef: 'CLI-001', secondaryEmail: 'jane@example.com', purpose: 'joint_secondary_setup', ...overrides },
    TEST_JWT_SECRET,
    { expiresIn: '48h' },
  );
}

export function makeAccessToken(overrides: Partial<{
  sub: string; email: string; role: string; clientId: string; adminRole: string;
}> = {}) {
  return jwt.sign(
    { sub: IDS.AUTH_USER, email: 'john@example.com', role: 'individual', clientId: IDS.CLIENT_DB, ...overrides },
    TEST_JWT_SECRET,
    { expiresIn: '1h' },
  );
}

export function makeAdminToken(overrides: Partial<{
  sub: string; email: string; role: string; adminRole: string;
}> = {}) {
  return jwt.sign(
    { sub: IDS.ADMIN_AUTH, email: 'admin@prodigy.ng', role: 'admin', adminRole: 'SUPER_ADMIN', adminUserId: IDS.ADMIN_USER, ...overrides },
    TEST_JWT_SECRET,
    { expiresIn: '1h' },
  );
}

export function makeRefreshToken(sub: string) {
  return jwt.sign({ sub, email: 'john@example.com', role: 'individual' }, TEST_JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/** Set JWT env vars — call this in beforeAll of integration/e2e tests */
export function setTestJwtEnv() {
  process.env.JWT_SECRET          = TEST_JWT_SECRET;
  process.env.JWT_REFRESH_SECRET  = TEST_JWT_REFRESH_SECRET;
  process.env.JWT_EXPIRES_IN      = '1h';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
}
