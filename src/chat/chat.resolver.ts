import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { CreateRoomInput } from './dto/create-room.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums';

@Resolver()
export class ChatResolver {
  constructor(private chatService: ChatService) {}

  @Mutation(() => ChatRoomEntity)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createChatRoom(@Args('createRoomInput') createRoomInput: CreateRoomInput): Promise<ChatRoomEntity> {
    return this.chatService.createRoom(createRoomInput);
  }

  @Query(() => [ChatRoomEntity])
  @UseGuards(GqlAuthGuard)
  async chatRooms(): Promise<ChatRoomEntity[]> {
    return this.chatService.getAllRooms();
  }

  @Query(() => ChatRoomEntity)
  @UseGuards(GqlAuthGuard)
  async chatRoom(@Args('id', { type: () => ID }) id: number): Promise<ChatRoomEntity> {
    return this.chatService.getRoom(id);
  }

  @Query(() => [ChatMessageEntity])
  @UseGuards(GqlAuthGuard)
  async chatRoomMessages(@Args('roomId', { type: () => ID }) roomId: number): Promise<ChatMessageEntity[]> {
    return this.chatService.getRoomMessages(roomId);
  }
}
