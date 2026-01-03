import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { PostEntity } from './entities/post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';

@Resolver(() => PostEntity)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Mutation(() => PostEntity)
  createPost(@Args('createPostInput') createPostInput: CreatePostInput): Promise<PostEntity> {
    return this.postsService.create(createPostInput);
  }

  @Query(() => [PostEntity], { name: 'posts' })
  findAll(): Promise<PostEntity[]> {
    return this.postsService.findAll();
  }

  @Query(() => PostEntity, { name: 'post' })
  findOne(@Args('id', { type: () => ID }) id: number): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Mutation(() => PostEntity)
  updatePost(@Args('updatePostInput') updatePostInput: UpdatePostInput): Promise<PostEntity> {
    return this.postsService.update(updatePostInput);
  }

  @Mutation(() => PostEntity)
  removePost(@Args('id', { type: () => ID }) id: number): Promise<PostEntity> {
    return this.postsService.remove(id);
  }
}
