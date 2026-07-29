import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PasswordUtil } from '../utils/password.util';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private readonly passwordUtil: PasswordUtil,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<UserEntity> {
    const hashedPassword = await this.passwordUtil.hash(createUserInput.password);

    const user = this.usersRepository.create({ ...createUserInput, password: hashedPassword });

    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.usersRepository.find();
  }

  async findByIdPlain(id: number): Promise<UserEntity | null> {
    return await this.usersRepository.findOneBy({ id });
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  async search(query: string, excludeUserId: number): Promise<UserEntity[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      return [];
    }

    return await this.usersRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :query OR user.email ILIKE :query', { query: `%${trimmed}%` })
      .andWhere('user.id != :excludeUserId', { excludeUserId })
      .orderBy('user.name', 'ASC')
      .limit(10)
      .getMany();
  }

  async update(updateUserInput: UpdateUserInput): Promise<UserEntity> {
    const user = await this.findOne(updateUserInput.id);

    Object.assign(user, updateUserInput);

    return await this.usersRepository.save({ ...user, id: +user.id });
  }

  async remove(id: number): Promise<UserEntity> {
    const user = await this.findOne(id);

    await this.usersRepository.remove(user);

    return user;
  }
}
