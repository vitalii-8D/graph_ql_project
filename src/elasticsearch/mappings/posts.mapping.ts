import type { estypes } from '@elastic/elasticsearch';

import { type PostStatus, type PostPaymentStatus } from '../../posts/enums';

export interface PostSearchDocument {
  id: number;
  title: string;
  content: string;
  slug: string;
  status: PostStatus;
  paymentStatus: PostPaymentStatus;
  viewCount: number;
  readingTimeMinutes: number;
  commentCount: number;
  averageRating?: number | null;
  author: { id: number; name: string };
  categories: { id: number; name: string }[];
  createdAt: string;
  updatedAt: string;
  _hash: string;
}

/**
 * `content` is prose (unlike `title`, which is kept on the default standard analyzer for
 * exact-ish ranking): stemming + English stop-words trims noise so query_string/multi_match
 * matches "running" against "run" and doesn't score on "the"/"and".
 */
export const postsIndexSettings: estypes.IndicesIndexSettings = {
  analysis: {
    filter: {
      content_stop: { type: 'stop', stopwords: '_english_' },
      content_stemmer: { type: 'stemmer', language: 'english' },
    },
    analyzer: {
      post_content_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'content_stop', 'content_stemmer'],
      },
    },
  },
};

export const postsMapping: estypes.MappingTypeMapping = {
  properties: {
    id: { type: 'long' },
    title: { type: 'text' },
    content: { type: 'text', analyzer: 'post_content_analyzer' },
    slug: { type: 'keyword' },
    status: { type: 'keyword' },
    paymentStatus: { type: 'keyword' },
    viewCount: { type: 'integer' },
    readingTimeMinutes: { type: 'integer' },
    commentCount: { type: 'integer' },
    averageRating: { type: 'float' },
    author: {
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text' },
      },
    },
    categories: {
      properties: {
        id: { type: 'keyword' },
        name: { type: 'keyword' },
      },
    },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    _hash: { type: 'keyword' },
  },
};
