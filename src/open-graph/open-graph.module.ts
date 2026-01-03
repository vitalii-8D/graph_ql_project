import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenGraphMetadata } from './entities/open-graph-metadata.entity';
import { Post } from '../posts/entities/post.entity';
import { OpenGraphService } from './services/open-graph.service';
import { SocialSharingService } from './services/social-sharing.service';
import { OpenGraphResolver } from './resolvers/open-graph.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([OpenGraphMetadata, Post])],
  providers: [OpenGraphResolver, OpenGraphService, SocialSharingService],
  exports: [OpenGraphService, SocialSharingService],
})
export class OpenGraphModule {}
