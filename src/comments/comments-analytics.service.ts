import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommentEntity } from './entities/comment.entity';
import { CommentPeriodGranularity } from './enums';
import {
  CommentsPerPostStat,
  CommentsPerUserStat,
  CommentsPerPeriodStat,
  RatingDistributionStat,
} from './dto/comment-analytics.types';

const DATE_TRUNC_UNIT_BY_GRANULARITY: Record<CommentPeriodGranularity, string> = {
  [CommentPeriodGranularity.DAY]: 'day',
  [CommentPeriodGranularity.MONTH]: 'month',
};

/**
 * Postgres-backed comment aggregations, split out of `CommentsService` so CRUD and analytics
 * changes don't touch the same class — mirrors the separation `AnalyticsModule` already uses for
 * the ES-backed dashboard aggregations.
 */
@Injectable()
export class CommentsAnalyticsService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentsRepository: Repository<CommentEntity>,
  ) {}

  async commentsPerPost(): Promise<CommentsPerPostStat[]> {
    const rows = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.post', 'post')
      .select('comment.postId', 'postId')
      .addSelect('post.title', 'postTitle')
      .addSelect('COUNT(comment.id)', 'count')
      .groupBy('comment.postId')
      .addGroupBy('post.title')
      .orderBy('count', 'DESC')
      .getRawMany<{ postId: number; postTitle: string; count: string }>();

    return rows.map((row) => ({ postId: row.postId, postTitle: row.postTitle, count: Number(row.count) }));
  }

  async commentsPerUser(): Promise<CommentsPerUserStat[]> {
    const rows = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.author', 'author')
      .select('comment.authorId', 'userId')
      .addSelect('author.name', 'userName')
      .addSelect('COUNT(comment.id)', 'count')
      .groupBy('comment.authorId')
      .addGroupBy('author.name')
      .orderBy('count', 'DESC')
      .getRawMany<{ userId: number; userName: string; count: string }>();

    return rows.map((row) => ({ userId: row.userId, userName: row.userName, count: Number(row.count) }));
  }

  async commentsPerPeriod(granularity: CommentPeriodGranularity): Promise<CommentsPerPeriodStat[]> {
    const unit = DATE_TRUNC_UNIT_BY_GRANULARITY[granularity];
    const rows = await this.commentsRepository
      .createQueryBuilder('comment')
      .select(`DATE_TRUNC('${unit}', comment.createdAt)`, 'period')
      .addSelect('COUNT(comment.id)', 'count')
      .groupBy('period')
      .orderBy('period', 'DESC')
      .getRawMany<{ period: Date; count: string }>();

    return rows.map((row) => ({ period: row.period.toISOString(), count: Number(row.count) }));
  }

  async ratingDistribution(): Promise<RatingDistributionStat[]> {
    const rows = await this.commentsRepository
      .createQueryBuilder('comment')
      .select('comment.rating', 'rating')
      .addSelect('COUNT(comment.id)', 'count')
      .groupBy('comment.rating')
      .orderBy('comment.rating', 'ASC')
      .getRawMany<{ rating: number; count: string }>();

    return rows.map((row) => ({ rating: row.rating, count: Number(row.count) }));
  }
}
