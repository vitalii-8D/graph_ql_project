import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoomEntity } from './entities/chat-room.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { CreateRoomInput } from './dto/create-room.input';
import { SendMessageInput } from './dto/send-message.input';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoomEntity)
    private chatRoomRepository: Repository<ChatRoomEntity>,
    @InjectRepository(ChatMessageEntity)
    private chatMessageRepository: Repository<ChatMessageEntity>,
  ) {}

  async createRoom(createRoomInput: CreateRoomInput): Promise<ChatRoomEntity> {
    const room = this.chatRoomRepository.create(createRoomInput);
    return this.chatRoomRepository.save(room);
  }

  async getAllRooms(): Promise<ChatRoomEntity[]> {
    return this.chatRoomRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getRoom(id: number): Promise<ChatRoomEntity> {
    const room = await this.chatRoomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async getRoomMessages(roomId: number): Promise<ChatMessageEntity[]> {
    await this.getRoom(roomId); // Verify room exists
    return this.chatMessageRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async saveMessage(
    userId: number,
    sendMessageInput: SendMessageInput,
  ): Promise<ChatMessageEntity> {
    const { roomId, message } = sendMessageInput;

    // Verify room exists
    await this.getRoom(roomId);

    const chatMessage = this.chatMessageRepository.create({
      message,
      userId,
      roomId,
    });

    return this.chatMessageRepository.save(chatMessage);
  }

  async getAllRoomIds(): Promise<number[]> {
    const rooms = await this.chatRoomRepository.find({ select: ['id'] });
    return rooms.map((room) => room.id);
  }
}
