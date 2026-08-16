export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// Gates public visibility of a post's PUBLISHED status behind a successful one-time payment.
export enum PostPaymentStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
