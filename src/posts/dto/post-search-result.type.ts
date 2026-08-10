import { ObjectType, Field } from '@nestjs/graphql';

import { PostEntity } from '../entities/post.entity';

@ObjectType()
export class PostSearchResult {
  @Field(() => [PostEntity])
  items: PostEntity[];

  @Field({ nullable: true })
  nextCursor?: string;
}
