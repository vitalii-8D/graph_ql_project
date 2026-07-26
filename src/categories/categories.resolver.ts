import { Resolver, Query, ResolveField, Parent } from '@nestjs/graphql';

import { CategoriesService } from './categories.service';
import { CategoryEntity } from './entities/category.entity';
import { PostEntity } from '../posts/entities/post.entity';

@Resolver(() => CategoryEntity)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Query(() => [CategoryEntity], { name: 'categories' })
  findAll(): Promise<CategoryEntity[]> {
    return this.categoriesService.findAll();
  }

  @ResolveField('posts', () => [PostEntity])
  async getPosts(@Parent() category: CategoryEntity): Promise<PostEntity[]> {
    return this.categoriesService.getCategoryPosts(category.id);
  }
}
