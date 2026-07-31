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

import { UserEntity } from '../../users/entities/user.entity';

@ObjectType()
@Entity('user_avatars')
export class UserAvatarEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => ID)
  @Column({ name: 'user_id' })
  userId: number;

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

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => UserEntity, (user) => user.avatar, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
