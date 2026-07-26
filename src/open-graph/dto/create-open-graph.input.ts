import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUrl, IsEnum, IsNumber, IsDateString, Min } from 'class-validator';

import { OgType } from '../entities/open-graph-metadata.entity';

@InputType()
export class CreateOpenGraphInput {
  @Field()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsNotEmpty()
  description: string;

  @Field(() => OgType, { defaultValue: OgType.ARTICLE })
  @IsEnum(OgType)
  type: OgType;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  image?: string;

  @Field({ nullable: true })
  @IsOptional()
  imageAlt?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  imageWidth?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  imageHeight?: number;

  @Field({ nullable: true })
  @IsOptional()
  author?: string;

  @Field({ nullable: true })
  @IsOptional()
  publisher?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  publishedTime?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  modifiedTime?: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  videoDuration?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  videoWidth?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  videoHeight?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  audioUrl?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Field({ nullable: true })
  @IsOptional()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  availability?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  eventStartTime?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  eventEndTime?: Date;

  @Field({ nullable: true })
  @IsOptional()
  locationAddress?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  locationLatitude?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  locationLongitude?: number;

  @Field({ defaultValue: 'en_US' })
  @IsOptional()
  locale: string;

  @Field({ nullable: true })
  @IsOptional()
  siteName?: string;

  @Field({ nullable: true })
  @IsOptional()
  twitterCard?: string;

  @Field({ nullable: true })
  @IsOptional()
  twitterSite?: string;

  @Field({ nullable: true })
  @IsOptional()
  twitterCreator?: string;
}
