import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostEntity } from '../posts/entities/post.entity';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsService } from './payments.service';
import { StripeService } from './services/stripe.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransactionEntity, PostEntity]), PostsModule, UsersModule],
  controllers: [PaymentsController],
  providers: [PaymentsResolver, PaymentsService, StripeService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
