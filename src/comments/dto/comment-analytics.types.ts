import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class CommentsPerPostStat {
  @Field(() => ID)
  postId: number;

  @Field()
  postTitle: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class CommentsPerUserStat {
  @Field(() => ID)
  userId: number;

  @Field()
  userName: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class CommentsPerPeriodStat {
  @Field()
  period: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class RatingDistributionStat {
  @Field(() => Int)
  rating: number;

  @Field(() => Int)
  count: number;
}
