import { Resolver, Query, Mutation, Args, ID, Info, Int } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import type { GraphQLResolveInfo } from 'graphql';

import { getRequestedRelations } from '../utils/graphql-selection.util';
import { UsersService } from './services/users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { SearchUsersInput } from './dto/search-users.input';
import { UserSearchResult } from './dto/user-search-result.type';
import { UserRole } from './enums';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/common';

function assertSelfOrAdmin(user: AuthenticatedUser, targetId: number, message: string): void {
  // The `ID` scalar always arrives as a string at runtime regardless of the `number` param/field
  // type, so it's coerced up front before comparing against `user.id` (a genuine number).
  if (user.role !== UserRole.ADMIN && user.id !== Number(targetId)) {
    throw new ForbiddenException(message);
  }
}

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => UserEntity)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput): Promise<UserEntity> {
    return this.usersService.create(createUserInput);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserEntity], { name: 'users' })
  findAll(
    @Info() info: GraphQLResolveInfo,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<UserEntity[]> {
    return this.usersService.findAll(getRequestedRelations(info, this.usersService.entityMetadata), limit, offset);
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
    return this.usersService.search(
      input,
      user,
      getRequestedRelations(info, this.usersService.entityMetadata, 'items'),
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserEntity)
  updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserEntity> {
    assertSelfOrAdmin(user, updateUserInput.id, 'You can only update your own account');
    return this.usersService.update(updateUserInput);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserEntity)
  removeUser(@Args('id', { type: () => ID }) id: number, @CurrentUser() user: AuthenticatedUser): Promise<UserEntity> {
    assertSelfOrAdmin(user, id, 'You can only delete your own account');
    return this.usersService.remove(id);
  }
}
