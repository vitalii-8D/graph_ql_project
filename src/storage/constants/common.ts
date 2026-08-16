import { UploadPurpose } from '../enums/common';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, advisory (client-enforced)

// Chat attachments accept arbitrary file types, so unlike images they're capped by size only.
export const MAX_CHAT_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25MB, advisory (client-enforced)

export const UPLOAD_KEY_PREFIX: Record<UploadPurpose, string> = {
  [UploadPurpose.POST_IMAGE]: 'posts',
  [UploadPurpose.USER_AVATAR]: 'avatars',
  [UploadPurpose.CHAT_ATTACHMENT]: 'chat-attachments',
};

// null means any content type is accepted for that purpose (validated against size only).
export const ALLOWED_MIME_TYPES_BY_PURPOSE: Record<UploadPurpose, string[] | null> = {
  [UploadPurpose.POST_IMAGE]: ALLOWED_IMAGE_MIME_TYPES,
  [UploadPurpose.USER_AVATAR]: ALLOWED_IMAGE_MIME_TYPES,
  [UploadPurpose.CHAT_ATTACHMENT]: null,
};
