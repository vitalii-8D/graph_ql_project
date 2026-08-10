import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, forwardRef, Inject } from '@nestjs/common';

import { UsersService } from './services/users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { SearchUsersInput } from './dto/search-users.input';
import { UserSearchResult } from './dto/user-search-result.type';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/common';
import { PostsService } from '../posts/services/posts.service';
import { UserAvatarEntity } from '../user-avatars/entities/user-avatar.entity';
import { UserAvatarsService } from '../user-avatars/user-avatars.service';
import { PostEntity } from '../posts/entities/post.entity';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PostsService))
    private readonly postsService: PostsService,
    private readonly userAvatarsService: UserAvatarsService,
  ) {}

  @Mutation(() => UserEntity)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput): Promise<UserEntity> {
    return this.usersService.create(createUserInput);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [UserEntity], { name: 'users' })
  findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserEntity, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: number): Promise<UserEntity> {
    return this.usersService.findOne(id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserEntity, { name: 'me' })
  me(@CurrentUser() user: UserEntity): Promise<UserEntity> {
    return this.usersService.findOne(user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserSearchResult, { name: 'searchUsers' })
  searchUsers(
    @Args('input') input: SearchUsersInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserSearchResult> {
    return this.usersService.search(input, user);
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

  @UseGuards(GqlAuthGuard)
  @ResolveField('posts', () => [PostEntity])
  async getPosts(@Parent() author: UserEntity) {
    const { id } = author;
    return this.postsService.findByAuthorId(id);
  }

  @ResolveField('avatar', () => UserAvatarEntity, { nullable: true })
  async getAvatar(@Parent() user: UserEntity): Promise<UserAvatarEntity | null> {
    return this.userAvatarsService.findByUserId(user.id);
  }
}
