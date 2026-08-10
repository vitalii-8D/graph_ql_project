import { Injectable } from '@nestjs/common';
import type { estypes } from '@elastic/elasticsearch';

import { ElasticsearchService } from '../elasticsearch/services/elasticsearch.service';
import { ES_INDICES } from '../elasticsearch/enums/indices';
import { OrderDirection } from '../enums/order-direction.enum';
import { PostsService } from '../posts/services/posts.service';
import { UsersService } from '../users/services/users.service';
import { UserRole } from '../users/enums';
import { AnalyticsDashboardInput } from './dto/analytics-dashboard.input';
import {
  AnalyticsDashboard,
  DateCountPoint,
  RoleBreakdownPoint,
  TermCount,
  GeoCluster,
  TopRatedPost,
  CommentVelocityPoint,
  CommenterSentiment,
  SignificantTerm,
} from './dto/analytics-dashboard.types';

const NEGATIVE_RATING_THRESHOLD = 2;
const POSITIVE_RATING_THRESHOLD = 4;
const TOP_CITIES_SIZE = 20;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  async getDashboard(input: AnalyticsDashboardInput): Promise<AnalyticsDashboard> {
    const topN = input.topN ?? 10;
    const geohashPrecision = input.geohashPrecision ?? 4;
    const userGrowthInterval = input.userGrowthInterval ?? 'day';

    const response = await this.elasticsearchService.msearch<unknown>([
      {
        index: ES_INDICES.Users,
        body: {
          size: 0,
          aggs: {
            // Tracks user sign-ups over time.
            userGrowth: { date_histogram: { field: 'createdAt', calendar_interval: userGrowthInterval } },
            // Measures user count per system role, sub-divided by active status.
            roleBreakdown: {
              terms: { field: 'role' },
              aggs: {
                presence: {
                  filters: {
                    filters: {
                      online: { term: { isOnline: true } },
                      offline: { term: { isOnline: false } },
                    },
                  },
                },
              },
            },
            topCities: { terms: { field: 'city.keyword', size: TOP_CITIES_SIZE } },
            // Clusters user locations on a map and finds the exact geographic center point for each cluster.
            // Output: Grid cell buckets containing the total user count and the exact geometric coordinates needed to place map markers/pins dynamically.
            geoClusters: {
              // Overlays a global grid on the map based on the geohashPrecision level (e.g., level 3 for large regions, level 7 for neighborhood blocks) and groups user GPS points (location) into these grid cells.
              geohash_grid: { field: 'location', precision: geohashPrecision },
              // Calculates the average latitude and longitude (the geographical center) of all point coordinates within that specific grid cell.
              aggs: { centroid: { geo_centroid: { field: 'location' } } },
            },
          },
        },
      },
      {
        index: ES_INDICES.Comments,
        body: {
          size: 0,
          aggs: {
            topRatedPosts: {
              terms: { field: 'postId', size: topN, order: { avgRating: OrderDirection.DESC } },
              aggs: { avgRating: { avg: { field: 'rating' } } },
            },
            // Measures daily comment volumes and how fast comment activity is accelerating or decelerating day-over-day.
            commentVelocity: {
              // Buckets comments day-by-day based on their createdAt timestamp.
              date_histogram: { field: 'createdAt', calendar_interval: 'day' },
              // Uses the pipeline derivative function referencing _count (the number of comments in that day's bucket) to calculate the day-over-day change in comment count.
              aggs: { velocity: { derivative: { buckets_path: '_count' } } },
            },
            // Divides comments into positive and negative buckets based on numeric rating thresholds, then identifies the top authors contributing to each sentiment bucket.
            sentiment: {
              filters: {
                filters: {
                  positive: { range: { rating: { gte: POSITIVE_RATING_THRESHOLD } } },
                  critical: { range: { rating: { lte: NEGATIVE_RATING_THRESHOLD } } },
                },
              },
              aggs: { byAuthor: { terms: { field: 'authorId', size: topN } } },
            },
          },
        },
      },
      {
        index: ES_INDICES.Comments,
        body: {
          size: 0,
          query: { range: { rating: { lte: NEGATIVE_RATING_THRESHOLD } } },
          aggs: {
            negativeTerms: { significant_terms: { field: 'content', size: topN } },
          },
        },
      },
    ]);

    const [usersResult, commentsResult, negativeCommentsResult] = response.responses as [
      estypes.SearchResponse<unknown>,
      estypes.SearchResponse<unknown>,
      estypes.SearchResponse<unknown>,
    ];

    const usersAggs = usersResult.aggregations as Record<string, unknown> | undefined;
    const commentsAggs = commentsResult.aggregations as Record<string, unknown> | undefined;
    const negativeAggs = negativeCommentsResult.aggregations as Record<string, unknown> | undefined;

    const userGrowth = this.mapDateHistogram(usersAggs?.userGrowth as estypes.AggregationsDateHistogramAggregate);
    const roleBreakdown = this.mapRoleBreakdown(usersAggs?.roleBreakdown as estypes.AggregationsStringTermsAggregate);
    const topCities = this.mapTermCounts(usersAggs?.topCities as estypes.AggregationsStringTermsAggregate);
    const geoClusters = this.mapGeoClusters(usersAggs?.geoClusters as estypes.AggregationsGeoHashGridAggregate);

    const { topRatedPosts, topRatedPostIds } = this.mapTopRatedPostBuckets(
      commentsAggs?.topRatedPosts as estypes.AggregationsLongTermsAggregate,
    );
    const commentVelocity = this.mapCommentVelocity(
      commentsAggs?.commentVelocity as estypes.AggregationsDateHistogramAggregate,
    );
    const { commenterSentiment, sentimentUserIds } = this.mapCommenterSentiment(
      commentsAggs?.sentiment as estypes.AggregationsFiltersAggregate,
    );

    const negativeCommentTerms = this.mapSignificantTerms(
      negativeAggs?.negativeTerms as estypes.AggregationsSignificantStringTermsAggregate,
    );

    const [postLabels, userLabels] = await Promise.all([
      this.postsService.findByIds(topRatedPostIds),
      this.usersService.findByIds(sentimentUserIds),
    ]);
    const postTitleById = new Map(postLabels.map((post) => [post.id, post.title]));
    const userNameById = new Map(userLabels.map((user) => [user.id, user.name]));

    return {
      userGrowth,
      roleBreakdown,
      topCities,
      geoClusters,
      topRatedPosts: topRatedPosts.map((post) => ({
        ...post,
        postTitle: postTitleById.get(post.postId) ?? `Post #${post.postId}`,
      })),
      commentVelocity,
      commenterSentiment: commenterSentiment.map((entry) => ({
        ...entry,
        userName: userNameById.get(entry.userId) ?? `User #${entry.userId}`,
      })),
      negativeCommentTerms,
    };
  }

  private mapDateHistogram(agg: estypes.AggregationsDateHistogramAggregate | undefined): DateCountPoint[] {
    const buckets = (agg?.buckets ?? []) as estypes.AggregationsDateHistogramBucket[];
    return buckets.map((bucket) => ({ date: String(bucket.key_as_string ?? bucket.key), count: bucket.doc_count }));
  }

  private mapRoleBreakdown(agg: estypes.AggregationsStringTermsAggregate | undefined): RoleBreakdownPoint[] {
    const buckets = (agg?.buckets ?? []) as (estypes.AggregationsStringTermsBucket & {
      presence?: estypes.AggregationsFiltersAggregate;
    })[];

    return buckets.map((bucket) => {
      const presenceBuckets = bucket.presence?.buckets as Record<string, estypes.AggregationsFiltersBucket> | undefined;
      return {
        role: String(bucket.key) as UserRole,
        online: presenceBuckets?.online?.doc_count ?? 0,
        offline: presenceBuckets?.offline?.doc_count ?? 0,
      };
    });
  }

  private mapTermCounts(agg: estypes.AggregationsStringTermsAggregate | undefined): TermCount[] {
    const buckets = (agg?.buckets ?? []) as estypes.AggregationsStringTermsBucket[];
    return buckets.map((bucket) => ({ term: String(bucket.key), count: bucket.doc_count }));
  }

  private mapGeoClusters(agg: estypes.AggregationsGeoHashGridAggregate | undefined): GeoCluster[] {
    const buckets = (agg?.buckets ?? []) as (estypes.AggregationsGeoHashGridBucket & {
      centroid?: estypes.AggregationsGeoCentroidAggregate;
    })[];

    return buckets.map((bucket) => {
      const location = bucket.centroid?.location as { lat: number; lon: number } | undefined;
      return {
        geohash: String(bucket.key),
        latitude: location?.lat ?? 0,
        longitude: location?.lon ?? 0,
        count: bucket.doc_count,
      };
    });
  }

  private mapTopRatedPostBuckets(agg: estypes.AggregationsLongTermsAggregate | undefined): {
    topRatedPosts: Omit<TopRatedPost, 'postTitle'>[];
    topRatedPostIds: number[];
  } {
    const buckets = (agg?.buckets ?? []) as (estypes.AggregationsLongTermsBucket & {
      avgRating?: estypes.AggregationsAvgAggregate;
    })[];

    const topRatedPosts = buckets.map((bucket) => ({
      postId: Number(bucket.key),
      averageRating: bucket.avgRating?.value ?? 0,
      ratingCount: bucket.doc_count,
    }));

    return { topRatedPosts, topRatedPostIds: topRatedPosts.map((post) => post.postId) };
  }

  private mapCommentVelocity(agg: estypes.AggregationsDateHistogramAggregate | undefined): CommentVelocityPoint[] {
    const buckets = (agg?.buckets ?? []) as (estypes.AggregationsDateHistogramBucket & {
      velocity?: estypes.AggregationsDerivativeAggregate;
    })[];

    return buckets.map((bucket) => ({
      date: String(bucket.key_as_string ?? bucket.key),
      count: bucket.doc_count,
      dailyChange: bucket.velocity?.value ?? undefined,
    }));
  }

  private mapCommenterSentiment(agg: estypes.AggregationsFiltersAggregate | undefined): {
    commenterSentiment: Omit<CommenterSentiment, 'userName'>[];
    sentimentUserIds: number[];
  } {
    const filterBuckets = agg?.buckets as
      | Record<string, estypes.AggregationsFiltersBucket & { byAuthor?: estypes.AggregationsLongTermsAggregate }>
      | undefined;

    const positiveBuckets = (filterBuckets?.positive?.byAuthor?.buckets ?? []) as estypes.AggregationsLongTermsBucket[];
    const criticalBuckets = (filterBuckets?.critical?.byAuthor?.buckets ?? []) as estypes.AggregationsLongTermsBucket[];

    const countByAuthor = new Map<number, { positiveCount: number; criticalCount: number }>();
    for (const bucket of positiveBuckets) {
      const userId = Number(bucket.key);
      countByAuthor.set(userId, { positiveCount: bucket.doc_count, criticalCount: 0 });
    }
    for (const bucket of criticalBuckets) {
      const userId = Number(bucket.key);
      const existing = countByAuthor.get(userId);
      countByAuthor.set(userId, { positiveCount: existing?.positiveCount ?? 0, criticalCount: bucket.doc_count });
    }

    const commenterSentiment = Array.from(countByAuthor.entries()).map(([userId, counts]) => ({ userId, ...counts }));

    return { commenterSentiment, sentimentUserIds: commenterSentiment.map((entry) => entry.userId) };
  }

  private mapSignificantTerms(agg: estypes.AggregationsSignificantStringTermsAggregate | undefined): SignificantTerm[] {
    const buckets = (agg?.buckets ?? []) as estypes.AggregationsSignificantStringTermsBucket[];
    return buckets.map((bucket) => ({
      term: String(bucket.key),
      score: bucket.score ?? 0,
      docCount: bucket.doc_count,
    }));
  }
}
