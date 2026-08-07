import type { estypes } from '@elastic/elasticsearch';

import { type PostStatus } from '../../posts/enums';

export interface PostSearchDocument {
  id: number;
  title: string;
  content: string;
  slug: string;
  status: PostStatus;
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

export const postsMapping: estypes.MappingTypeMapping = {
  properties: {
    id: { type: 'long' },
    title: { type: 'text' },
    content: { type: 'text' },
    slug: { type: 'keyword' },
    status: { type: 'keyword' },
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
