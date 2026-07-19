import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostEntity } from '../posts/entities/post.entity';

import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

  // @UseGuards(GqlAuthGuard)
  @Query(() => UserEntity, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: number): Promise<UserEntity> {
    return this.usersService.findOne(id);
  }

  // @UseGuards(GqlAuthGuard)
  @Query(() => UserEntity, { name: 'me' })
  me(@CurrentUser() user: UserEntity): Promise<UserEntity> {
    return this.usersService.findOne(user.id);
  }

  @Mutation(() => UserEntity)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput): Promise<UserEntity> {
    return this.usersService.update(updateUserInput);
  }

  @Mutation(() => UserEntity)
  removeUser(@Args('id', { type: () => ID }) id: number): Promise<UserEntity> {
    return this.usersService.remove(id);
  }

  @ResolveField('posts', () => [PostEntity])
  async getPosts(@Parent() author: UserEntity) {
    const { id } = author;
    return this.usersService.getUserPosts(id);
  }
}
