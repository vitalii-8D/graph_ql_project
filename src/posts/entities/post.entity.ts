import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { OpenGraphMetadata } from '../../open-graph/entities/open-graph-metadata.entity';

@ObjectType()
@Entity('posts')
export class Post {
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
  @Column({ default: false })
  published: boolean;

  @Field(() => ID)
  @Column({ name: 'author_id' })
  authorId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Field(() => [Category], { nullable: true })
  @ManyToMany(() => Category, (category) => category.posts, { cascade: true, eager: true })
  @JoinTable()
  categories?: Category[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => OpenGraphMetadata, { nullable: true })
  @OneToOne(() => OpenGraphMetadata, (metadata) => metadata.post, { cascade: true, eager: true })
  openGraphMetadata?: OpenGraphMetadata;
}
