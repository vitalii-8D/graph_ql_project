import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatAttachmentEntity } from './entities/chat-attachment.entity';
import { ChatBroadcastService } from './chat-broadcast.service';
import { CreateRoomInput } from './dto/create-room.input';
import { SendMessageInput } from './dto/send-message.input';
import { UsersService } from '../users/services/users.service';
import { UserEntity } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { MAX_CHAT_ATTACHMENT_SIZE_BYTES } from '../storage/constants/common';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoomEntity)
    private chatRoomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(ChatMessageEntity)
    private chatMessageRepository: Repository<ChatMessageEntity>,
    @InjectRepository(ChatAttachmentEntity)
    private chatAttachmentRepository: Repository<ChatAttachmentEntity>,
    private usersService: UsersService,
    private storageService: StorageService,
    private chatBroadcastService: ChatBroadcastService,
  ) {}

  async createRoom(createRoomInput: CreateRoomInput): Promise<ChatRoomEntity> {
    const room = this.chatRoomRepository.create({ ...createRoomInput, participants: [] });

    return this.chatRoomRepository.save(room);
  }

  async getAllRooms(): Promise<ChatRoomEntity[]> {
    return this.chatRoomRepository.find({
      where: { isDirect: false },
      relations: ['participants'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDirectRoomsForUser(userId: number): Promise<ChatRoomEntity[]> {
    const rows: { roomId: number }[] = await this.chatRoomRepository.query(
      `SELECT "roomId" FROM chat_room_participants WHERE "userId" = $1`,
      [userId],
    );
    if (rows.length === 0) {
      return [];
    }

    return this.chatRoomRepository.find({
      where: { id: In(rows.map((row) => row.roomId)), isDirect: true },
      relations: ['participants'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOrCreateDirectRoom(currentUserId: number, otherUserId: number): Promise<ChatRoomEntity> {
    if (currentUserId === otherUserId) {
      throw new BadRequestException('Cannot start a direct message with yourself');
    }
    // Ensures the target exists (and surfaces a clean 404 otherwise) before touching chat_rooms.
    await this.usersService.findOne(otherUserId);

    const existing = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'p1', 'p1.id = :currentUserId', { currentUserId })
      .innerJoin('room.participants', 'p2', 'p2.id = :otherUserId', { otherUserId })
      .leftJoinAndSelect('room.participants', 'participants')
      .where('room.isDirect = true')
      .getOne();

    if (existing) {
      return existing;
    }

    const [a, b] = [currentUserId, otherUserId].sort((x, y) => x - y);
    const room = this.chatRoomRepository.create({
      name: `dm-${a}-${b}`,
      isDirect: true,
      participants: [{ id: currentUserId } as UserEntity, { id: otherUserId } as UserEntity],
    });

    const saved = await this.chatRoomRepository.save(room);

    return this.getRoom(saved.id);
  }

  async getRoom(id: number): Promise<ChatRoomEntity> {
    const room = await this.chatRoomRepository.findOne({
      where: { id },
      relations: ['participants'],
    });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  assertAccess(room: ChatRoomEntity, userId: number): void {
    if (room.isDirect && !room.participants.some((participant) => participant.id === userId)) {
      throw new ForbiddenException('You do not have access to this room');
    }
  }

  async getRoomForUser(id: number, userId: number): Promise<ChatRoomEntity> {
    const room = await this.getRoom(id);

    this.assertAccess(room, userId);

    return room;
  }

  async getRoomMessages(roomId: number, userId: number): Promise<ChatMessageEntity[]> {
    await this.getRoomForUser(roomId, userId);

    return this.chatMessageRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async saveMessage(userId: number, sendMessageInput: SendMessageInput): Promise<ChatMessageEntity> {
    const { roomId, message, attachments } = sendMessageInput;

    if (!message?.trim() && !attachments?.length) {
      throw new BadRequestException('A message must contain text or at least one attachment');
    }

    await this.getRoomForUser(roomId, userId);

    if (attachments?.length) {
      await Promise.all(
        attachments.map((attachment) =>
          this.storageService.verifyUploadedObject(attachment.key, attachment.mimeType, MAX_CHAT_ATTACHMENT_SIZE_BYTES),
        ),
      );
    }

    const chatMessage = this.chatMessageRepository.create({
      message: message ?? '',
      userId,
      roomId,
    });
    const saved = await this.chatMessageRepository.save(chatMessage);

    if (attachments?.length) {
      const attachmentEntities = attachments.map((attachment) =>
        this.chatAttachmentRepository.create({ ...attachment, messageId: saved.id }),
      );
      await this.chatAttachmentRepository.save(attachmentEntities);
    }

    return this.chatMessageRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['user', 'attachments'],
    });
  }

  async getAllRoomIds(): Promise<number[]> {
    const rooms = await this.chatRoomRepository.find({ where: { isDirect: false }, select: ['id'] });
    return rooms.map((room) => room.id);
  }

  /** Shared by ChatGateway and ChatSubscriptionsResolver so admin broadcast logic and its
   * cross-transport fan-out live in exactly one place, run in parallel across rooms. */
  async broadcastMessageToAllRooms(userId: number, message: string): Promise<ChatMessageEntity[]> {
    const roomIds = await this.getAllRoomIds();

    const savedMessages = await Promise.all(
      roomIds.map(async (roomId) => {
        const saved = await this.saveMessage(userId, { roomId, message });
        saved.isAdminBroadcast = true;
        return saved;
      }),
    );

    await Promise.all(savedMessages.map((saved) => this.chatBroadcastService.broadcastNewMessage(saved)));

    return savedMessages;
  }
}
