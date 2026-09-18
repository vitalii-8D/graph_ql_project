import { Resolver, Query, Info, Int, Args } from '@nestjs/graphql';
import type { GraphQLResolveInfo } from 'graphql';

import { getRequestedRelations } from '../utils/graphql-selection.util';
import { CategoriesService } from './categories.service';
import { CategoryEntity } from './entities/category.entity';

@Resolver(() => CategoryEntity)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Query(() => [CategoryEntity], { name: 'categories' })
  findAll(
    @Info() info: GraphQLResolveInfo,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<CategoryEntity[]> {
    return this.categoriesService.findAll(
      getRequestedRelations(info, this.categoriesService.entityMetadata),
      limit,
      offset,
    );
  }
}
