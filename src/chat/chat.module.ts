import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoomEntity, ChatMessageEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'default-secret',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
  ],
  providers: [ChatGateway, ChatService, ChatResolver],
  exports: [ChatService],
})
export class ChatModule {}
