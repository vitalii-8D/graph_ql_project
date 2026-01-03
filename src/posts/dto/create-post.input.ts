import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsBoolean, IsOptional, IsArray } from 'class-validator';

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

  @Field(() => ID)
  @IsNotEmpty()
  authorId: number;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  categoryIds?: number[];
}
