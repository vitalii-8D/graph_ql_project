import { Injectable } from '@nestjs/common';

import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { ES_INDICES } from '../elasticsearch/indices';
import { computeDocHash } from '../elasticsearch/hash.util';
import { UserSearchDocument } from '../elasticsearch/mappings/users.mapping';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserIndexService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  toDocument(user: UserEntity): UserSearchDocument {
    const fields: Omit<UserSearchDocument, '_hash'> = {
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city ?? undefined,
      location: user.latitude != null && user.longitude != null ? { lat: user.latitude, lon: user.longitude } : undefined,
      role: user.role,
      isOnline: user.isOnline,
      lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : undefined,
      createdAt: new Date(user.createdAt).toISOString(),
    };

    return { ...fields, _hash: computeDocHash(fields) };
  }

  async indexUser(user: UserEntity): Promise<void> {
    await this.elasticsearchService.indexDocument(ES_INDICES.users, user.id, this.toDocument(user));
  }

  async updateOnlineStatus(userId: number, isOnline: boolean, lastActiveAt: Date): Promise<void> {
    await this.elasticsearchService.updateDocument<UserSearchDocument>(ES_INDICES.users, userId, {
      isOnline,
      lastActiveAt: lastActiveAt.toISOString(),
    });
  }

  async deleteUser(userId: number): Promise<void> {
    await this.elasticsearchService.deleteDocument(ES_INDICES.users, userId);
  }
}
