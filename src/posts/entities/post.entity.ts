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
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { OpenGraphMetadata } from '../../open-graph/entities/open-graph-metadata.entity';

@ObjectType()
@Entity()
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

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  author: User;

  @Field(() => [Category], { nullable: true })
  @ManyToMany(() => Category, (category) => category.posts, { cascade: true, eager: true })
  @JoinTable()
  categories?: Category[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => OpenGraphMetadata, { nullable: true })
  @OneToOne(() => OpenGraphMetadata, metadata => metadata.post, { cascade: true, eager: true })
  openGraphMetadata?: OpenGraphMetadata;
}
