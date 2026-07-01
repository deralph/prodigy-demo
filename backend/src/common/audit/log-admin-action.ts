import { PrismaService } from '../../prisma/prisma.service';

export type AuditCategoryName =
  | 'AUTH' | 'KYC' | 'INVESTMENT' | 'FINANCE' | 'OPERATIONS' | 'COMPLIANCE' | 'SYSTEM' | 'AUDIT';

export interface LogAdminActionParams {
  adminId?: string | null;
  adminRole?: string | null;
  action: string;
  targetEntity?: string | null;
  category: AuditCategoryName;
  metadata?: Record<string, any>;
}

/**
 * Writes an AuditLog entry for an admin-initiated action — "who did what".
 *
 * Designed to be called from any service that already has `this.prisma`
 * injected, with zero additional constructor/module wiring: just
 * `await logAdminAction(this.prisma, { ... })` after the mutation succeeds.
 *
 * Never throws — a logging failure must never block the action it's
 * recording. Resolves the admin's display name from AdminUser so every
 * log entry is human-readable without a join at read time.
 */
export async function logAdminAction(prisma: PrismaService, params: LogAdminActionParams): Promise<void> {
  try {
    const adminName = params.adminId
      ? ((await prisma.adminUser.findUnique({ where: { id: params.adminId } }))?.name ?? 'Unknown Admin')
      : 'Unknown Admin';

    await prisma.auditLog.create({
      data: {
        adminId: params.adminId ?? null,
        adminName,
        adminRole: params.adminRole ?? 'unknown',
        action: params.action,
        targetEntity: params.targetEntity ?? null,
        category: params.category as any,
        metadata: (params.metadata ?? undefined) as any,
      },
    });
  } catch {
    // Swallow — logging must never block the underlying admin action.
  }
}
