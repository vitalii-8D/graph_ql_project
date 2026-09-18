import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsInt, Min, Max, MaxLength } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field(() => ID)
  @IsNotEmpty()
  postId: number;

  @Field()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
