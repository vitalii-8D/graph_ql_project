import { registerEnumType } from '@nestjs/graphql';

export enum UploadPurpose {
  POST_IMAGE = 'POST_IMAGE',
  USER_AVATAR = 'USER_AVATAR',
}

registerEnumType(UploadPurpose, {
  name: 'UploadPurpose',
  description: 'Purpose of a presigned upload, used to determine the S3 key prefix',
});
