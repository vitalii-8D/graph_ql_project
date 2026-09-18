import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { estypes } from '@elastic/elasticsearch';

import { OrderDirection } from '../../enums/order-direction.enum';
import { ElasticsearchService } from '../../elasticsearch/services/elasticsearch.service';
import { ES_INDICES } from '../../elasticsearch/enums/indices';
import { PostSearchDocument } from '../../elasticsearch/mappings/posts.mapping';
import { encodeCursor, decodeCursor } from '../../elasticsearch/utils/cursor.util';
import { sortByIds } from '../../utils/sort-by-ids';
import { SearchPostsInput, SearchPostsAdvancedInput } from '../dto/search-posts.input';
import { PostSearchResult } from '../dto/post-search-result.type';
import { PostEntity } from '../entities/post.entity';
import { PostStatus, PostPaymentStatus } from '../enums';

interface ExecuteSearchOptions {
  query: estypes.QueryDslQueryContainer;
  sort: estypes.SortCombinations[];
  limit: number;
  cursor?: string;
  relations?: string[];
}

/**
 * Owns every ES-backed post search concern (`search`/`searchAdvanced`/visibility filtering/
 * result hydration) — split out of `PostsService` so CRUD and search-DSL changes don't have to
 * touch the same class.
 */
@Injectable()
export class PostSearchService {
  constructor(
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    private elasticsearchService: ElasticsearchService,
  ) {}

  async search(input: SearchPostsInput, relations: string[] = []): Promise<PostSearchResult> {
    const limit = input.limit ?? 10;
    const hasQuery = Boolean(input.query);

    const must: estypes.QueryDslQueryContainer[] = [
      hasQuery
        ? {
            multi_match: {
              query: input.query!,
              fields: ['title^3', 'content^2', 'author.name^1'],
              type: 'best_fields',
              fuzziness: 'AUTO',
              tie_breaker: 0.3,
            },
          }
        : { match_all: {} },
    ];

    const query: estypes.QueryDslQueryContainer = { bool: { must, filter: this.buildVisibilityFilters(input) } };

    const sort: estypes.SortCombinations[] = hasQuery
      ? [{ _score: { order: OrderDirection.DESC } }, { id: OrderDirection.ASC }]
      : [{ createdAt: { order: OrderDirection.DESC } }, { id: OrderDirection.ASC }];

    return this.executeSearch({ query, sort, limit, cursor: input.cursor, relations });
  }

  /**
   * Lucene-syntax search for power users/admin tooling: `query_string` supports field-scoped
   * terms, boolean operators, wildcards, and phrases in one string, unlike the fuzzy
   * `multi_match` used by `search`. `content` is analyzed with `post_content_analyzer`
   * (stemming + English stop-words, see posts.mapping.ts) so terms like "running" still
   * match "run".
   */
  async searchAdvanced(input: SearchPostsAdvancedInput, relations: string[] = []): Promise<PostSearchResult> {
    const limit = input.limit ?? 10;

    const must: estypes.QueryDslQueryContainer[] = [
      {
        query_string: {
          query: input.queryString,
          fields: ['title^3', 'content^2', 'author.name'],
          default_operator: 'AND',
          fuzziness: 'AUTO',
          lenient: true,
        },
      },
    ];

    const query: estypes.QueryDslQueryContainer = { bool: { must, filter: this.buildVisibilityFilters(input) } };
    const sort: estypes.SortCombinations[] = [{ _score: { order: OrderDirection.DESC } }, { id: OrderDirection.ASC }];

    return this.executeSearch({ query, sort, limit, cursor: input.cursor, relations });
  }

  private buildVisibilityFilters(input: {
    categories?: string[];
    createdAt?: { from?: string; to?: string };
    readingTime?: { min?: number; max?: number };
  }): estypes.QueryDslQueryContainer[] {
    const filter: estypes.QueryDslQueryContainer[] = [
      { term: { status: PostStatus.PUBLISHED } },
      { terms: { paymentStatus: [PostPaymentStatus.SUCCEEDED, PostPaymentStatus.NOT_REQUIRED] } },
    ];
    if (input.categories && input.categories.length > 0) {
      filter.push(...input.categories.map((category) => ({ term: { 'categories.name': category } })));
    }
    if (input.createdAt?.from || input.createdAt?.to) {
      filter.push({ range: { createdAt: { gte: input.createdAt.from, lte: input.createdAt.to } } });
    }
    if (input.readingTime?.min != null || input.readingTime?.max != null) {
      filter.push({ range: { readingTimeMinutes: { gte: input.readingTime.min, lte: input.readingTime.max } } });
    }
    return filter;
  }

  private async executeSearch(options: ExecuteSearchOptions): Promise<PostSearchResult> {
    const { query, sort, limit, cursor, relations = [] } = options;
    const response = await this.elasticsearchService.search<PostSearchDocument>(ES_INDICES.Posts, {
      query,
      sort,
      size: limit,
      search_after: decodeCursor(cursor),
    });

    const hits = response.hits.hits;
    const ids = hits.map((hit) => Number(hit._id));
    const rows = ids.length > 0 ? await this.postsRepository.find({ where: { id: In(ids) }, relations }) : [];

    const items = sortByIds(ids, rows);

    const lastHit = hits[hits.length - 1];
    const nextCursor =
      hits.length === limit ? encodeCursor(lastHit?.sort as (string | number)[] | undefined) : undefined;

    return { items, nextCursor };
  }
}
