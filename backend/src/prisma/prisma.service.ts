import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const runtimeUrl = PrismaService.buildRuntimeDbUrl();
    super({ datasourceUrl: runtimeUrl });
  }

  private static buildRuntimeDbUrl(): string {
    const preferDirect = (process.env.USE_DIRECT_DB_URL ?? 'false').toLowerCase() === 'true';
    const pooled = process.env.DATABASE_URL?.trim();
    const direct = process.env.DIRECT_URL?.trim();

    const base = preferDirect ? (direct || pooled) : (pooled || direct);
    if (!base) {
      throw new Error('Missing database URL. Set DATABASE_URL (and optionally DIRECT_URL) in backend/.env');
    }

    const url = new URL(base);
    if (!preferDirect) {
      // Supabase pooler best-practice options for Prisma runtime connections.
      url.searchParams.set('pgbouncer', 'true');
      url.searchParams.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT ?? '2');
      url.searchParams.set('pool_timeout', process.env.PRISMA_POOL_TIMEOUT ?? '30');
      url.searchParams.set('connect_timeout', process.env.PRISMA_CONNECT_TIMEOUT ?? '30');
    }

    return url.toString();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database. Check DATABASE_URL/DIRECT_URL and network access to Supabase.', error as any);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
