import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ChatRoomEntity } from './chat-room.entity';
import { ChatAttachmentEntity } from './chat-attachment.entity';

@ObjectType()
@Entity('chat_messages')
export class ChatMessageEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column('text')
  message: string;

  @Field(() => ID)
  @Column()
  userId: number;

  @Field(() => UserEntity)
  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Field(() => ID)
  @Column()
  roomId: number;

  @Field(() => ChatRoomEntity)
  @ManyToOne(() => ChatRoomEntity, (room) => room.messages)
  @JoinColumn({ name: 'roomId' })
  room: ChatRoomEntity;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => [ChatAttachmentEntity])
  @OneToMany(() => ChatAttachmentEntity, (attachment) => attachment.message, { eager: true })
  attachments: ChatAttachmentEntity[];
}
