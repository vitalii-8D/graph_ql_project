import { Injectable, OnModuleInit } from '@nestjs/common';

import { ElasticsearchService } from './elasticsearch.service';
import { ES_INDICES } from '../enums/indices';
import { usersMapping } from '../mappings/users.mapping';
import { postsMapping, postsIndexSettings } from '../mappings/posts.mapping';
import { commentsMapping } from '../mappings/comments.mapping';

@Injectable()
export class IndexSetupService implements OnModuleInit {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit(): Promise<void> {
    await Promise.all([
      this.elasticsearchService.ensureIndex(ES_INDICES.Users, usersMapping),
      this.elasticsearchService.ensureIndex(ES_INDICES.Posts, postsMapping, postsIndexSettings),
      this.elasticsearchService.ensureIndex(ES_INDICES.Comments, commentsMapping),
    ]);
  }
}
