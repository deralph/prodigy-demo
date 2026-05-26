import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const base = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
    // Strip any existing pgbouncer flag, then add pool/keepalive params
    // so the session-mode pooler (port 5432) doesn't silently drop idle connections.
    const url = new URL(base);
    url.searchParams.delete('pgbouncer');
    url.searchParams.set('connection_limit', '5');
    url.searchParams.set('pool_timeout', '30');
    url.searchParams.set('connect_timeout', '30');
    url.searchParams.set('keepalives', '1');
    url.searchParams.set('keepalives_idle', '20');
    url.searchParams.set('keepalives_interval', '5');
    url.searchParams.set('keepalives_count', '3');

    super({ datasourceUrl: url.toString() });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
