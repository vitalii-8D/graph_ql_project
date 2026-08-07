import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

import { CommentPeriodGranularity } from '../../comments/enums';

@InputType()
export class AnalyticsDashboardInput {
  @Field(() => CommentPeriodGranularity, { nullable: true, defaultValue: CommentPeriodGranularity.DAY })
  @IsOptional()
  @IsEnum(CommentPeriodGranularity)
  userGrowthInterval?: CommentPeriodGranularity;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  geohashPrecision?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  topN?: number;
}
