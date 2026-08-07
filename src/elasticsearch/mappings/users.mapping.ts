import type { estypes } from '@elastic/elasticsearch';

import { type UserRole } from '../../users/enums';

export interface UserSearchDocument {
  id: number;
  name: string;
  email: string;
  city?: string;
  location?: { lat: number; lon: number };
  role: UserRole;
  isOnline: boolean;
  lastActiveAt?: string;
  createdAt: string;
  _hash: string;
}

export const usersMapping: estypes.MappingTypeMapping = {
  properties: {
    id: { type: 'long' },
    name: { type: 'text' },
    email: { type: 'text' },
    city: { type: 'text', fields: { keyword: { type: 'keyword' } } },
    location: { type: 'geo_point' },
    role: { type: 'keyword' },
    isOnline: { type: 'boolean' },
    lastActiveAt: { type: 'date' },
    createdAt: { type: 'date' },
    _hash: { type: 'keyword' },
  },
};
