import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';

import { Profile } from '../../profiles/entities/profile.entity';
import { Post } from '../../posts/entities/post.entity';

@ObjectType()
@Entity()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  age?: number;

  @Field(() => Profile, { nullable: true })
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true, eager: true })
  profile?: Profile;

  @Field(() => [Post], { nullable: true })
  @OneToMany(() => Post, (post) => post.author, { cascade: true })
  posts?: Post[];
}
