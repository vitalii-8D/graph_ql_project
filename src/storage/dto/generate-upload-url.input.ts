import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsIn, IsString, MaxLength } from 'class-validator';

import { UploadPurpose } from '../enums/common';
import { ALLOWED_IMAGE_MIME_TYPES } from '../constants/common';

@InputType()
export class GenerateUploadUrlInput {
  @Field(() => UploadPurpose)
  @IsEnum(UploadPurpose)
  purpose: UploadPurpose;

  @Field()
  @IsString()
  @MaxLength(255)
  fileName: string;

  @Field()
  @IsIn(ALLOWED_IMAGE_MIME_TYPES)
  contentType: string;
}
