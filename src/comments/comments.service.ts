import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, type EntityManager } from 'typeorm';

import type { AuthenticatedUser } from '../auth/types/common';
import { PostEntity } from '../posts/entities/post.entity';
import { PostIndexService } from '../posts/services/post-index.service';
import { RelationAwareService } from '../utils/relation-aware.service';
import { UserRole } from '../users/enums';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { CommentEntity } from './entities/comment.entity';
import { CommentIndexService } from './comment-index.service';

const MAX_COMMENTS_PER_PAGE = 100;
const DEFAULT_COMMENTS_PER_PAGE = 20;

@Injectable()
export class CommentsService extends RelationAwareService<CommentEntity> {
  constructor(
    @InjectRepository(CommentEntity)
    private commentsRepository: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    private postIndexService: PostIndexService,
    private commentIndexService: CommentIndexService,
    private dataSource: DataSource,
  ) {
    super();
  }

  protected get repository(): Repository<CommentEntity> {
    return this.commentsRepository;
  }

  async create(
    createCommentInput: CreateCommentInput,
    user: AuthenticatedUser,
    relations: string[] = [],
  ): Promise<CommentEntity> {
    const postExists = await this.postsRepository.existsBy({ id: createCommentInput.postId });
    if (!postExists) {
      throw new NotFoundException(`Post with ID ${createCommentInput.postId} not found`);
    }

    const savedComment = await this.dataSource.transaction(async (manager) => {
      const comment = manager.create(CommentEntity, { ...createCommentInput, authorId: user.id });
      const saved = await manager.save(comment);
      await this.recomputePostAggregates(saved.postId, manager);
      return saved;
    });

    await this.postIndexService.reindexOne(savedComment.postId);
    await this.commentIndexService.indexComment(savedComment);

    return this.findOne(savedComment.id, relations);
  }

  async findByPost(
    postId: number,
    relations: string[] = [],
    limit = DEFAULT_COMMENTS_PER_PAGE,
    offset = 0,
  ): Promise<CommentEntity[]> {
    return await this.commentsRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
      relations,
      take: Math.min(limit, MAX_COMMENTS_PER_PAGE),
      skip: offset,
    });
  }

  async findByUser(userId: number): Promise<CommentEntity[]> {
    return await this.commentsRepository.find({
      where: { authorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, relations: string[] = []): Promise<CommentEntity> {
    const comment = await this.commentsRepository.findOne({ where: { id }, relations });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async update(
    updateCommentInput: UpdateCommentInput,
    user: AuthenticatedUser,
    relations: string[] = [],
  ): Promise<CommentEntity> {
    const { id, ...updateData } = updateCommentInput;
    const comment = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You can only update your own comments');
    }

    Object.assign(comment, updateData);

    const savedComment = await this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(comment);
      if (updateData.rating !== undefined) {
        await this.recomputePostAggregates(saved.postId, manager);
      }
      return saved;
    });

    if (updateData.rating !== undefined) {
      await this.postIndexService.reindexOne(savedComment.postId);
    }
    await this.commentIndexService.indexComment(savedComment);

    return this.findOne(savedComment.id, relations);
  }

  async remove(id: number, user: AuthenticatedUser): Promise<CommentEntity> {
    const comment = await this.findOne(id, ['post', 'author']);

    if (user.role !== UserRole.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.dataSource.transaction(async (manager) => {
      // repository.remove() nulls the entity's primary key on success — capture it first.
      await manager.remove(CommentEntity, comment);
      await this.recomputePostAggregates(comment.postId, manager);
    });

    await this.postIndexService.reindexOne(comment.postId);
    await this.commentIndexService.deleteComment(id);

    return { ...comment, id };
  }

  private async recomputePostAggregates(postId: number, manager: EntityManager): Promise<void> {
    const result = await manager
      .createQueryBuilder(CommentEntity, 'comment')
      .select('COUNT(comment.id)', 'count')
      .addSelect('AVG(comment.rating)', 'average')
      .where('comment.postId = :postId', { postId })
      .getRawOne<{ count: string; average: string | null }>();

    const commentCount = Number(result?.count ?? 0);
    const averageRating = result?.average != null ? Number(result.average) : null;

    await manager.update(PostEntity, { id: postId }, { commentCount, averageRating });
  }
}
