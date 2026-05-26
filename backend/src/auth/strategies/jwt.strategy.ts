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

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.authUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, clientId: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return {
      sub:        payload.sub,
      email:      payload.email,
      role:       payload.role,
      clientDbId: user.clientId,   // Prisma Client.id — used by most controllers
      clientId:   user.clientId,   // alias used by legacy & statements controllers
    };
  }
}
