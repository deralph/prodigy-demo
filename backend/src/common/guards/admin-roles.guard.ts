import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Authentication required');

    // SUPER_ADMIN has unrestricted access to every admin-gated resource.
    if (user.adminRole === 'SUPER_ADMIN') return true;

    if (!user.adminRole || !requiredRoles.includes(user.adminRole)) {
      throw new ForbiddenException('Your admin role does not have permission to access this resource');
    }
    return true;
  }
}
