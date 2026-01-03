import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageInput } from './dto/send-message.input';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const secret =
        this.configService.get<string>('JWT_SECRET') || 'default-secret';
      const payload = this.jwtService.verify(token, { secret });

      const user = await this.usersService.findOne(payload.id);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      console.log(`Client connected: ${client.id}, User: ${user.email}`);
    } catch (error) {
      console.error('Connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.chatService.getRoom(data.roomId);
      const roomName = `room-${data.roomId}`;

      await client.join(roomName);

      // Send room history to the joining user
      const messages = await this.chatService.getRoomMessages(data.roomId);

      // Send confirmation with callback
      client.emit('joinedRoom', {
        room,
        messages,
        success: true,
      });

      // Notify other users in the room
      client.to(roomName).emit('userJoined', {
        userId: client.data.user.id,
        userName: client.data.user.name,
        roomId: data.roomId,
      });

      console.log(
        `User ${client.data.user.email} joined room ${data.roomId}`,
      );
    } catch (error) {
      client.emit('error', {
        message: error.message,
        event: 'joinRoom',
      });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `room-${data.roomId}`;
    await client.leave(roomName);

    // Notify other users in the room
    client.to(roomName).emit('userLeft', {
      userId: client.data.user.id,
      userName: client.data.user.name,
      roomId: data.roomId,
    });

    client.emit('leftRoom', {
      roomId: data.roomId,
      success: true,
    });

    console.log(`User ${client.data.user.email} left room ${data.roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() sendMessageInput: SendMessageInput,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.user.id;

      // Save message to database
      const savedMessage = await this.chatService.saveMessage(
        userId,
        sendMessageInput,
      );

      const roomName = `room-${sendMessageInput.roomId}`;

      // Broadcast message to all users in the room (including sender)
      this.server.to(roomName).emit('newMessage', {
        id: savedMessage.id,
        message: savedMessage.message,
        userId: savedMessage.userId,
        user: {
          id: savedMessage.user.id,
          name: savedMessage.user.name,
          email: savedMessage.user.email,
        },
        roomId: savedMessage.roomId,
        createdAt: savedMessage.createdAt,
      });

      // Send acknowledgment callback
      client.emit('messageSent', {
        success: true,
        messageId: savedMessage.id,
      });

      console.log(
        `Message sent by ${client.data.user.email} in room ${sendMessageInput.roomId}`,
      );
    } catch (error) {
      client.emit('error', {
        message: error.message,
        event: 'sendMessage',
      });
    }
  }

  @SubscribeMessage('adminBroadcast')
  async handleAdminBroadcast(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;

      // Check if user is admin
      if (user.role !== UserRole.ADMIN) {
        client.emit('error', {
          message: 'Only admins can broadcast to all rooms',
          event: 'adminBroadcast',
        });
        return;
      }

      // Get all room IDs
      const roomIds = await this.chatService.getAllRoomIds();

      // Save message to all rooms and broadcast
      const savedMessages: ChatMessageEntity[] = [];
      for (const roomId of roomIds) {
        const savedMessage = await this.chatService.saveMessage(user.id, {
          roomId,
          message: data.message,
        });
        savedMessages.push(savedMessage);

        const roomName = `room-${roomId}`;
        this.server.to(roomName).emit('newMessage', {
          id: savedMessage.id,
          message: savedMessage.message,
          userId: savedMessage.userId,
          user: {
            id: savedMessage.user.id,
            name: savedMessage.user.name,
            email: savedMessage.user.email,
          },
          roomId: savedMessage.roomId,
          createdAt: savedMessage.createdAt,
          isAdminBroadcast: true,
        });
      }

      client.emit('broadcastSent', {
        success: true,
        roomCount: roomIds.length,
        messageIds: savedMessages.map((m) => m.id),
      });

      console.log(
        `Admin ${user.email} broadcasted to ${roomIds.length} rooms`,
      );
    } catch (error) {
      client.emit('error', {
        message: error.message,
        event: 'adminBroadcast',
      });
    }
  }
}
