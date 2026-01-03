import { Global, Module } from '@nestjs/common';

import { PasswordUtil } from './password.util';

@Global()
@Module({
  providers: [PasswordUtil],
  exports: [PasswordUtil],
})
export class UtilsModule {}
