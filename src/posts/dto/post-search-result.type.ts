import { ObjectType, Field, Int } from '@nestjs/graphql';

import { PostEntity } from '../entities/post.entity';

@ObjectType()
export class CategoryFacet {
  @Field()
  name: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class PostSearchResult {
  @Field(() => [PostEntity])
  items: PostEntity[];

  @Field(() => [CategoryFacet])
  facets: CategoryFacet[];

  @Field({ nullable: true })
  nextCursor?: string;
}
