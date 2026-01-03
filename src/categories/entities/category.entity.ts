import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

import { PostEntity } from '../../posts/entities/post.entity';

@ObjectType()
@Entity('categories')
export class CategoryEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field(() => [PostEntity], { nullable: true })
  @ManyToMany(() => PostEntity, (post) => post.categories)
  posts?: PostEntity[];
}
