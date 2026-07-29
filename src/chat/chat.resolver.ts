import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { CreateRoomInput } from './dto/create-room.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums';
import { UserEntity } from '../users/entities/user.entity';

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

  @Query(() => [ChatRoomEntity])
  @UseGuards(GqlAuthGuard)
  async myDirectMessageRooms(@CurrentUser() user: UserEntity): Promise<ChatRoomEntity[]> {
    return this.chatService.getDirectRoomsForUser(user.id);
  }

  @Query(() => ChatRoomEntity)
  @UseGuards(GqlAuthGuard)
  async chatRoom(@Args('id', { type: () => ID }) id: number, @CurrentUser() user: UserEntity): Promise<ChatRoomEntity> {
    return this.chatService.getRoomForUser(id, user.id);
  }

  @Query(() => [ChatMessageEntity])
  @UseGuards(GqlAuthGuard)
  async chatRoomMessages(
    @Args('roomId', { type: () => ID }) roomId: number,
    @CurrentUser() user: UserEntity,
  ): Promise<ChatMessageEntity[]> {
    return this.chatService.getRoomMessages(roomId, user.id);
  }

  @Mutation(() => ChatRoomEntity)
  @UseGuards(GqlAuthGuard)
  async startDirectMessage(
    @Args('userId', { type: () => ID }) userId: number,
    @CurrentUser() user: UserEntity,
  ): Promise<ChatRoomEntity> {
    return this.chatService.findOrCreateDirectRoom(user.id, userId);
  }
}
