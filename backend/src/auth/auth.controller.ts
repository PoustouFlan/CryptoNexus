import { Controller, Post, Body, Req, UseGuards, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local.guard';
import { JwtAuthGuard } from './jwt.guard';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name?: string }) {
    const user = await this.authService.register(body.email, body.password, body.name);
    return { id: user.id, email: user.email, name: user.name };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request) {
    if (!req.user)
      throw Error("Expected user in request");
    const token = await this.authService.login(req.user);
    const { id, email, name } = req.user;
    return {
      access_token: token.access_token,
      user: { id, email, name },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // redirects automatically
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    const token = (await this.authService.login(user)).access_token;
    return res.redirect(`https://cryptonex.us/login?token=${token}`);
  }
}
