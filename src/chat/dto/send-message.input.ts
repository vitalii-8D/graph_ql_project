import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { ChatAttachmentInput } from './chat-attachment.input';

@InputType()
export class SendMessageInput {
  @Field(() => ID)
  @Type(() => Number)
  @IsInt()
  roomId: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  message?: string;

  @Field(() => [ChatAttachmentInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ChatAttachmentInput)
  attachments?: ChatAttachmentInput[];
}
