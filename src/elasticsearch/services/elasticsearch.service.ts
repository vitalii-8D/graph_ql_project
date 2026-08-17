import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, estypes } from '@elastic/elasticsearch';

import { config } from '../../constants/config';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);

  readonly client = new Client({ node: config.elasticsearch.node });

  async onModuleInit(): Promise<void> {
    try {
      await this.client.ping();
    } catch {
      this.logger.warn(
        `Elasticsearch is unreachable at ${config.elasticsearch.node} — search/analytics will error until it comes up.`,
      );
    }
  }

  async ensureIndex(
    index: string,
    mappings: estypes.MappingTypeMapping,
    settings?: estypes.IndicesIndexSettings,
  ): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index });
      if (!exists) {
        await this.client.indices.create({ index, mappings, settings });
      }
    } catch (error) {
      this.logger.warn(`Failed to ensure index "${index}": ${(error as Error).message}`);
    }
  }

  async indexDocument<T extends object>(index: string, id: string | number, document: T): Promise<void> {
    try {
      await this.client.index({ index, id: String(id), document });
    } catch (error) {
      this.logger.warn(`Failed to index document ${index}/${id}: ${(error as Error).message}`);
    }
  }

  async updateDocument<T extends object>(index: string, id: string | number, partial: Partial<T>): Promise<void> {
    try {
      // doc_as_upsert: the target document may not exist yet (e.g. ES was down at create time,
      // or this is a partial-field update like presence that fires far more often than create)
      await this.client.update({ index, id: String(id), doc: partial, doc_as_upsert: true });
    } catch (error) {
      this.logger.warn(`Failed to update document ${index}/${id}: ${(error as Error).message}`);
    }
  }

  async deleteDocument(index: string, id: string | number): Promise<void> {
    try {
      await this.client.delete({ index, id: String(id) });
    } catch (error) {
      this.logger.warn(`Failed to delete document ${index}/${id}: ${(error as Error).message}`);
    }
  }

  async search<T>(index: string, request: estypes.SearchRequest): Promise<estypes.SearchResponse<T>> {
    return this.client.search<T>({ ...request, index });
  }

  async msearch<T>(searches: { index: string; body: estypes.SearchRequest }[]): Promise<estypes.MsearchResponse<T>> {
    const operations: estypes.MsearchRequestItem[] = searches.flatMap(({ index, body }) => [{ index }, body]);
    return this.client.msearch<T>({ searches: operations });
  }

  async bulk(operations: object[]): Promise<void> {
    if (operations.length === 0) {
      return;
    }

    const response = await this.client.bulk({ operations });
    if (response.errors) {
      const failedItems = response.items.filter((item) => Object.values(item)[0]?.error);
      this.logger.warn(`Bulk operation had ${failedItems.length} failures: ${JSON.stringify(failedItems.slice(0, 3))}`);
    }
  }
}
