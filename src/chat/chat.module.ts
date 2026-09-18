import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatBroadcastService } from './chat-broadcast.service';
import { ChatResolver } from './chat.resolver';
import { ChatSubscriptionsResolver } from './chat-subscriptions.resolver';
import { ChatPresenceTrackerService } from './chat-presence-tracker.service';
import { chatPubSubProvider } from './chat-pub-sub.provider';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatAttachmentEntity } from './entities/chat-attachment.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoomEntity, ChatMessageEntity, ChatAttachmentEntity]),
    UsersModule,
    AuthModule,
    StorageModule,
  ],
  providers: [
    ChatGateway,
    ChatService,
    ChatBroadcastService,
    ChatResolver,
    ChatSubscriptionsResolver,
    ChatPresenceTrackerService,
    chatPubSubProvider,
  ],
  exports: [ChatService],
})
export class ChatModule {}
