import { Global, Module } from '@nestjs/common';

import { ElasticsearchService } from './elasticsearch.service';
import { IndexSetupService } from './index-setup.service';

@Global()
@Module({
  providers: [ElasticsearchService, IndexSetupService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
