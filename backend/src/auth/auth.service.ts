import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, pass: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null;
    const match = await bcrypt.compare(pass, user.password);
    if (match) return user;
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(email: string, password: string, name?: string) {
    const hashed = await bcrypt.hash(password, 10);
    return prisma.user.create({ data: { email, password: hashed, name } });
  }

  async linkGoogle(userId: string, googleId: string) {
    return prisma.user.update({ where: { id: userId }, data: { googleId } });
  }

  async findOrCreateGoogleUser(profile: any) {
    if (!profile.id) throw new Error("Google profile ID missing");

    const googleId: string = profile.id;
    const email: string = profile.emails[0].value;
    const name: string = profile.displayName;

    let user = await prisma.user.findFirst({ where: { googleId } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, googleId },
      });
    }
    return user;
  }
}
