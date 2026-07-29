import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ChatMessageEntity } from './chat-message.entity';

@ObjectType()
@Entity('chat_rooms')
export class ChatRoomEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column({ default: false })
  isDirect: boolean;

  @Field(() => [UserEntity])
  @ManyToMany(() => UserEntity)
  @JoinTable({
    name: 'chat_room_participants',
    joinColumn: { name: 'roomId' },
    inverseJoinColumn: { name: 'userId' },
  })
  participants: UserEntity[];

  @Field(() => [ChatMessageEntity])
  @OneToMany(() => ChatMessageEntity, (message) => message.room)
  messages: ChatMessageEntity[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
