import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import type { estypes } from '@elastic/elasticsearch';
import type { AuthenticatedUser } from '../auth/types/common';
import { CategoryEntity } from '../categories/entities/category.entity';
import { SITE_NAME } from '../constants/common';
import { OrderDirection } from '../enums/order-direction.enum';
import { CreateOpenGraphInput } from '../open-graph/dto/create-open-graph.input';
import { OgType } from '../open-graph/entities/open-graph-metadata.entity';
import { OpenGraphService } from '../open-graph/services/open-graph.service';
import { PostImagesService } from '../post-images/post-images.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { ES_INDICES } from '../elasticsearch/indices';
import { PostSearchDocument } from '../elasticsearch/mappings/posts.mapping';
import { encodeCursor, decodeCursor } from '../elasticsearch/cursor.util';
import { UserEntity } from '../users/entities/user.entity';
import { UserRole } from '../users/enums';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { SearchPostsInput, SearchPostsQueryMode } from './dto/search-posts.input';
import { PostSearchResult, CategoryFacet } from './dto/post-search-result.type';
import { PostEntity } from './entities/post.entity';
import { PostIndexService } from './post-index.service';
import { PostStatus } from './enums';

const AVERAGE_READING_SPEED_WPM = 200;
const CATEGORY_FACET_SIZE = 50;

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
    private postImagesService: PostImagesService,
    private postIndexService: PostIndexService,
    private elasticsearchService: ElasticsearchService,
  ) {}

  async create(createPostInput: CreatePostInput, user: AuthenticatedUser): Promise<PostEntity> {
    const { categoryIds, metadata, image, ...postData } = createPostInput;

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
      readingTimeMinutes: this.computeReadingTime(postData.content),
      author,
      categories,
    });

    const savedPost = await this.postsRepository.save(post);

    let postMetadata: CreateOpenGraphInput = {
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
    if (image) {
      const postImage = await this.postImagesService.upsertForPost(savedPost.id, image);
      postMetadata = {
        ...postMetadata,
        image: postImage.url,
      };

      if (postImage.altText) {
        postMetadata.imageAlt = postImage.altText;
      }
    }
    await this.openGraphService.createForPost(savedPost.id, postMetadata);
    await this.postIndexService.reindexOne(savedPost.id);

    return savedPost;
  }

  async findAll(): Promise<PostEntity[]> {
    return await this.postsRepository.find({
      where: { status: PostStatus.PUBLISHED },
      order: { createdAt: OrderDirection.DESC },
    });
  }

  async findByAuthorId(authorId: number): Promise<PostEntity[]> {
    return await this.postsRepository.find({
      where: { authorId },
      order: { createdAt: OrderDirection.DESC },
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
    const { id, categoryIds, metadata, image, ...updateData } = updatePostInput;
    const post = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You can only update your own posts');
    }

    Object.assign(post, updateData);

    if (updateData.content) {
      post.readingTimeMinutes = this.computeReadingTime(updateData.content);
    }

    if (categoryIds) {
      post.categories = await this.categoriesRepository.findBy({
        id: In(categoryIds),
      });
    }

    const savedPost = await this.postsRepository.save({ ...post, id: post.id });

    let postMetadata: Partial<CreateOpenGraphInput> = {
      title: updateData?.title,
      description: updateData?.title?.split('.')[0],
    };
    if (metadata) {
      postMetadata.tags = metadata.tags;
      postMetadata.image = metadata.image;
      postMetadata.imageAlt = metadata.imageAlt;
    }
    if (image) {
      const postImage = await this.postImagesService.upsertForPost(savedPost.id, image);
      postMetadata = {
        ...postMetadata,
        image: postImage.url,
        ...(postImage.altText ? { imageAlt: postImage.altText } : {}),
      };
    }
    await this.openGraphService.upsertForPost(savedPost.id, postMetadata);
    await this.postIndexService.reindexOne(savedPost.id);

    return savedPost;
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

  async getPostCategories(postId: number): Promise<CategoryEntity[]> {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['categories'],
    });
    return post?.categories ?? [];
  }

  async incrementViewCount(id: number): Promise<PostEntity> {
    await this.postsRepository.increment({ id }, 'viewCount', 1);
    return this.findOne(id);
  }

  async updateCommentAggregates(postId: number, commentCount: number, averageRating: number | null): Promise<void> {
    await this.postsRepository.update({ id: postId }, { commentCount, averageRating });
    await this.postIndexService.reindexOne(postId);
  }

  async searchViaElasticsearch(input: SearchPostsInput): Promise<PostSearchResult> {
    const limit = input.limit ?? 10;
    const hasQuery = Boolean(input.query);

    let must: estypes.QueryDslQueryContainer[];
    if (!hasQuery) {
      // Doc's explicit "zero-query-text" default-browse case — match_all, not a separate code path.
      must = [{ match_all: {} }];
    } else if (input.mode === SearchPostsQueryMode.QUERY_STRING) {
      must = [{ query_string: { query: input.query!, fields: ['title^3', 'content^2', 'author.name'] } }];
    } else {
      must = [
        {
          multi_match: {
            query: input.query!,
            fields: ['title^3', 'content^2', 'author.name^1'],
            type: 'best_fields',
            fuzziness: 'AUTO',
            tie_breaker: 0.3,
          },
        },
      ];
    }

    const filter: estypes.QueryDslQueryContainer[] = [{ term: { status: PostStatus.PUBLISHED } }];
    if (input.categories && input.categories.length > 0) {
      filter.push({ terms: { 'categories.name': input.categories } });
    }
    if (input.createdAt?.from || input.createdAt?.to) {
      filter.push({ range: { createdAt: { gte: input.createdAt.from, lte: input.createdAt.to } } });
    }
    if (input.readingTime?.min != null || input.readingTime?.max != null) {
      filter.push({ range: { readingTimeMinutes: { gte: input.readingTime.min, lte: input.readingTime.max } } });
    }

    const query: estypes.QueryDslQueryContainer = { bool: { must, filter } };

    const sort: estypes.SortCombinations[] = hasQuery
      ? [{ _score: { order: 'desc' } }, { id: 'asc' }]
      : [{ createdAt: { order: 'desc' } }, { id: 'asc' }];

    const response = await this.elasticsearchService.search<PostSearchDocument>(ES_INDICES.posts, {
      query,
      sort,
      size: limit,
      search_after: decodeCursor(input.cursor),
      aggs: {
        categoryFacets: { terms: { field: 'categories.name', size: CATEGORY_FACET_SIZE } },
      },
    });

    const hits = response.hits.hits;
    const ids = hits.map((hit) => Number(hit._id));
    const rows = ids.length > 0 ? await this.postsRepository.find({ where: { id: In(ids) } }) : [];
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const items = ids.map((id) => rowsById.get(id)).filter((row): row is PostEntity => Boolean(row));

    const facetBuckets =
      (response.aggregations?.categoryFacets as estypes.AggregationsStringTermsAggregate | undefined)?.buckets ?? [];
    const facets: CategoryFacet[] = Array.isArray(facetBuckets)
      ? facetBuckets.map((bucket) => ({ name: String(bucket.key), count: bucket.doc_count }))
      : [];

    const lastHit = hits[hits.length - 1];
    const nextCursor = hits.length === limit ? encodeCursor(lastHit?.sort as (string | number)[] | undefined) : undefined;

    return { items, facets, nextCursor };
  }

  private computeReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / AVERAGE_READING_SPEED_WPM));
  }
}
