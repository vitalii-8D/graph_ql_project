import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsInt, Min, Max, IsDateString, IsArray } from 'class-validator';

@InputType()
export class DateRangeInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  from?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  to?: string;
}

@InputType()
export class ReadingTimeRangeInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  min?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  max?: number;
}

@InputType()
export class SearchPostsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  query?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @Field(() => DateRangeInput, { nullable: true })
  @IsOptional()
  createdAt?: DateRangeInput;

  @Field(() => ReadingTimeRangeInput, { nullable: true })
  @IsOptional()
  readingTime?: ReadingTimeRangeInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cursor?: string;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

/**
 * Power-user variant of `SearchPostsInput`: `queryString` is passed straight to ES's
 * `query_string` query, so callers get Lucene syntax for free — field-scoped terms
 * (`title:elasticsearch`), boolean operators (`AND`/`OR`/`NOT`), wildcards (`elast*`),
 * and phrases (`"exact phrase"`) — instead of the fuzzy `multi_match` used by `searchPosts`.
 */
@InputType()
export class SearchPostsAdvancedInput {
  @Field()
  @IsString()
  queryString: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @Field(() => DateRangeInput, { nullable: true })
  @IsOptional()
  createdAt?: DateRangeInput;

  @Field(() => ReadingTimeRangeInput, { nullable: true })
  @IsOptional()
  readingTime?: ReadingTimeRangeInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cursor?: string;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
