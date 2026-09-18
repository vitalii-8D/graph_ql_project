import { Inject, Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import type { PubSub } from 'graphql-subscriptions';

import { CHAT_MESSAGE_ADDED_TOPIC, CHAT_PUB_SUB } from './chat-pub-sub.provider';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatSocketEvent } from './enums/chat-socket-event.enum';

interface ChatMessageAddedPayload {
  roomId: number;
  message: ChatMessageEntity;
}

/**
 * Single fan-out point for a newly-saved chat message, called by both `ChatGateway` (Socket.IO)
 * and `ChatSubscriptionsResolver` (GraphQL subscriptions) — without this, a message sent on one
 * transport was invisible in real time to a client connected only on the other.
 */
@Injectable()
export class ChatBroadcastService {
  private socketServer?: Server;

  constructor(@Inject(CHAT_PUB_SUB) private readonly pubSub: PubSub) {}

  /** Called once by ChatGateway.afterInit — the only place the Socket.IO server instance exists. */
  registerSocketServer(server: Server): void {
    this.socketServer = server;
  }

  async broadcastNewMessage(message: ChatMessageEntity): Promise<void> {
    this.socketServer?.to(`room-${message.roomId}`).emit(ChatSocketEvent.NewMessage, this.serializeMessage(message));

    await this.pubSub.publish(CHAT_MESSAGE_ADDED_TOPIC, {
      roomId: message.roomId,
      message,
    } satisfies ChatMessageAddedPayload);
  }

  serializeMessage(message: ChatMessageEntity) {
    return {
      id: String(message.id),
      message: message.message,
      userId: String(message.userId),
      user: {
        id: String(message.user.id),
        name: message.user.name,
        email: message.user.email,
      },
      roomId: String(message.roomId),
      createdAt: message.createdAt,
      isAdminBroadcast: message.isAdminBroadcast,
      attachments: (message.attachments ?? []).map((attachment) => ({
        id: String(attachment.id),
        key: attachment.key,
        url: attachment.url,
        originalFileName: attachment.originalFileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      })),
    };
  }
}
