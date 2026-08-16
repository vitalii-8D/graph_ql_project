import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessageEntity } from './chat-message.entity';

@ObjectType()
@Entity('chat_attachments')
export class ChatAttachmentEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => ID)
  @Column({ name: 'message_id' })
  messageId: number;

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

  @Field(() => Int)
  @Column({ type: 'int', name: 'size_bytes' })
  sizeBytes: number;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatMessageEntity, (message) => message.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: ChatMessageEntity;
}
