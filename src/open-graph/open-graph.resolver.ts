import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { OpenGraphService } from './services/open-graph.service';
import { SocialSharingService } from './services/social-sharing.service';
import { OpenGraphMetadataEntity } from './entities/open-graph-metadata.entity';
import { CreateOpenGraphInput } from './dto/create-open-graph.input';
import { UpdateOpenGraphInput } from './dto/update-open-graph.input';
import { ShareLinks } from './dto/share-links.dto';

@Resolver(() => OpenGraphMetadataEntity)
export class OpenGraphResolver {
  constructor(
    private readonly openGraphService: OpenGraphService,
    private readonly socialSharingService: SocialSharingService,
  ) {}

  @Mutation(() => OpenGraphMetadataEntity)
  createOpenGraphMetadata(
    @Args('postId', { type: () => ID }) postId: number,
    @Args('createOpenGraphInput') createOpenGraphInput: CreateOpenGraphInput,
  ): Promise<OpenGraphMetadataEntity> {
    return this.openGraphService.create(postId, createOpenGraphInput);
  }

  @Query(() => [OpenGraphMetadataEntity], { name: 'openGraphMetadataList' })
  findAll(): Promise<OpenGraphMetadataEntity[]> {
    return this.openGraphService.findAll();
  }

  @Query(() => OpenGraphMetadataEntity, { name: 'openGraphMetadata' })
  findOne(@Args('id', { type: () => ID }) id: number): Promise<OpenGraphMetadataEntity> {
    return this.openGraphService.findOne(id);
  }

  @Query(() => OpenGraphMetadataEntity, { name: 'openGraphMetadataByPost', nullable: true })
  findByPostId(@Args('postId', { type: () => ID }) postId: number): Promise<OpenGraphMetadataEntity | null> {
    return this.openGraphService.findByPostId(postId);
  }

  @Mutation(() => OpenGraphMetadataEntity)
  updateOpenGraphMetadata(
    @Args('updateOpenGraphInput') updateOpenGraphInput: UpdateOpenGraphInput,
  ): Promise<OpenGraphMetadataEntity> {
    return this.openGraphService.update(updateOpenGraphInput);
  }

  @Mutation(() => OpenGraphMetadataEntity)
  removeOpenGraphMetadata(@Args('id', { type: () => ID }) id: number): Promise<OpenGraphMetadataEntity> {
    return this.openGraphService.remove(id);
  }

  @Query(() => ShareLinks, { name: 'generateShareLinks' })
  async generateShareLinks(
    @Args('url') url: string,
    @Args('postId', { type: () => ID, nullable: true }) postId?: number,
  ): Promise<ShareLinks> {
    let metadata: OpenGraphMetadataEntity | null = null;

    if (postId) {
      metadata = await this.openGraphService.findByPostId(postId);
    }

    return this.socialSharingService.generateShareLinks(url, metadata || undefined);
  }

  @Query(() => String, { name: 'generateOpenGraphTags' })
  async generateOpenGraphTags(
    @Args('id', { type: () => ID }) id: number,
    @Args('baseUrl') baseUrl: string,
  ): Promise<string> {
    const metadata = await this.openGraphService.findOne(id);
    return this.socialSharingService.generateOpenGraphTags(metadata, baseUrl);
  }
}
