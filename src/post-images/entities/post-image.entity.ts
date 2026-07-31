import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PostEntity } from '../../posts/entities/post.entity';

@ObjectType()
@Entity('post_images')
export class PostImageEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => ID)
  @Column({ name: 'post_id' })
  postId: number;

  @Field()
  @Column()
  key: string;

  @Field()
  @Column()
  url: string;

  @Field()
  @Column({ name: 'original_file_name' })
  originalFileName: string;

  @Field()
  @Column({ name: 'mime_type' })
  mimeType: string;

  @Field()
  @Column({ type: 'int', name: 'size_bytes' })
  sizeBytes: number;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'alt_text' })
  altText?: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => PostEntity, (post) => post.postImage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;
}
