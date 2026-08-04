import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsInt, Min, Max } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field(() => ID)
  @IsNotEmpty()
  postId: number;

  @Field()
  @IsNotEmpty()
  content: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
