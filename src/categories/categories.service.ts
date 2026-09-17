import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityMetadata } from 'typeorm';

import { CategoryEntity } from './entities/category.entity';
import { PostEntity } from '../posts/entities/post.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoriesRepository: Repository<CategoryEntity>,
  ) {}

  /** Relation graph of CategoryEntity, used by resolvers to turn a GraphQL selection set into eager-loadable relations. */
  get entityMetadata(): EntityMetadata {
    return this.categoriesRepository.metadata;
  }

  async findAll(relations: string[] = []): Promise<CategoryEntity[]> {
    return await this.categoriesRepository.find({ relations });
  }

  async findByPostId(postId: number): Promise<CategoryEntity[]> {
    return await this.categoriesRepository.find({
      where: {
        posts: { id: postId },
      },
    });
  }

  async getCategoryPosts(categoryId: number): Promise<PostEntity[]> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
      relations: ['posts'],
    });

    return category?.posts ?? [];
  }
}
