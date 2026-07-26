import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OpenGraphMetadataEntity, OgType } from '../entities/open-graph-metadata.entity';
import { PostEntity } from '../../posts/entities/post.entity';
import { CreateOpenGraphInput } from '../dto/create-open-graph.input';
import { UpdateOpenGraphInput } from '../dto/update-open-graph.input';

@Injectable()
export class OpenGraphService {
  constructor(
    @InjectRepository(OpenGraphMetadataEntity)
    private openGraphRepository: Repository<OpenGraphMetadataEntity>,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
  ) {}

  async createForPost(postId: number, createOpenGraphInput: CreateOpenGraphInput): Promise<OpenGraphMetadataEntity> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const openGraph = this.openGraphRepository.create({
      ...createOpenGraphInput,
      post,
    });

    return await this.openGraphRepository.save(openGraph);
  }

  async findAll(): Promise<OpenGraphMetadataEntity[]> {
    return await this.openGraphRepository.find({ relations: ['post'] });
  }

  async findOne(id: number): Promise<OpenGraphMetadataEntity> {
    const openGraph = await this.openGraphRepository.findOne({
      where: { id },
      relations: ['post'],
    });

    if (!openGraph) {
      throw new NotFoundException(`OpenGraph metadata with ID ${id} not found`);
    }

    return openGraph;
  }

  async findByPostId(postId: number): Promise<OpenGraphMetadataEntity | null> {
    return await this.openGraphRepository.findOne({
      where: { post: { id: postId } },
      relations: ['post'],
    });
  }

  async update(updateOpenGraphInput: UpdateOpenGraphInput): Promise<OpenGraphMetadataEntity> {
    const openGraph = await this.findOne(updateOpenGraphInput.id);

    Object.assign(openGraph, updateOpenGraphInput);

    return await this.openGraphRepository.save({ ...openGraph, id: +openGraph.id });
  }

  async remove(id: number): Promise<OpenGraphMetadataEntity> {
    const openGraph = await this.findOne(id);
    await this.openGraphRepository.remove(openGraph);

    return openGraph;
  }

  async updateForPost(
    postId: number,
    metadata: Partial<Omit<CreateOpenGraphInput, 'type'>>,
  ): Promise<OpenGraphMetadataEntity> {
    return this.update({ ...metadata, type: OgType.ARTICLE, id: postId });
  }

  async upsertForPost(
    postId: number,
    metadata: Partial<Omit<CreateOpenGraphInput, 'type'>>,
  ): Promise<OpenGraphMetadataEntity> {
    const existing = await this.findByPostId(postId);
    if (existing) {
      return this.update({ ...metadata, type: OgType.ARTICLE, id: existing.id });
    }

    const payload = {
      ...metadata,
      type: OgType.ARTICLE,
    };
    return this.createForPost(postId, payload as CreateOpenGraphInput);
  }
}
