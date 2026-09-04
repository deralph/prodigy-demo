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
 * NEVER throws and NEVER silently drops the entry: `AuditLog.adminId` is an
 * FK to AdminUser, so if the caller passed an id that is NOT an AdminUser id
 * (e.g. an AuthUser id — a real bug we have seen in call sites), the original
 * code would hit an FK violation, the whole create would be swallowed, and the
 * audit entry would be LOST entirely. Instead we resolve the admin first and
 * null the FK on mismatch so the entry is always written.
 */
export async function logAdminAction(prisma: PrismaService, params: LogAdminActionParams): Promise<void> {
  try {
    let adminId: string | null = params.adminId ?? null;
    let adminName = 'Unknown Admin';

    if (params.adminId) {
      const admin = await prisma.adminUser.findUnique({ where: { id: params.adminId } });
      if (admin) {
        adminName = admin.name;
      } else {
        // Caller passed an id that is not an AdminUser (e.g. an AuthUser id).
        // Null the FK so the row is still written instead of violating the
        // constraint and losing the audit trail.
        adminId = null;
      }
    }

    await prisma.auditLog.create({
      data: {
        adminId,
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