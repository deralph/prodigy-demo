import { SetMetadata } from '@nestjs/common';

export const ADMIN_ROLES_KEY = 'adminRoles';

/**
 * Restricts an admin-only endpoint to specific AdminUser sub-roles
 * (e.g. SUPER_ADMIN, OPERATIONS, COMPLIANCE, FINANCE, AUDIT, INVESTMENT).
 *
 * Every AuthUser for an admin has the generic role 'admin' (checked via
 * @Roles('admin')); this decorator adds a second, finer-grained check
 * against AdminUser.role so sensitive resources (e.g. KYC documents
 * containing PII) are only reachable by admins whose function requires it.
 *
 * SUPER_ADMIN always passes regardless of the roles listed here.
 */
export const AdminRoles = (...roles: string[]) => SetMetadata(ADMIN_ROLES_KEY, roles);
