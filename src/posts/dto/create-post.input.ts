import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsEnum, IsOptional, IsArray, IsInt, Matches, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { PostMetadataInput } from './post-metadata.input';
import { PostImageInput } from '../../post-images/dto/post-image.input';
import { PostStatus } from '../enums';

@InputType()
export class CreatePostInput {
  @Field()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Field()
  @IsNotEmpty()
  @MaxLength(1_000)
  content: string;

  @Field(() => PostStatus, { defaultValue: PostStatus.DRAFT })
  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  categoryIds?: number[];

  @Field()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  slug: string;

  @Field(() => PostMetadataInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostMetadataInput)
  metadata?: PostMetadataInput;

  @Field(() => PostImageInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostImageInput)
  image?: PostImageInput;
}
