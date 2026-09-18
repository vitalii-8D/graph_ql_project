import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RelationAwareService } from '../utils/relation-aware.service';
import { CategoryEntity } from './entities/category.entity';

const MAX_CATEGORIES_PER_PAGE = 200;
const DEFAULT_CATEGORIES_PER_PAGE = 50;

@Injectable()
export class CategoriesService extends RelationAwareService<CategoryEntity> {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoriesRepository: Repository<CategoryEntity>,
  ) {
    super();
  }

  protected get repository(): Repository<CategoryEntity> {
    return this.categoriesRepository;
  }

  async findAll(
    relations: string[] = [],
    limit = DEFAULT_CATEGORIES_PER_PAGE,
    offset = 0,
  ): Promise<CategoryEntity[]> {
    return await this.categoriesRepository.find({ relations, take: Math.min(limit, MAX_CATEGORIES_PER_PAGE), skip: offset });
  }
}
