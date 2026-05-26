import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Always use DATABASE_URL (pgBouncer port 6543) at runtime.
    // DIRECT_URL is only for migrations (prisma migrate) — never for app queries.
    // pgBouncer transaction mode handles the actual connection pooling on Supabase,
    // so Prisma only needs a small client-side pool (connection_limit=2).
    const base = process.env.DATABASE_URL || '';
    const url = new URL(base);
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('connection_limit', '2');
    url.searchParams.set('pool_timeout', '30');
    url.searchParams.set('connect_timeout', '30');

    super({ datasourceUrl: url.toString() });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
