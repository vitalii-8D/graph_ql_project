import { Resolver, Query, Mutation, Args, ID, Info, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { GraphQLResolveInfo } from 'graphql';

import { getRequestedRelations } from '../utils/graphql-selection.util';
import { ClientIp } from '../utils/client-ip.decorator';
import { PostsService } from './services/posts.service';
import { PostSearchService } from './services/post-search.service';
import { ViewCountDedupeService } from './services/view-count-dedupe.service';
import { PostEntity } from './entities/post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { SearchPostsInput, SearchPostsAdvancedInput } from './dto/search-posts.input';
import { PostSearchResult } from './dto/post-search-result.type';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums';
import type { AuthenticatedUser } from '../auth/types/common';

@Resolver(() => PostEntity)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly postSearchService: PostSearchService,
    private readonly viewCountDedupeService: ViewCountDedupeService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  createPost(
    @Args('createPostInput') createPostInput: CreatePostInput,
    @CurrentUser() user: AuthenticatedUser,
    @Info() info: GraphQLResolveInfo,
  ): Promise<PostEntity> {
    return this.postsService.create(createPostInput, user, getRequestedRelations(info, this.postsService.entityMetadata));
  }

  @Query(() => [PostEntity], { name: 'posts' })
  findAll(
    @Info() info: GraphQLResolveInfo,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<PostEntity[]> {
    return this.postsService.findAll(getRequestedRelations(info, this.postsService.entityMetadata), limit, offset);
  }

  @Query(() => PostEntity, { name: 'post' })
  findOne(@Args('id', { type: () => ID }) id: number, @Info() info: GraphQLResolveInfo): Promise<PostEntity> {
    return this.postsService.findOne(id, getRequestedRelations(info, this.postsService.entityMetadata));
  }

  @Query(() => PostSearchResult, { name: 'searchPosts' })
  searchPosts(@Args('input') input: SearchPostsInput, @Info() info: GraphQLResolveInfo): Promise<PostSearchResult> {
    return this.postSearchService.search(input, getRequestedRelations(info, this.postsService.entityMetadata, 'items'));
  }

  // Admin/power-user tooling (raw Lucene query_string) — see PostSearchService.searchAdvanced's docstring.
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => PostSearchResult, { name: 'searchPostsAdvanced' })
  searchPostsAdvanced(
    @Args('input') input: SearchPostsAdvancedInput,
    @Info() info: GraphQLResolveInfo,
  ): Promise<PostSearchResult> {
    return this.postSearchService.searchAdvanced(
      input,
      getRequestedRelations(info, this.postsService.entityMetadata, 'items'),
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  updatePost(
    @Args('updatePostInput') updatePostInput: UpdatePostInput,
    @CurrentUser() user: AuthenticatedUser,
    @Info() info: GraphQLResolveInfo,
  ): Promise<PostEntity> {
    return this.postsService.update(
      updatePostInput,
      user,
      getRequestedRelations(info, this.postsService.entityMetadata),
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  removePost(@Args('id', { type: () => ID }) id: number, @CurrentUser() user: AuthenticatedUser): Promise<PostEntity> {
    return this.postsService.remove(id, user);
  }

  @Mutation(() => PostEntity)
  incrementPostViewCount(
    @Args('id', { type: () => ID }) id: number,
    @ClientIp() clientIp: string,
    @Info() info: GraphQLResolveInfo,
  ): Promise<PostEntity> {
    const relations = getRequestedRelations(info, this.postsService.entityMetadata);
    if (!this.viewCountDedupeService.shouldCount(id, clientIp)) {
      return this.postsService.findOne(id, relations);
    }
    return this.postsService.incrementViewCount(id, relations);
  }
}
