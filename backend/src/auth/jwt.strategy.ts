import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'secretkey',
    });
  }

  async validate(payload: any) {
    return prisma.user.findUnique({ where: { id: payload.sub } });
  }
}
