import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { PasswordUtil } from '../utils/password.util';
import type { JwtPayload, AuthenticatedUser } from './types';

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
      access_token: this.jwtService.sign(payload),
      user: {
        id: +user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validatePayload(payload: JwtPayload): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByIdPlain(payload.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    const { password: _, ...result } = user;

    return result;
  }
}
