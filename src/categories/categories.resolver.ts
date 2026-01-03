import { Resolver, Query } from '@nestjs/graphql';

import { CategoriesService } from './categories.service';
import { CategoryEntity } from './entities/category.entity';

@Resolver(() => CategoryEntity)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Query(() => [CategoryEntity], { name: 'categories' })
  findAll(): Promise<CategoryEntity[]> {
    return this.categoriesService.findAll();
  }
}
