import { Global, Module } from '@nestjs/common';

import { ElasticsearchService } from './services/elasticsearch.service';
import { IndexSetupService } from './services/index-setup.service';

@Global()
@Module({
  providers: [ElasticsearchService, IndexSetupService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
