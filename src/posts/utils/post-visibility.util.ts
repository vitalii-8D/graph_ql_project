import { PostPaymentStatus, PostStatus } from '../enums';

const PUBLICLY_VISIBLE_PAYMENT_STATUSES = [PostPaymentStatus.SUCCEEDED, PostPaymentStatus.NOT_REQUIRED];

/** A post is visible to anonymous/other users only once published and payment-cleared. */
export function isPostPubliclyVisible(post: { status: PostStatus; paymentStatus: PostPaymentStatus }): boolean {
  return post.status === PostStatus.PUBLISHED && PUBLICLY_VISIBLE_PAYMENT_STATUSES.includes(post.paymentStatus);
}
