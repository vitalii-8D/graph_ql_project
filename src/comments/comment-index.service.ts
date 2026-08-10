import { Injectable } from '@nestjs/common';

import { ElasticsearchService } from '../elasticsearch/services/elasticsearch.service';
import { ES_INDICES } from '../elasticsearch/enums/indices';
import { computeDocHash } from '../elasticsearch/utils/hash.util';
import { CommentSearchDocument } from '../elasticsearch/mappings/comments.mapping';
import { CommentEntity } from './entities/comment.entity';

@Injectable()
export class CommentIndexService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  toDocument(comment: CommentEntity): CommentSearchDocument {
    const fields: Omit<CommentSearchDocument, '_hash'> = {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      rating: comment.rating,
      createdAt: new Date(comment.createdAt).toISOString(),
    };

    return { ...fields, _hash: computeDocHash(fields) };
  }

  async indexComment(comment: CommentEntity): Promise<void> {
    await this.elasticsearchService.indexDocument(ES_INDICES.Comments, comment.id, this.toDocument(comment));
  }

  async deleteComment(commentId: number): Promise<void> {
    await this.elasticsearchService.deleteDocument(ES_INDICES.Comments, commentId);
  }
}
