import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import { config } from '../constants/config';

@Injectable()
export class PasswordUtil {
  private readonly memoryCost = 2 ** 16;
  private readonly timeCost = 3;

  async hash(password: string): Promise<string> {
    return argon2.hash(password + config.auth.passwordSecret, {
      type: argon2.argon2id,
      memoryCost: this.memoryCost,
      timeCost: this.timeCost,
    });
  }

  /**
   * Validates a plain-text password against a stored hash
   */
  async validatePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password + config.auth.passwordSecret);
    } catch (error) {
      return false;
    }
  }
}
