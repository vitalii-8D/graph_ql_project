import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CategoryEntity } from './entities/category.entity';
import { PostEntity } from '../posts/entities/post.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoriesRepository: Repository<CategoryEntity>,
  ) {}

  async findAll(): Promise<CategoryEntity[]> {
    return await this.categoriesRepository.find();
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
