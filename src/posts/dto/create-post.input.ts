import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsBoolean, IsOptional, IsArray, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { PostMetadataInput } from './post-metadata.input';

@InputType()
export class CreatePostInput {
  @Field()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsNotEmpty()
  content: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  categoryIds?: number[];

  @Field()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  slug: string;

  @Field(() => PostMetadataInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostMetadataInput)
  metadata?: PostMetadataInput;
}
