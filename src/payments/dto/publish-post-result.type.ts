import { ObjectType, Field } from '@nestjs/graphql';

import { PostEntity } from '../../posts/entities/post.entity';

@ObjectType()
export class PublishPostResult {
  @Field(() => PostEntity, { nullable: true })
  post?: PostEntity | null;

  @Field(() => String, { nullable: true })
  checkoutUrl?: string | null;

  @Field(() => String, { nullable: true })
  checkoutSessionId?: string | null;
}
