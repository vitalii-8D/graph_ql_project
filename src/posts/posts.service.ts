import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import type { AuthenticatedUser } from '../auth/types';
import { CategoryEntity } from '../categories/entities/category.entity';
import { SITE_NAME } from '../constants/common';
import { CreateOpenGraphInput } from '../open-graph/dto/create-open-graph.input';
import { OgType } from '../open-graph/entities/open-graph-metadata.entity';
import { OpenGraphService } from '../open-graph/services/open-graph.service';
import { UserEntity } from '../users/entities/user.entity';
import { UserRole } from '../users/enums';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { PostEntity } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private openGraphService: OpenGraphService,
  ) {}

  async create(createPostInput: CreatePostInput, user: AuthenticatedUser): Promise<PostEntity> {
    const { categoryIds, metadata, ...postData } = createPostInput;

    const author = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    if (!author) {
      throw new NotFoundException(`User with ID ${user.id} not found`);
    }

    const existingBySlug = await this.postsRepository.existsBy({ slug: postData.slug });
    if (existingBySlug) {
      throw new BadRequestException('Post with this slug already exists');
    }

    let categories: CategoryEntity[] = [];
    if (categoryIds && categoryIds.length > 0) {
      categories = await this.categoriesRepository.findBy({
        id: In(categoryIds),
      });
    }

    const post = this.postsRepository.create({
      ...postData,
      author,
      categories,
    });

    const savedPost = await this.postsRepository.save(post);

    const postMetadata: CreateOpenGraphInput = {
      title: postData.title,
      description: postData.title.split('.')[0],
      type: OgType.ARTICLE,
      locale: 'en_US',
      siteName: SITE_NAME,
    };
    if (metadata) {
      postMetadata.tags = metadata.tags;
      postMetadata.image = metadata.image;
      postMetadata.imageAlt = metadata.imageAlt;
    }
    await this.openGraphService.createForPost(savedPost.id, postMetadata);

    return savedPost;
  }

  async findAll(): Promise<PostEntity[]> {
    return await this.postsRepository.findBy({ published: true });
  }

  async findByAuthorId(authorId: number): Promise<PostEntity[]> {
    return await this.postsRepository.find({
      where: { authorId },
    });
  }

  async findOne(id: number): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(updatePostInput: UpdatePostInput, user: AuthenticatedUser): Promise<PostEntity> {
    const { id, categoryIds, metadata, ...updateData } = updatePostInput;
    const post = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You can only update your own posts');
    }

    Object.assign(post, updateData);

    if (categoryIds) {
      post.categories = await this.categoriesRepository.findBy({
        id: In(categoryIds),
      });
    }

    const savedPost = await this.postsRepository.save({ ...post, id: post.id });

    const postMetadata: Partial<CreateOpenGraphInput> = {
      title: updateData?.title,
      description: updateData?.title?.split('.')[0],
    };
    if (metadata) {
      postMetadata.tags = metadata.tags;
      postMetadata.image = metadata.image;
      postMetadata.imageAlt = metadata.imageAlt;
    }
    await this.openGraphService.upsertForPost(savedPost.id, postMetadata);

    return savedPost;
  }

  async remove(id: number, user: AuthenticatedUser): Promise<PostEntity> {
    const post = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postsRepository.remove(post);
    return post;
  }

  async getPostCategories(postId: number): Promise<CategoryEntity[]> {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['categories'],
    });
    return post?.categories ?? [];
  }
}
