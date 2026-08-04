import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';

import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from '../users/users.module';
import { UtilsModule } from '../utils/utils.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { config } from '../constants/config';

@Module({
  imports: [
    UsersModule,
    UtilsModule,
    PassportModule,
    JwtModule.register({
      secret: config.auth.jwtSecret,
      signOptions: {
        expiresIn: config.auth.jwtExpire as StringValue,
      },
    } satisfies JwtModuleOptions),
  ],
  providers: [JwtStrategy, AuthService, AuthResolver],
  exports: [AuthService],
})
export class AuthModule {}
