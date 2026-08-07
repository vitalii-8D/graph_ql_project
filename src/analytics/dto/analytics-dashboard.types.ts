import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

import { UserRole } from '../../users/enums';

@ObjectType()
export class DateCountPoint {
  @Field()
  date: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class TermCount {
  @Field()
  term: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class GeoCluster {
  @Field()
  geohash: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class RoleBreakdownPoint {
  @Field(() => UserRole)
  role: UserRole;

  @Field(() => Int)
  online: number;

  @Field(() => Int)
  offline: number;
}

@ObjectType()
export class TopRatedPost {
  @Field(() => ID)
  postId: number;

  @Field()
  postTitle: string;

  @Field(() => Float)
  averageRating: number;

  @Field(() => Int)
  ratingCount: number;
}

@ObjectType()
export class CommentVelocityPoint {
  @Field()
  date: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { nullable: true })
  dailyChange?: number;
}

@ObjectType()
export class CommenterSentiment {
  @Field(() => ID)
  userId: number;

  @Field()
  userName: string;

  @Field(() => Int)
  positiveCount: number;

  @Field(() => Int)
  criticalCount: number;
}

@ObjectType()
export class SignificantTerm {
  @Field()
  term: string;

  @Field(() => Float)
  score: number;

  @Field(() => Int)
  docCount: number;
}

@ObjectType()
export class AnalyticsDashboard {
  @Field(() => [DateCountPoint])
  userGrowth: DateCountPoint[];

  @Field(() => [RoleBreakdownPoint])
  roleBreakdown: RoleBreakdownPoint[];

  @Field(() => [TermCount])
  topCities: TermCount[];

  @Field(() => [GeoCluster])
  geoClusters: GeoCluster[];

  @Field(() => [TopRatedPost])
  topRatedPosts: TopRatedPost[];

  @Field(() => [CommentVelocityPoint])
  commentVelocity: CommentVelocityPoint[];

  @Field(() => [CommenterSentiment])
  commenterSentiment: CommenterSentiment[];

  @Field(() => [SignificantTerm])
  negativeCommentTerms: SignificantTerm[];
}
