import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { IsOptional, IsString, IsInt, IsEnum, Min, Max, IsDateString, IsArray } from 'class-validator';

export enum SearchPostsQueryMode {
  SIMPLE = 'simple',
  QUERY_STRING = 'query_string',
}

registerEnumType(SearchPostsQueryMode, {
  name: 'SearchPostsQueryMode',
  description: 'Whether the free-text query is a plain weighted search or raw Elasticsearch query_string syntax',
});

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

  @Field(() => SearchPostsQueryMode, { nullable: true, defaultValue: SearchPostsQueryMode.SIMPLE })
  @IsOptional()
  @IsEnum(SearchPostsQueryMode)
  mode?: SearchPostsQueryMode;

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
