import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { PostsService } from './posts.service';
import { PostEntity } from './entities/post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CategoryEntity } from '../categories/entities/category.entity';
import { OpenGraphMetadataEntity } from '../open-graph/entities/open-graph-metadata.entity';
import { OpenGraphService } from '../open-graph/services/open-graph.service';
import { PostImageEntity } from '../post-images/entities/post-image.entity';
import { PostImagesService } from '../post-images/post-images.service';
import type { AuthenticatedUser } from '../auth/types/common';

@Resolver(() => PostEntity)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly openGraphService: OpenGraphService,
    private readonly postImagesService: PostImagesService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  createPost(
    @Args('createPostInput') createPostInput: CreatePostInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostEntity> {
    return this.postsService.create(createPostInput, user);
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
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostEntity> {
    return this.postsService.update(updatePostInput, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PostEntity)
  removePost(@Args('id', { type: () => ID }) id: number, @CurrentUser() user: AuthenticatedUser): Promise<PostEntity> {
    return this.postsService.remove(id, user);
  }

  @ResolveField('author', () => UserEntity)
  async getAuthor(@Parent() post: PostEntity): Promise<UserEntity | null> {
    return this.usersService.findByIdPlain(post.authorId);
  }

  @ResolveField('categories', () => [CategoryEntity])
  async getCategories(@Parent() post: PostEntity): Promise<CategoryEntity[]> {
    return this.postsService.getPostCategories(post.id);
  }

  @ResolveField('openGraphMetadata', () => OpenGraphMetadataEntity, { nullable: true })
  async getOpenGraphMetadata(@Parent() post: PostEntity): Promise<OpenGraphMetadataEntity | null> {
    return this.openGraphService.findByPostId(post.id);
  }

  @ResolveField('postImage', () => PostImageEntity, { nullable: true })
  async getPostImage(@Parent() post: PostEntity): Promise<PostImageEntity | null> {
    return this.postImagesService.findByPostId(post.id);
  }
}
