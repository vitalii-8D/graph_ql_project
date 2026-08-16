import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

import { MAX_CHAT_ATTACHMENT_SIZE_BYTES } from '../../storage/constants/common';

@InputType()
export class ChatAttachmentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  key: string;

  @Field()
  @IsUrl()
  url: string;

  @Field()
  @IsString()
  @MaxLength(255)
  originalFileName: string;

  // Any content type is accepted - chat attachments aren't restricted to images.
  @Field()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(MAX_CHAT_ATTACHMENT_SIZE_BYTES)
  sizeBytes: number;
}
