import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, forwardRef, Inject } from '@nestjs/common';
import { PostEntity } from '../posts/entities/post.entity';

import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PostsService } from '../posts/posts.service';
import { UserAvatarEntity } from '../user-avatars/entities/user-avatar.entity';
import { UserAvatarsService } from '../user-avatars/user-avatars.service';

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
  @Query(() => [UserEntity], { name: 'searchUsers' })
  searchUsers(@Args('query') query: string, @CurrentUser() user: UserEntity): Promise<UserEntity[]> {
    return this.usersService.search(query, user.id);
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
