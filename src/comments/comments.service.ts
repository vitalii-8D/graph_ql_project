import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthenticatedUser } from '../auth/types/common';
import { PostEntity } from '../posts/entities/post.entity';
import { UserRole } from '../users/enums';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import {
  CommentsPerPostStat,
  CommentsPerUserStat,
  CommentsPerPeriodStat,
  RatingDistributionStat,
} from './dto/comment-analytics.types';
import { CommentPeriodGranularity } from './enums';
import { CommentEntity } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentsRepository: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
  ) {}

  async create(createCommentInput: CreateCommentInput, user: AuthenticatedUser): Promise<CommentEntity> {
    const postExists = await this.postsRepository.existsBy({ id: createCommentInput.postId });
    if (!postExists) {
      throw new NotFoundException(`Post with ID ${createCommentInput.postId} not found`);
    }

    const comment = this.commentsRepository.create({
      ...createCommentInput,
      authorId: user.id,
    });
    const savedComment = await this.commentsRepository.save(comment);

    await this.recomputePostAggregates(savedComment.postId);

    return savedComment;
  }

  async findByPost(postId: number): Promise<CommentEntity[]> {
    return await this.commentsRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<CommentEntity[]> {
    return await this.commentsRepository.find({
      where: { authorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CommentEntity> {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async update(updateCommentInput: UpdateCommentInput, user: AuthenticatedUser): Promise<CommentEntity> {
    const { id, ...updateData } = updateCommentInput;
    const comment = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You can only update your own comments');
    }

    Object.assign(comment, updateData);
    const savedComment = await this.commentsRepository.save(comment);

    if (updateData.rating !== undefined) {
      await this.recomputePostAggregates(savedComment.postId);
    }

    return savedComment;
  }

  async remove(id: number, user: AuthenticatedUser): Promise<CommentEntity> {
    const comment = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepository.remove(comment);
    await this.recomputePostAggregates(comment.postId);

    return comment;
  }

  private async recomputePostAggregates(postId: number): Promise<void> {
    const result = await this.commentsRepository
      .createQueryBuilder('comment')
      .select('COUNT(comment.id)', 'count')
      .addSelect('AVG(comment.rating)', 'average')
      .where('comment.postId = :postId', { postId })
      .getRawOne<{ count: string; average: string | null }>();

    await this.postsRepository.update(
      { id: postId },
      {
        commentCount: Number(result?.count ?? 0),
        averageRating: result?.average != null ? Number(result.average) : null,
      },
    );
  }

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
    const rows = await this.commentsRepository
      .createQueryBuilder('comment')
      .select(`DATE_TRUNC('${granularity}', comment.createdAt)`, 'period')
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
