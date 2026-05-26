/**
 * JWT helper for generating test tokens without hitting the database.
 */
import * as jwt from 'jsonwebtoken';
import { IDS } from './mock-prisma';

export const TEST_JWT_SECRET         = 'prodigy-test-jwt-secret-do-not-use-in-prod';
export const TEST_JWT_REFRESH_SECRET = 'prodigy-test-refresh-secret-do-not-use-in-prod';

export function makeAccessToken(overrides: Partial<{
  sub: string; email: string; role: string;
}> = {}) {
  return jwt.sign(
    { sub: IDS.AUTH_USER, email: 'john@example.com', role: 'individual', ...overrides },
    TEST_JWT_SECRET,
    { expiresIn: '1h' },
  );
}

export function makeAdminToken(overrides: Partial<{
  sub: string; email: string; role: string;
}> = {}) {
  return jwt.sign(
    { sub: IDS.ADMIN_AUTH, email: 'admin@prodigy.ng', role: 'admin', ...overrides },
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
