import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /**
   * Every authenticated request is re-validated against the database, not just
   * the token signature. This makes deactivation/revocation take effect
   * immediately instead of only after a token expires:
   *  - a deactivated AuthUser (suspended / reset) is rejected outright
   *  - an admin whose AdminUser status is not ACTIVE is rejected outright
   *  - a client whose account was deactivated is rejected outright
   */
  async validate(payload: { sub: string; email: string; role: string; clientId?: string | null; adminUserId?: string | null; adminRole?: string | null }) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        isActive: true,
        adminUserId: true,
        adminUser: { select: { status: true } },
      },
    });
    if (!authUser || !authUser.isActive) {
      throw new UnauthorizedException('Account is locked or inactive');
    }
    // Admin tokens additionally require a live AdminUser profile.
    if (authUser.adminUserId && authUser.adminUser?.status !== 'ACTIVE') {
      throw new UnauthorizedException('Admin account is locked or inactive');
    }

    return {
      sub:        payload.sub,
      email:      payload.email,
      role:       payload.role,
      clientDbId: payload.clientId ?? null,
      clientId:   payload.clientId ?? null,
      adminUserId: payload.adminUserId ?? null,
      adminRole:  payload.adminRole ?? null,
    };
  }
}