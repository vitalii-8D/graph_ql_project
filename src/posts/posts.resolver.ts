import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { PostsService } from './posts.service';
import { PostEntity } from './entities/post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';

@Resolver(() => PostEntity)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  createPost(
    @Args('createPostInput') createPostInput: CreatePostInput,
    @CurrentUser() user: UserEntity,
  ): Promise<PostEntity> {
    return this.postsService.create(createPostInput, user.id);
  }

  @Query(() => [PostEntity], { name: 'posts' })
  findAll(): Promise<PostEntity[]> {
    return this.postsService.findAll();
  }

  @Query(() => PostEntity, { name: 'post' })
  findOne(@Args('id', { type: () => ID }) id: number): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  updatePost(
    @Args('updatePostInput') updatePostInput: UpdatePostInput,
    @CurrentUser() user: UserEntity,
  ): Promise<PostEntity> {
    return this.postsService.update(updatePostInput, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  removePost(@Args('id', { type: () => ID }) id: number, @CurrentUser() user: UserEntity): Promise<PostEntity> {
    return this.postsService.remove(id, user);
  }
}
