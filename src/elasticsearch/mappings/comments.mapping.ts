import type { estypes } from '@elastic/elasticsearch';

export interface CommentSearchDocument {
  id: number;
  postId: number;
  authorId: number;
  content: string;
  rating: number;
  createdAt: string;
  _hash: string;
}

export const commentsMapping: estypes.MappingTypeMapping = {
  properties: {
    id: { type: 'long' },
    postId: { type: 'keyword' },
    authorId: { type: 'keyword' },
    // Deliberately no `.keyword` sub-field: significant_terms (admin analytics) needs the
    // analyzed tokens, not exact-match strings.
    content: { type: 'text' },
    rating: { type: 'integer' },
    createdAt: { type: 'date' },
    _hash: { type: 'keyword' },
  },
};
