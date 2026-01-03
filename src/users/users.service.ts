import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PasswordUtil } from '../utils/password.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly passwordUtil: PasswordUtil,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<User> {
    const hashedPassword = await this.passwordUtil.hash(createUserInput.password);

    const user = this.usersRepository.create({ ...createUserInput, password: hashedPassword });
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({ relations: ['posts'] });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['posts'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(updateUserInput: UpdateUserInput): Promise<User> {
    const user = await this.findOne(updateUserInput.id);

    Object.assign(user, updateUserInput);

    return await this.usersRepository.save(user);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
    return user;
  }
}
