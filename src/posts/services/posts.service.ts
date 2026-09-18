import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../../auth/types/common';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { SITE_NAME } from '../../constants/common';
import { OrderDirection } from '../../enums/order-direction.enum';
import { CreateOpenGraphInput } from '../../open-graph/dto/create-open-graph.input';
import { OgType } from '../../open-graph/entities/open-graph-metadata.entity';
import { OpenGraphService } from '../../open-graph/services/open-graph.service';
import { PostImagesService } from '../../post-images/post-images.service';
import { RelationAwareService } from '../../utils/relation-aware.service';
import { UserEntity } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums';
import { CreatePostInput } from '../dto/create-post.input';
import { UpdatePostInput } from '../dto/update-post.input';
import { PostEntity } from '../entities/post.entity';
import { PostIndexService } from './post-index.service';
import { PostStatus, PostPaymentStatus } from '../enums';

const AVERAGE_READING_SPEED_WPM = 200;
const MAX_POSTS_PER_PAGE = 100;
const DEFAULT_POSTS_PER_PAGE = 20;
const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION;
}

@Injectable()
export class PostsService extends RelationAwareService<PostEntity> {
  constructor(
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private openGraphService: OpenGraphService,
    private postImagesService: PostImagesService,
    private postIndexService: PostIndexService,
    private dataSource: DataSource,
  ) {
    super();
  }

  protected get repository(): Repository<PostEntity> {
    return this.postsRepository;
  }

  async create(createPostInput: CreatePostInput, user: AuthenticatedUser, relations: string[] = []): Promise<PostEntity> {
    const { categoryIds, metadata, image, ...postData } = createPostInput;

    const author = await this.usersRepository.findOne({ where: { id: user.id } });
    if (!author) {
      throw new NotFoundException(`User with ID ${user.id} not found`);
    }

    let categories: CategoryEntity[] = [];
    if (categoryIds && categoryIds.length > 0) {
      categories = await this.categoriesRepository.findBy({ id: In(categoryIds) });
    }

    let savedPost: PostEntity;
    try {
      savedPost = await this.dataSource.transaction(async (manager) => {
        const post = manager.create(PostEntity, {
          ...postData,
          readingTimeMinutes: this.computeReadingTime(postData.content),
          author,
          categories,
        });
        const saved = await manager.save(post);

        let postMetadata: CreateOpenGraphInput = {
          title: postData.title,
          description: postData.title.split('.')[0],
          type: OgType.ARTICLE,
          locale: 'en_US',
          siteName: SITE_NAME,
        };
        if (metadata) {
          postMetadata = { ...postMetadata, tags: metadata.tags, image: metadata.image, imageAlt: metadata.imageAlt };
        }
        if (image) {
          const postImage = await this.postImagesService.upsertForPost(saved.id, image, manager);
          postMetadata = {
            ...postMetadata,
            image: postImage.url,
            ...(postImage.altText ? { imageAlt: postImage.altText } : {}),
          };
        }
        await this.openGraphService.createForPost(saved.id, postMetadata, undefined, manager);

        return saved;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`Post with slug "${postData.slug}" already exists`);
      }
      throw error;
    }

    await this.postIndexService.reindexOne(savedPost.id);

    return this.findOne(savedPost.id, relations);
  }

  async findAll(relations: string[] = [], limit = DEFAULT_POSTS_PER_PAGE, offset = 0): Promise<PostEntity[]> {
    return await this.postsRepository.find({
      where: [
        { status: PostStatus.PUBLISHED, paymentStatus: PostPaymentStatus.SUCCEEDED },
        { status: PostStatus.PUBLISHED, paymentStatus: PostPaymentStatus.NOT_REQUIRED },
      ],
      order: { createdAt: OrderDirection.DESC },
      relations,
      take: Math.min(limit, MAX_POSTS_PER_PAGE),
      skip: offset,
    });
  }

  async findOne(id: number, relations: string[] = []): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({ where: { id }, relations });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(updatePostInput: UpdatePostInput, user: AuthenticatedUser, relations: string[] = []): Promise<PostEntity> {
    const { id, categoryIds, metadata, image, ...updateData } = updatePostInput;
    const post = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You can only update your own posts');
    }

    if (updateData.status === PostStatus.PUBLISHED && !post.hasBeenPublished) {
      throw new BadRequestException(
        'This post requires a one-time payment before it can be published for the first time — use the publishPost mutation.',
      );
    }

    Object.assign(post, updateData);

    if (updateData.content) {
      post.readingTimeMinutes = this.computeReadingTime(updateData.content);
    }

    if (categoryIds) {
      post.categories = await this.categoriesRepository.findBy({ id: In(categoryIds) });
    }

    let savedPost: PostEntity;
    try {
      savedPost = await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(PostEntity, { ...post, id: post.id });

        let postMetadata: Partial<CreateOpenGraphInput> = {
          title: updateData?.title,
          description: updateData?.title?.split('.')[0],
        };
        if (metadata) {
          postMetadata = { ...postMetadata, tags: metadata.tags, image: metadata.image, imageAlt: metadata.imageAlt };
        }
        if (image) {
          const postImage = await this.postImagesService.upsertForPost(saved.id, image, manager);
          postMetadata = {
            ...postMetadata,
            image: postImage.url,
            ...(postImage.altText ? { imageAlt: postImage.altText } : {}),
          };
        }
        await this.openGraphService.upsertForPost(saved.id, postMetadata, manager);

        return saved;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`Post with slug "${updateData.slug}" already exists`);
      }
      throw error;
    }

    await this.postIndexService.reindexOne(savedPost.id);

    return this.findOne(savedPost.id, relations);
  }

  async remove(id: number, user: AuthenticatedUser): Promise<PostEntity> {
    const post = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // repository.remove() nulls the entity's primary key on success — capture it first.
    await this.postsRepository.remove(post);
    await this.postIndexService.deletePost(id);

    return { ...post, id };
  }

  async findByIds(ids: number[]): Promise<PostEntity[]> {
    if (ids.length === 0) return [];
    return await this.postsRepository.findBy({ id: In(ids) });
  }

  async incrementViewCount(id: number, relations: string[] = []): Promise<PostEntity> {
    await this.postsRepository.increment({ id }, 'viewCount', 1);
    return this.findOne(id, relations);
  }

  private computeReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / AVERAGE_READING_SPEED_WPM));
  }
}
