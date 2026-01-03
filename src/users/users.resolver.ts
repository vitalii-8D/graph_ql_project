import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';

import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => UserEntity)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput): Promise<UserEntity> {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [UserEntity], { name: 'users' })
  findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  @Query(() => UserEntity, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: number): Promise<UserEntity> {
    return this.usersService.findOne(id);
  }

  @Mutation(() => UserEntity)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput): Promise<UserEntity> {
    return this.usersService.update(updateUserInput);
  }

  @Mutation(() => UserEntity)
  removeUser(@Args('id', { type: () => ID }) id: number): Promise<UserEntity> {
    return this.usersService.remove(id);
  }
}
