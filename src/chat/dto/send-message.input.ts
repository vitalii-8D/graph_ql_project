import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field(() => ID)
  @IsNumber()
  @IsNotEmpty()
  roomId: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  message: string;
}
