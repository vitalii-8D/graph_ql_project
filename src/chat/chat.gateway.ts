import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { createLogger } from '../utils/logger';
import { ChatService } from './chat.service';
import { ChatBroadcastService } from './chat-broadcast.service';
import { ChatPresenceTrackerService } from './chat-presence-tracker.service';
import { SendMessageInput } from './dto/send-message.input';
import { RoomIdInput } from './dto/room-id.input';
import { AdminBroadcastInput } from './dto/admin-broadcast.input';
import { ChatSocketEvent } from './enums/chat-socket-event.enum';
import type { AuthenticatedSocket } from './types/common';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../users/enums';
import { UsersService } from '../users/services/users.service';

type UserId = number;
type SocketId = string;

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = createLogger(ChatGateway.name);

  // userId -> set of socket ids, across all rooms - lets us only flip a user to
  // offline once their *last* open socket (tab/device) disconnects.
  private readonly userConnections = new Map<UserId, Set<SocketId>>();

  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private chatBroadcastService: ChatBroadcastService,
    private authService: AuthService,
    private usersService: UsersService,
    private presenceTracker: ChatPresenceTrackerService,
  ) {}

  afterInit(server: Server) {
    this.chatBroadcastService.registerSocketServer(server);

    // Auth runs as connection middleware (not handleConnection) so client.data.user
    // is populated *before* the connection is accepted and 'connect' fires client-side.
    // Otherwise a message emitted right after 'connect' (e.g. the FE's immediate
    // joinRoom) can race this async lookup and hit an unset client.data.user.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    server.use(async (client: AuthenticatedSocket, next: (err?: Error) => void) => {
      try {
        const token = this.extractTokenFromHandshake(client);
        if (!token) {
          this.logger.error({ msg: 'Socket handshake rejected: missing bearer token', socketId: client.id });
          next(new Error('Unauthorized'));
          return;
        }

        const user = await this.authService.verifyAccessToken(token);

        client.data.user = user;
        this.logger.debug({ msg: 'Socket handshake authenticated', socketId: client.id, userId: user.id });
        next();
      } catch (err) {
        this.logger.error(err);
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.info({ msg: 'Client connected', socketId: client.id, email: client.data.user?.email });

    // 'disconnecting' fires before Socket.IO removes the socket from its rooms
    // (unlike 'disconnect'/handleDisconnect below, where client.rooms is already empty),
    // so it's the only place we can still see which rooms to notify on any disconnect
    // path - tab close, refresh, or hard navigation, not just an explicit leaveRoom emit.
    client.on('disconnecting', () => {
      this.handleRoomDisconnect(client);
    });

    const user = client.data.user;
    if (user) {
      this.trackUserConnect(user.id, client.id);
      void this.usersService.setOnlineStatus(user.id, true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.info({ msg: 'Client disconnected', socketId: client.id });

    const user = client.data.user;
    if (user && this.wasLastSocketForUser(user.id, client.id)) {
      void this.usersService.setOnlineStatus(user.id, false);
    }
  }

  // Returns true only when this was the user's last open socket across all
  // tabs/devices, so closing one of several tabs doesn't flip them offline.
  private trackUserConnect(userId: number, socketId: string): void {
    let sockets = this.userConnections.get(userId);
    if (!sockets) {
      sockets = new Set();
      this.userConnections.set(userId, sockets);
    }
    sockets.add(socketId);
  }

  private wasLastSocketForUser(userId: number, socketId: string): boolean {
    const sockets = this.userConnections.get(userId);
    if (!sockets) {
      return true;
    }

    sockets.delete(socketId);
    if (sockets.size > 0) {
      return false;
    }

    this.userConnections.delete(userId);
    return true;
  }

  private handleRoomDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (!user) {
      return;
    }

    for (const roomName of client.rooms) {
      if (!roomName.startsWith('room-')) {
        continue;
      }

      const roomId = Number(roomName.slice('room-'.length));
      const userFullyLeft = this.presenceTracker.trackLeave(roomId, user.id, client.id);
      if (userFullyLeft) {
        client.to(roomName).emit(ChatSocketEvent.UserLeft, {
          userId: String(user.id),
          userName: user.name,
          roomId: String(roomId),
        });
      }
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    const authorizationHeader = client.handshake.headers.authorization;

    return this.authService.extractTokenFromAuthorizationHeader(authorizationHeader);
  }

  private emitError(client: AuthenticatedSocket, event: ChatSocketEvent, err: unknown): void {
    this.logger.error(err);
    const error = err as Error;
    client.emit(ChatSocketEvent.Error, { message: error.message, event });
  }

  @SubscribeMessage(ChatSocketEvent.JoinRoom)
  async handleJoinRoom(@MessageBody() data: RoomIdInput, @ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.debug({ msg: 'joinRoom received', roomId: data.roomId, userId: client.data.user.id });

    try {
      const room = await this.chatService.getRoomForUser(data.roomId, client.data.user.id);
      const roomName = `room-${data.roomId}`;

      await client.join(roomName);

      const roomMessages = await this.chatService.getRoomMessages(data.roomId, client.data.user.id);
      const messages = roomMessages.map((roomMessage) => this.chatBroadcastService.serializeMessage(roomMessage));

      // Send confirmation with callback
      client.emit(ChatSocketEvent.JoinedRoom, {
        room,
        messages,
        success: true,
      });

      // Notify other users in the room, unless this user already has another
      // socket (tab) open in the room - avoids a duplicate "joined" per tab.
      const isFirstSocketForUser = this.presenceTracker.trackJoin(data.roomId, client.data.user.id, client.id);
      if (isFirstSocketForUser) {
        client.to(roomName).emit(ChatSocketEvent.UserJoined, {
          userId: String(client.data.user.id),
          userName: client.data.user.name,
          roomId: String(data.roomId),
        });
      }

      this.logger.info({ msg: 'User joined room', email: client.data.user.email, roomId: data.roomId });
    } catch (err) {
      this.emitError(client, ChatSocketEvent.JoinRoom, err);
    }
  }

  @SubscribeMessage(ChatSocketEvent.LeaveRoom)
  async handleLeaveRoom(@MessageBody() data: RoomIdInput, @ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.debug({ msg: 'leaveRoom received', roomId: data.roomId, userId: client.data.user.id });

    try {
      const roomName = `room-${data.roomId}`;
      await client.leave(roomName);

      // Only notify others once this was the user's last open socket in the room -
      // avoids a premature "left" broadcast while another tab is still connected.
      const userFullyLeft = this.presenceTracker.trackLeave(data.roomId, client.data.user.id, client.id);
      if (userFullyLeft) {
        client.to(roomName).emit(ChatSocketEvent.UserLeft, {
          userId: String(client.data.user.id),
          userName: client.data.user.name,
          roomId: String(data.roomId),
        });
      }

      client.emit(ChatSocketEvent.LeftRoom, {
        roomId: String(data.roomId),
        success: true,
      });

      this.logger.info({ msg: 'User left room', email: client.data.user.email, roomId: data.roomId });
    } catch (err) {
      this.emitError(client, ChatSocketEvent.LeaveRoom, err);
    }
  }

  @SubscribeMessage(ChatSocketEvent.SendMessage)
  async handleMessage(
    @MessageBody() sendMessageInput: SendMessageInput,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.debug({ msg: 'sendMessage received', roomId: sendMessageInput.roomId, userId: client.data.user.id });

    try {
      const userId = client.data.user.id;

      const savedMessage = await this.chatService.saveMessage(userId, sendMessageInput);

      // Broadcasts to both this Socket.IO room and the GraphQL-subscription transport.
      await this.chatBroadcastService.broadcastNewMessage(savedMessage);

      client.emit(ChatSocketEvent.MessageSent, {
        success: true,
        messageId: savedMessage.id,
      });

      this.logger.info({
        msg: 'Message sent',
        email: client.data.user.email,
        roomId: sendMessageInput.roomId,
        messageId: savedMessage.id,
      });
    } catch (err) {
      this.emitError(client, ChatSocketEvent.SendMessage, err);
    }
  }

  @SubscribeMessage(ChatSocketEvent.AdminBroadcast)
  async handleAdminBroadcast(@MessageBody() data: AdminBroadcastInput, @ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.debug({ msg: 'adminBroadcast received', userId: client.data.user.id });

    try {
      const user = client.data.user;

      if (user.role !== UserRole.ADMIN) {
        this.logger.error({ msg: 'Unauthorized adminBroadcast attempt', userId: user.id, role: user.role });
        client.emit(ChatSocketEvent.Error, {
          message: 'Only admins can broadcast to all rooms',
          event: ChatSocketEvent.AdminBroadcast,
        });
        return;
      }

      const savedMessages = await this.chatService.broadcastMessageToAllRooms(user.id, data.message);

      client.emit(ChatSocketEvent.BroadcastSent, {
        success: true,
        roomCount: savedMessages.length,
        messageIds: savedMessages.map((m) => m.id),
      });

      this.logger.info({ msg: 'Admin broadcast sent', email: user.email, roomCount: savedMessages.length });
    } catch (err) {
      this.emitError(client, ChatSocketEvent.AdminBroadcast, err);
    }
  }
}
