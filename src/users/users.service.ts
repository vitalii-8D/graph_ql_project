import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../posts/entities/post.entity';

import { UserEntity } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PasswordUtil } from '../utils/password.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    private readonly passwordUtil: PasswordUtil,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<UserEntity> {
    const hashedPassword = await this.passwordUtil.hash(createUserInput.password);

    const user = this.usersRepository.create({ ...createUserInput, password: hashedPassword });
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.usersRepository.find({ relations: ['posts'] });
  }

  async findByIdPlain(id: number): Promise<UserEntity | null> {
    const user = await this.usersRepository.findOneBy({ id });

    return user;
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['posts'],
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

  async getUserPosts(authorId: number): Promise<PostEntity[]> {
    return this.postsRepository.find({ where: { authorId } });
  }
}
