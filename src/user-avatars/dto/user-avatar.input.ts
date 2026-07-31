import { InputType, Field, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from '../../storage/constants/common';

@InputType()
export class UserAvatarInput {
  @Field()
  @IsString()
  key: string;

  @Field()
  @IsUrl()
  url: string;

  @Field()
  @IsString()
  @MaxLength(255)
  originalFileName: string;

  @Field()
  @IsIn(ALLOWED_IMAGE_MIME_TYPES)
  mimeType: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_SIZE_BYTES)
  sizeBytes: number;
}
