import { UploadPurpose } from '../enums/common';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, advisory (client-enforced)

export const UPLOAD_KEY_PREFIX: Record<UploadPurpose, string> = {
  [UploadPurpose.POST_IMAGE]: 'posts',
  [UploadPurpose.USER_AVATAR]: 'avatars',
};
