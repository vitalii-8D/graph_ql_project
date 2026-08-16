import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { BadRequestException, UseGuards } from '@nestjs/common';

import { StorageService } from './storage.service';
import { GenerateUploadUrlInput } from './dto/generate-upload-url.input';
import { PresignedUploadPayload } from './dto/presigned-upload.type';
import { ALLOWED_MIME_TYPES_BY_PURPOSE, UPLOAD_KEY_PREFIX } from './constants/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/common';

@Resolver()
export class StorageResolver {
  constructor(private readonly storageService: StorageService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => PresignedUploadPayload)
  async generateUploadUrl(
    @Args('input') input: GenerateUploadUrlInput,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<PresignedUploadPayload> {
    const allowedMimeTypes = ALLOWED_MIME_TYPES_BY_PURPOSE[input.purpose];
    if (allowedMimeTypes && !allowedMimeTypes.includes(input.contentType)) {
      throw new BadRequestException(`Unsupported content type for ${input.purpose}: ${input.contentType}`);
    }

    const key = this.storageService.buildObjectKey(UPLOAD_KEY_PREFIX[input.purpose], input.fileName);
    const uploadUrl = await this.storageService.generateUploadUrl(key, input.contentType);

    return { uploadUrl, publicUrl: this.storageService.buildPublicUrl(key), key };
  }
}
