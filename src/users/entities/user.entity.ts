import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';

import { PostEntity } from '../../posts/entities/post.entity';
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

  @Field(() => [PostEntity], { nullable: true })
  @OneToMany(() => PostEntity, (post) => post.author, { cascade: true })
  posts?: PostEntity[];

  @Field(() => UserAvatarEntity, { nullable: true })
  @OneToOne(() => UserAvatarEntity, (avatar) => avatar.user)
  avatar?: UserAvatarEntity;
}
