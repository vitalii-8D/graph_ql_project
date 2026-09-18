import { Resolver, Mutation, Subscription, Args, ID } from '@nestjs/graphql';
import { Inject, UseGuards } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';
import { randomUUID } from 'crypto';

import { ChatService } from './chat.service';
import { ChatBroadcastService } from './chat-broadcast.service';
import { ChatPresenceTrackerService } from './chat-presence-tracker.service';
import { CHAT_MESSAGE_ADDED_TOPIC, CHAT_PUB_SUB, CHAT_ROOM_PRESENCE_TOPIC } from './chat-pub-sub.provider';
import { withAsyncIteratorCleanup } from './utils/async-iterator-cleanup.util';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { SendMessageInput } from './dto/send-message.input';
import { ChatPresenceEvent } from './dto/chat-presence-event.type';
import { ChatPresenceEventType } from './enums/chat-presence-event-type.enum';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums';
import { UserEntity } from '../users/entities/user.entity';

interface ChatMessageAddedPayload {
  roomId: number;
  message: ChatMessageEntity;
}

interface ChatRoomPresencePayload {
  roomId: number;
  event: ChatPresenceEvent;
}

@Resolver()
export class ChatSubscriptionsResolver {
  constructor(
    private chatService: ChatService,
    private chatBroadcastService: ChatBroadcastService,
    private presenceTracker: ChatPresenceTrackerService,
    @Inject(CHAT_PUB_SUB) private pubSub: PubSub,
  ) {}

  @Mutation(() => ChatMessageEntity)
  @UseGuards(GqlAuthGuard)
  async sendChatMessage(
    @Args('sendMessageInput') sendMessageInput: SendMessageInput,
    @CurrentUser() user: UserEntity,
  ): Promise<ChatMessageEntity> {
    const savedMessage = await this.chatService.saveMessage(user.id, sendMessageInput);

    await this.chatBroadcastService.broadcastNewMessage(savedMessage);

    return savedMessage;
  }

  @Mutation(() => [ChatMessageEntity])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminBroadcastChat(
    @Args('message') message: string,
    @CurrentUser() user: UserEntity,
  ): Promise<ChatMessageEntity[]> {
    return this.chatService.broadcastMessageToAllRooms(user.id, message);
  }

  @Subscription(() => ChatMessageEntity, {
    filter: (payload: ChatMessageAddedPayload, variables: { roomId: string }) =>
      payload.roomId === Number(variables.roomId),
    resolve: (payload: ChatMessageAddedPayload) => payload.message,
  })
  @UseGuards(GqlAuthGuard)
  async chatMessageAdded(@Args('roomId', { type: () => ID }) roomId: number, @CurrentUser() user: UserEntity) {
    // The ID scalar always arrives as a string at runtime (regardless of the `number` param
    // type), so it's coerced up front - the filter above compares it against a genuine number.
    const numericRoomId = Number(roomId);

    // Access check happens once, at subscribe time - same guarantee ChatGateway's joinRoom gives
    // before it lets a socket join the room.
    await this.chatService.getRoomForUser(numericRoomId, user.id);

    return this.pubSub.asyncIterableIterator<ChatMessageAddedPayload>(CHAT_MESSAGE_ADDED_TOPIC);
  }

  @Subscription(() => ChatPresenceEvent, {
    filter: (payload: ChatRoomPresencePayload, variables: { roomId: string }) =>
      payload.roomId === Number(variables.roomId),
    resolve: (payload: ChatRoomPresencePayload) => payload.event,
  })
  @UseGuards(GqlAuthGuard)
  async chatRoomPresence(@Args('roomId', { type: () => ID }) roomId: number, @CurrentUser() user: UserEntity) {
    const numericRoomId = Number(roomId);

    await this.chatService.getRoomForUser(numericRoomId, user.id);

    // One id per subscription attempt (not per user) - lets the same user have this subscription
    // open from several tabs without one tab's unmount broadcasting a "left" for all of them.
    const sessionId = randomUUID();
    const isFirstSessionForUser = this.presenceTracker.trackJoin(numericRoomId, user.id, sessionId);
    if (isFirstSessionForUser) {
      await this.publishPresenceEvent(numericRoomId, ChatPresenceEventType.JOINED, user);
    }

    const source = this.pubSub.asyncIterableIterator<ChatRoomPresencePayload>(CHAT_ROOM_PRESENCE_TOPIC);

    return withAsyncIteratorCleanup(source, async () => {
      const wasLastSessionForUser = this.presenceTracker.trackLeave(numericRoomId, user.id, sessionId);
      if (wasLastSessionForUser) {
        await this.publishPresenceEvent(numericRoomId, ChatPresenceEventType.LEFT, user);
      }
    });
  }

  private async publishPresenceEvent(roomId: number, type: ChatPresenceEventType, user: UserEntity): Promise<void> {
    const event: ChatPresenceEvent = {
      type,
      roomId: String(roomId),
      userId: String(user.id),
      userName: user.name,
    };

    await this.pubSub.publish(CHAT_ROOM_PRESENCE_TOPIC, { roomId, event } satisfies ChatRoomPresencePayload);
  }
}
