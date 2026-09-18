import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';

import type { AuthenticatedUser } from '../../auth/types/common';
import { isPostPubliclyVisible } from '../../posts/utils/post-visibility.util';
import { UserRole } from '../../users/enums';
import { OpenGraphMetadataEntity, OgType } from '../entities/open-graph-metadata.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CreateOpenGraphInput } from '../dto/create-open-graph.input';
import { UpdateOpenGraphInput } from '../dto/update-open-graph.input';

const MAX_LIST_LIMIT = 50;
const DEFAULT_LIST_LIMIT = 20;

@Injectable()
export class OpenGraphService {
  constructor(
    @InjectRepository(OpenGraphMetadataEntity)
    private openGraphRepository: Repository<OpenGraphMetadataEntity>,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
  ) {}

  /**
   * `manager` lets a caller already inside a `DataSource.transaction(...)` block (e.g.
   * `PostsService.create`) pass its transactional `EntityManager` through, so this write
   * participates in the same transaction instead of querying against the uncommitted post row
   * on a separate connection (which would 404).
   */
  async createForPost(
    postId: number,
    createOpenGraphInput: CreateOpenGraphInput,
    user?: AuthenticatedUser,
    manager?: EntityManager,
  ): Promise<OpenGraphMetadataEntity> {
    const { openGraphRepo, postRepo } = this.repositories(manager);
    const post = await postRepo.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }
    if (user) {
      this.assertOwnerOrAdmin(post, user);
    }

    const openGraph = openGraphRepo.create({
      ...createOpenGraphInput,
      post,
    });

    return await openGraphRepo.save(openGraph);
  }

  /** Callers only ever see metadata for posts they own/administer, or that are publicly visible. */
  async findAll(user?: AuthenticatedUser, limit = DEFAULT_LIST_LIMIT, offset = 0): Promise<OpenGraphMetadataEntity[]> {
    const cappedLimit = Math.min(limit, MAX_LIST_LIMIT);
    const all = await this.openGraphRepository.find({ relations: ['post'], take: cappedLimit, skip: offset });

    if (user?.role === UserRole.ADMIN) {
      return all;
    }

    return all.filter((entry) => isPostPubliclyVisible(entry.post) || entry.post.authorId === user?.id);
  }

  async findOne(id: number, user?: AuthenticatedUser): Promise<OpenGraphMetadataEntity> {
    const openGraph = await this.openGraphRepository.findOne({
      where: { id },
      relations: ['post'],
    });

    if (!openGraph || !this.isVisibleTo(openGraph.post, user)) {
      throw new NotFoundException(`OpenGraph metadata with ID ${id} not found`);
    }

    return openGraph;
  }

  async findByPostId(postId: number, user?: AuthenticatedUser): Promise<OpenGraphMetadataEntity | null> {
    const openGraph = await this.openGraphRepository.findOne({
      where: { post: { id: postId } },
      relations: ['post'],
    });

    if (!openGraph || !this.isVisibleTo(openGraph.post, user)) {
      return null;
    }

    return openGraph;
  }

  async update(
    updateOpenGraphInput: UpdateOpenGraphInput,
    user?: AuthenticatedUser,
    manager?: EntityManager,
  ): Promise<OpenGraphMetadataEntity> {
    const { openGraphRepo } = this.repositories(manager);
    const openGraph = await openGraphRepo.findOne({
      where: { id: updateOpenGraphInput.id },
      relations: ['post'],
    });
    if (!openGraph) {
      throw new NotFoundException(`OpenGraph metadata with ID ${updateOpenGraphInput.id} not found`);
    }
    if (user) {
      this.assertOwnerOrAdmin(openGraph.post, user);
    }

    const numericId = Number(updateOpenGraphInput.id);
    Object.assign(openGraph, updateOpenGraphInput, { id: numericId });

    return await openGraphRepo.save(openGraph);
  }

  async remove(id: number, user?: AuthenticatedUser): Promise<OpenGraphMetadataEntity> {
    const openGraph = await this.openGraphRepository.findOne({ where: { id }, relations: ['post'] });
    if (!openGraph) {
      throw new NotFoundException(`OpenGraph metadata with ID ${id} not found`);
    }
    if (user) {
      this.assertOwnerOrAdmin(openGraph.post, user);
    }

    await this.openGraphRepository.remove(openGraph);

    return openGraph;
  }

  async upsertForPost(
    postId: number,
    metadata: Partial<Omit<CreateOpenGraphInput, 'type'>>,
    manager?: EntityManager,
  ): Promise<OpenGraphMetadataEntity> {
    const { openGraphRepo } = this.repositories(manager);
    const existing = await openGraphRepo.findOne({ where: { post: { id: postId } } });
    if (existing) {
      return this.update({ ...metadata, type: OgType.ARTICLE, id: existing.id }, undefined, manager);
    }

    if (!metadata.title || !metadata.description) {
      throw new Error(
        `Cannot create OpenGraph metadata for post ${postId} without a title/description on first upsert`,
      );
    }

    return this.createForPost(
      postId,
      {
        ...metadata,
        title: metadata.title,
        description: metadata.description,
        locale: metadata.locale ?? 'en_US',
        type: OgType.ARTICLE,
      },
      undefined,
      manager,
    );
  }

  private repositories(manager?: EntityManager): {
    openGraphRepo: Repository<OpenGraphMetadataEntity>;
    postRepo: Repository<PostEntity>;
  } {
    if (!manager) {
      return { openGraphRepo: this.openGraphRepository, postRepo: this.postRepository };
    }
    return {
      openGraphRepo: manager.getRepository(OpenGraphMetadataEntity),
      postRepo: manager.getRepository(PostEntity),
    };
  }

  private isVisibleTo(post: PostEntity, user?: AuthenticatedUser): boolean {
    return isPostPubliclyVisible(post) || post.authorId === user?.id || user?.role === UserRole.ADMIN;
  }

  private assertOwnerOrAdmin(post: PostEntity, user: AuthenticatedUser): void {
    if (user.role !== UserRole.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You can only manage OpenGraph metadata for your own posts');
    }
  }
}
