import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { PostEntity } from '../../posts/entities/post.entity';

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

  @Field(() => [PostEntity], { nullable: true })
  @OneToMany(() => PostEntity, (post) => post.author, { cascade: true })
  posts?: PostEntity[];
}
