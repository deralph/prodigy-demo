/**
 * Prodigy Finance — Super Admin Seed
 * Run with: npx ts-node prisma/seed.ts
 *
 * Creates the one super admin auth user + admin profile.
 * Only run this ONCE on a fresh database.
 *
 * SECURITY: production credentials are NEVER hardcoded or printed. They are
 * supplied through environment variables only:
 *
 *   SEED_ADMIN_EMAIL     (defaults to admin@prodigy.ng)
 *   SEED_ADMIN_PASSWORD  (REQUIRED — there is deliberately no default)
 *   SEED_ADMIN_NAME      (defaults to "Super Admin")
 *
 * The seed refuses to run without SEED_ADMIN_PASSWORD, never prints the
 * password, never overwrites an existing admin account, and never resets an
 * existing production password.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main() {
  const EMAIL    = process.env.SEED_ADMIN_EMAIL ?? 'admin@prodigy.ng';
  const PASSWORD = process.env.SEED_ADMIN_PASSWORD;
  const NAME     = process.env.SEED_ADMIN_NAME ?? 'Super Admin';

  if (!PASSWORD) {
    // Fail safely: never create an admin with a guessable/empty credential.
    console.error('❌ SEED_ADMIN_PASSWORD is not set. Set it in the environment before seeding.');
    console.error('   Example: SEED_ADMIN_PASSWORD="$(openssl rand -base64 18)" npx ts-node prisma/seed.ts');
    process.exit(1);
  }
  if (PASSWORD.length < 8) {
    console.error('❌ SEED_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const existing = await prisma.authUser.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log('⚠️  Super admin already exists — skipping seed. Existing credentials were NOT modified.');
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Create AdminUser profile first
  const adminUser = await prisma.adminUser.create({
    data: {
      adminRef:    'ADM-001',
      name:        NAME,
      email:       EMAIL,
      role:        'SUPER_ADMIN',
      status:      'ACTIVE',
      permissions: ['all'],
    },
  });

  // Create linked AuthUser (login credentials)
  await prisma.authUser.create({
    data: {
      email:        EMAIL,
      passwordHash,
      role:         'admin',
      isActive:     true,
      adminUserId:  adminUser.id,
    },
  });

  console.log('✅ Super admin created successfully');
  console.log(`   Email: ${EMAIL}`);
  console.log('   Password: set from SEED_ADMIN_PASSWORD (not shown).');
  console.log('   ⚠️  Rotate the password immediately after first login if it was seeded for a shared/demo environment.');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());