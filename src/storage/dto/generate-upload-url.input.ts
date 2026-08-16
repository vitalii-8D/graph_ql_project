import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { UploadPurpose } from '../enums/common';

@InputType()
export class GenerateUploadUrlInput {
  @Field(() => UploadPurpose)
  @IsEnum(UploadPurpose)
  purpose: UploadPurpose;

  @Field()
  @IsString()
  @MaxLength(255)
  fileName: string;

  // Allowed values depend on `purpose` (e.g. images-only vs any file) - checked in
  // StorageResolver against ALLOWED_MIME_TYPES_BY_PURPOSE rather than statically here.
  @Field()
  @IsString()
  @IsNotEmpty()
  contentType: string;
}
