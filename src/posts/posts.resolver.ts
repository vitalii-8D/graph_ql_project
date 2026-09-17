import { Resolver, Query, Mutation, Args, ID, Info } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { GraphQLResolveInfo } from 'graphql';

import { getRequestedRelations } from '../utils/graphql-selection.util';
import { PostsService } from './services/posts.service';
import { PostEntity } from './entities/post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { SearchPostsInput, SearchPostsAdvancedInput } from './dto/search-posts.input';
import { PostSearchResult } from './dto/post-search-result.type';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/common';

@Resolver(() => PostEntity)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  createPost(
    @Args('createPostInput') createPostInput: CreatePostInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostEntity> {
    return this.postsService.create(createPostInput, user);
  }

  @Query(() => [PostEntity], { name: 'posts' })
  findAll(@Info() info: GraphQLResolveInfo): Promise<PostEntity[]> {
    return this.postsService.findAll(getRequestedRelations(info, this.postsService.entityMetadata));
  }

  @Query(() => PostEntity, { name: 'post' })
  findOne(@Args('id', { type: () => ID }) id: number, @Info() info: GraphQLResolveInfo): Promise<PostEntity> {
    return this.postsService.findOne(id, getRequestedRelations(info, this.postsService.entityMetadata));
  }

  @Query(() => PostSearchResult, { name: 'searchPosts' })
  searchPosts(@Args('input') input: SearchPostsInput, @Info() info: GraphQLResolveInfo): Promise<PostSearchResult> {
    return this.postsService.search(input, getRequestedRelations(info, this.postsService.entityMetadata, 'items'));
  }

  @Query(() => PostSearchResult, { name: 'searchPostsAdvanced' })
  searchPostsAdvanced(@Args('input') input: SearchPostsAdvancedInput): Promise<PostSearchResult> {
    return this.postsService.searchAdvanced(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  updatePost(
    @Args('updatePostInput') updatePostInput: UpdatePostInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostEntity> {
    return this.postsService.update(updatePostInput, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  removePost(@Args('id', { type: () => ID }) id: number, @CurrentUser() user: AuthenticatedUser): Promise<PostEntity> {
    return this.postsService.remove(id, user);
  }

  @Mutation(() => PostEntity)
  incrementPostViewCount(@Args('id', { type: () => ID }) id: number): Promise<PostEntity> {
    return this.postsService.incrementViewCount(id);
  }
}
