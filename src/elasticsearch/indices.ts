export const ES_INDICES = {
  users: 'users',
  posts: 'posts',
  comments: 'comments',
} as const;

export type EsIndexName = (typeof ES_INDICES)[keyof typeof ES_INDICES];
