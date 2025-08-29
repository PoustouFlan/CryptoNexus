import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${BACKEND_URL}/auth/google/callback`,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(req: Request, accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const user = await this.authService.findOrCreateGoogleUser(profile);
    done(null, user);
  }
}
