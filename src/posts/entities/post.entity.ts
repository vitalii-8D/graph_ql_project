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

import { UserEntity } from '../../users/entities/user.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { OpenGraphMetadataEntity } from '../../open-graph/entities/open-graph-metadata.entity';
import { PostImageEntity } from '../../post-images/entities/post-image.entity';

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

  @Field()
  @Column({ default: false })
  published: boolean;

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
}
