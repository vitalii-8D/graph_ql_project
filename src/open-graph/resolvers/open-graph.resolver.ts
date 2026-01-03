import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { OpenGraphService } from '../services/open-graph.service';
import { SocialSharingService } from '../services/social-sharing.service';
import { OpenGraphMetadata } from '../entities/open-graph-metadata.entity';
import { CreateOpenGraphInput } from '../dto/create-open-graph.input';
import { UpdateOpenGraphInput } from '../dto/update-open-graph.input';
import { ShareLinks } from '../types/share-links.type';

@Resolver(() => OpenGraphMetadata)
export class OpenGraphResolver {
  constructor(
    private readonly openGraphService: OpenGraphService,
    private readonly socialSharingService: SocialSharingService,
  ) {}

  @Mutation(() => OpenGraphMetadata)
  createOpenGraphMetadata(
    @Args('postId', { type: () => ID }) postId: number,
    @Args('createOpenGraphInput') createOpenGraphInput: CreateOpenGraphInput,
  ): Promise<OpenGraphMetadata> {
    return this.openGraphService.create(postId, createOpenGraphInput);
  }

  @Query(() => [OpenGraphMetadata], { name: 'openGraphMetadataList' })
  findAll(): Promise<OpenGraphMetadata[]> {
    return this.openGraphService.findAll();
  }

  @Query(() => OpenGraphMetadata, { name: 'openGraphMetadata' })
  findOne(@Args('id', { type: () => ID }) id: number): Promise<OpenGraphMetadata> {
    return this.openGraphService.findOne(id);
  }

  @Query(() => OpenGraphMetadata, { name: 'openGraphMetadataByPost', nullable: true })
  findByPostId(@Args('postId', { type: () => ID }) postId: number): Promise<OpenGraphMetadata | null> {
    return this.openGraphService.findByPostId(postId);
  }

  @Mutation(() => OpenGraphMetadata)
  updateOpenGraphMetadata(
    @Args('updateOpenGraphInput') updateOpenGraphInput: UpdateOpenGraphInput,
  ): Promise<OpenGraphMetadata> {
    return this.openGraphService.update(updateOpenGraphInput);
  }

  @Mutation(() => OpenGraphMetadata)
  removeOpenGraphMetadata(@Args('id', { type: () => ID }) id: number): Promise<OpenGraphMetadata> {
    return this.openGraphService.remove(id);
  }

  @Query(() => ShareLinks, { name: 'generateShareLinks' })
  async generateShareLinks(
    @Args('url') url: string,
    @Args('postId', { type: () => ID, nullable: true }) postId?: number,
  ): Promise<ShareLinks> {
    let metadata: OpenGraphMetadata | null = null;

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
