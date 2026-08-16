import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { ChatAttachmentInput } from './chat-attachment.input';

@InputType()
export class SendMessageInput {
  @Field(() => ID)
  @IsNumber()
  @IsNotEmpty()
  roomId: number;

  // Optional so a message can be attachment-only - ChatService.saveMessage still
  // requires at least one of message/attachments to be present.
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
