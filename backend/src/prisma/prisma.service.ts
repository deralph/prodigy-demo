import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Use the session-mode pooler (port 5432) for runtime queries.
    // Port 6543 (transaction-mode pgBouncer) may be blocked on some networks.
    // connection_limit=3 keeps us well under Supabase free-tier's 20-connection cap.
    const base = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
    const url = new URL(base);
    url.searchParams.delete('pgbouncer');
    url.searchParams.set('connection_limit', '10');
    url.searchParams.set('pool_timeout', '60');
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
