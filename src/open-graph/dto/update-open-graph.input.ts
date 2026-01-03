import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { CreateOpenGraphInput } from './create-open-graph.input';

@InputType()
export class UpdateOpenGraphInput extends PartialType(CreateOpenGraphInput) {
  @Field(() => ID)
  @IsNotEmpty()
  id: number;
}
