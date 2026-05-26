/**
 * Prodigy Finance — Super Admin Seed
 * Run with: npx ts-node prisma/seed.ts
 *
 * Creates the one super admin auth user + admin profile.
 * Only run this ONCE on a fresh database.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main() {
  const EMAIL    = 'admin@prodigy.ng';
  const PASSWORD = 'ProdigyAdmin@2024!'; // Change immediately after first login

  const existing = await prisma.authUser.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log('⚠️  Super admin already exists — skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Create AdminUser profile first
  const adminUser = await prisma.adminUser.create({
    data: {
      adminRef:    'ADM-001',
      name:        'Super Admin',
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
  console.log(`   Email:    ${EMAIL}`);
  console.log(`   Password: ${PASSWORD}`);
  console.log('   ⚠️  Change the password immediately after first login!');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
