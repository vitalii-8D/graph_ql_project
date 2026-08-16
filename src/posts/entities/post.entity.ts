import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { OpenGraphMetadataEntity } from '../../open-graph/entities/open-graph-metadata.entity';
import { PostImageEntity } from '../../post-images/entities/post-image.entity';
import { PostStatus, PostPaymentStatus } from '../enums';

registerEnumType(PostStatus, {
  name: 'PostStatus',
  description: 'Post lifecycle status',
});

registerEnumType(PostPaymentStatus, {
  name: 'PostPaymentStatus',
  description: 'Payment gate status for publishing a post',
});

@ObjectType()
@Entity('posts')
export class PostEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column('text')
  content: string;

  @Field()
  @Column()
  slug: string;

  @Field(() => PostStatus)
  @Column({
    type: 'text',
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @Field(() => Int)
  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Field(() => Int)
  @Column({ name: 'reading_time_minutes', default: 1 })
  readingTimeMinutes: number;

  @Field(() => Int)
  @Column({ name: 'comment_count', default: 0 })
  commentCount: number;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'average_rating', type: 'float', nullable: true })
  averageRating?: number | null;

  @Field()
  @Column({ name: 'has_been_published', default: false })
  hasBeenPublished: boolean;

  @Field(() => PostPaymentStatus)
  @Column({
    name: 'payment_status',
    type: 'text',
    default: PostPaymentStatus.NOT_REQUIRED,
  })
  paymentStatus: PostPaymentStatus;

  @Field(() => ID)
  @Column({ name: 'author_id' })
  authorId: number;

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;

  @Field(() => [CategoryEntity], { nullable: true })
  @ManyToMany(() => CategoryEntity, (category) => category.posts, { cascade: true })
  @JoinTable()
  categories?: CategoryEntity[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => OpenGraphMetadataEntity, { nullable: true })
  @OneToOne(() => OpenGraphMetadataEntity, (metadata) => metadata.post, { cascade: true })
  openGraphMetadata?: OpenGraphMetadataEntity;

  @Field(() => PostImageEntity, { nullable: true })
  @OneToOne(() => PostImageEntity, (image) => image.post)
  postImage?: PostImageEntity;

  @Field(() => [CommentEntity], { nullable: true })
  @OneToMany(() => CommentEntity, (comment) => comment.post)
  comments?: CommentEntity[];
}
