import { Resolver, Query, Mutation, Args, ID, Info } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { GraphQLResolveInfo } from 'graphql';

import { getRequestedRelations } from '../utils/graphql-selection.util';
import { UsersService } from './services/users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { SearchUsersInput } from './dto/search-users.input';
import { UserSearchResult } from './dto/user-search-result.type';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/common';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => UserEntity)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput): Promise<UserEntity> {
    return this.usersService.create(createUserInput);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserEntity], { name: 'users' })
  findAll(@Info() info: GraphQLResolveInfo): Promise<UserEntity[]> {
    return this.usersService.findAll(getRequestedRelations(info, this.usersService.entityMetadata));
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserEntity, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: number, @Info() info: GraphQLResolveInfo): Promise<UserEntity> {
    return this.usersService.findOne(id, getRequestedRelations(info, this.usersService.entityMetadata));
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserEntity, { name: 'me' })
  me(@CurrentUser() user: UserEntity, @Info() info: GraphQLResolveInfo): Promise<UserEntity> {
    return this.usersService.findOne(user.id, getRequestedRelations(info, this.usersService.entityMetadata));
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserSearchResult, { name: 'searchUsers' })
  searchUsers(
    @Args('input') input: SearchUsersInput,
    @CurrentUser() user: AuthenticatedUser,
    @Info() info: GraphQLResolveInfo,
  ): Promise<UserSearchResult> {
    return this.usersService.search(input, user, getRequestedRelations(info, this.usersService.entityMetadata));
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserEntity)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput): Promise<UserEntity> {
    return this.usersService.update(updateUserInput);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserEntity)
  removeUser(@Args('id', { type: () => ID }) id: number): Promise<UserEntity> {
    return this.usersService.remove(id);
  }
}
