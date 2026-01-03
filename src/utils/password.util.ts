import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordUtil {
  private readonly memoryCost = 2 ** 16;
  private readonly timeCost = 3;

  constructor(private readonly configService: ConfigService) {}

  async hash(password: string): Promise<string> {
    const pepper = this.configService.get<string>('PASSWORD_SECRET');

    if (!pepper) {
      throw new InternalServerErrorException('Password secret is not defined in environment variables');
    }

    return argon2.hash(password + pepper, {
      type: argon2.argon2id,
      memoryCost: this.memoryCost,
      timeCost: this.timeCost,
    });
  }

  /**
   * Validates a plain-text password against a stored hash
   */
  async validatePassword(password: string, hash: string): Promise<boolean> {
    const pepper = this.configService.get<string>('PASSWORD_SECRET');

    try {
      return await argon2.verify(hash, password + pepper);
    } catch (error) {
      return false;
    }
  }
}
