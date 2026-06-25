import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: { sub: string; email: string; role: string; clientId?: string | null; adminUserId?: string | null; adminRole?: string | null }) {
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
