import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/services/users.service';
import { PasswordUtil } from '../utils/password.util';
import { config } from '../constants/config';
import type { JwtPayload, AuthenticatedUser } from './types/common';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private passwordUtil: PasswordUtil,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.passwordUtil.validatePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;

    return result;
  }

  login(user: AuthenticatedUser) {
    const payload: JwtPayload = { email: user.email, id: +user.id };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async validatePayload(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByIdPlain(payload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    const { password: _, ...result } = user;

    return result;
  }

  // Used to authenticate the `graphql-ws` handshake for GraphQL subscriptions (chat V2), which -
  // unlike an HTTP request - never goes through JwtStrategy/passport, so the token has to be
  // verified explicitly here instead. Mirrors the check ChatGateway does for the Socket.IO handshake.
  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    const payload = this.jwtService.verify<JwtPayload>(token, { secret: config.auth.jwtSecret });

    return this.validatePayload(payload);
  }

  extractTokenFromAuthorizationHeader(authorizationHeader?: unknown): string | null {
    if (typeof authorizationHeader !== 'string') {
      return null;
    }

    const [type, token] = authorizationHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
