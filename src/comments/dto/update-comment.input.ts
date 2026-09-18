import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsInt, IsOptional, Min, Max, MaxLength } from 'class-validator';

@InputType()
export class UpdateCommentInput {
  @Field(() => ID)
  @IsNotEmpty()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(1000)
  content?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
