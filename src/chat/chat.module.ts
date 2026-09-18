import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { ChatSubscriptionsResolver } from './chat-subscriptions.resolver';
import { ChatPresenceTrackerService } from './chat-presence-tracker.service';
import { chatPubSubProvider } from './chat-pub-sub.provider';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatAttachmentEntity } from './entities/chat-attachment.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { config } from '../constants/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoomEntity, ChatMessageEntity, ChatAttachmentEntity]),
    JwtModule.register({
      secret: config.auth.jwtSecret,
    }),
    UsersModule,
    AuthModule,
  ],
  providers: [
    ChatGateway,
    ChatService,
    ChatResolver,
    ChatSubscriptionsResolver,
    ChatPresenceTrackerService,
    chatPubSubProvider,
  ],
  exports: [ChatService],
})
export class ChatModule {}
