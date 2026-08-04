import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, CreateDateColumn } from 'typeorm';

import { PostEntity } from '../../posts/entities/post.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { UserAvatarEntity } from '../../user-avatars/entities/user-avatar.entity';
import { UserRole } from '../enums';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role',
});

@ObjectType()
@Entity('users')
export class UserEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  name: string;

  @Column()
  password: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  age?: number;

  @Field(() => UserRole)
  @Column({
    type: 'text',
    default: UserRole.USER,
  })
  role: UserRole;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city?: string;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', name: 'latitude', nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', name: 'longitude', nullable: true })
  longitude?: number;

  @Field({ nullable: true })
  @Column({ name: 'last_active_at', nullable: true })
  lastActiveAt?: Date;

  @Field()
  @Column({ name: 'is_online', default: false })
  isOnline: boolean;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => [PostEntity], { nullable: true })
  @OneToMany(() => PostEntity, (post) => post.author, { cascade: true })
  posts?: PostEntity[];

  @Field(() => [CommentEntity], { nullable: true })
  @OneToMany(() => CommentEntity, (comment) => comment.author)
  comments?: CommentEntity[];

  @Field(() => UserAvatarEntity, { nullable: true })
  @OneToOne(() => UserAvatarEntity, (avatar) => avatar.user)
  avatar?: UserAvatarEntity;
}
