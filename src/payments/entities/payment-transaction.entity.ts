import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { PaymentTransactionStatus } from '../enums';

registerEnumType(PaymentTransactionStatus, {
  name: 'PaymentTransactionStatus',
  description: 'Payment transaction lifecycle status',
});

@ObjectType()
@Entity('payment_transactions')
export class PaymentTransactionEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => ID)
  @Column({ name: 'user_id' })
  userId: number;

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Field(() => ID)
  @Column({ name: 'post_id' })
  postId: number;

  @Field(() => PostEntity)
  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  @Field({ nullable: true })
  @Column({ name: 'stripe_checkout_session_id', nullable: true })
  stripeCheckoutSessionId?: string;

  // Stripe defers creating the PaymentIntent for a Checkout Session until the customer actually
  // completes the checkout page — it's unknown (and this column is null) at session-creation
  // time, and gets backfilled once Stripe tells us it exists (see PaymentsService).
  @Field(() => String, { nullable: true })
  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', unique: true, nullable: true })
  stripePaymentIntentId?: string | null;

  @Field({ nullable: true })
  @Column({ name: 'stripe_refund_id', nullable: true })
  stripeRefundId?: string;

  @Field(() => Int)
  @Column('int')
  amount: number;

  @Field()
  @Column({ default: 'usd' })
  currency: string;

  @Field(() => PaymentTransactionStatus)
  @Column({
    type: 'text',
    default: PaymentTransactionStatus.PENDING,
  })
  status: PaymentTransactionStatus;

  @Field(() => String, { nullable: true })
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string | null;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt?: Date | null;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
