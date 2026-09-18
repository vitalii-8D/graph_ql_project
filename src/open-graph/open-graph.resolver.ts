import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { OpenGraphService } from './services/open-graph.service';
import { SocialSharingService } from './services/social-sharing.service';
import { OpenGraphMetadataEntity } from './entities/open-graph-metadata.entity';
import { CreateOpenGraphInput } from './dto/create-open-graph.input';
import { UpdateOpenGraphInput } from './dto/update-open-graph.input';
import { ShareLinks } from './dto/share-links.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { OptionalGqlAuthGuard } from '../auth/guards/optional-gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/common';
import { config } from '../constants/config';

@Resolver(() => OpenGraphMetadataEntity)
export class OpenGraphResolver {
  constructor(
    private readonly openGraphService: OpenGraphService,
    private readonly socialSharingService: SocialSharingService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => OpenGraphMetadataEntity)
  createOpenGraphMetadata(
    @Args('postId', { type: () => ID }) postId: number,
    @Args('createOpenGraphInput') createOpenGraphInput: CreateOpenGraphInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpenGraphMetadataEntity> {
    return this.openGraphService.createForPost(postId, createOpenGraphInput, user);
  }

  @UseGuards(OptionalGqlAuthGuard)
  @Query(() => [OpenGraphMetadataEntity], { name: 'openGraphMetadataList' })
  findAll(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<OpenGraphMetadataEntity[]> {
    return this.openGraphService.findAll(user, limit, offset);
  }

  @UseGuards(OptionalGqlAuthGuard)
  @Query(() => OpenGraphMetadataEntity, { name: 'openGraphMetadata' })
  findOne(
    @Args('id', { type: () => ID }) id: number,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<OpenGraphMetadataEntity> {
    return this.openGraphService.findOne(id, user);
  }

  @UseGuards(OptionalGqlAuthGuard)
  @Query(() => OpenGraphMetadataEntity, { name: 'openGraphMetadataByPost', nullable: true })
  findByPostId(
    @Args('postId', { type: () => ID }) postId: number,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<OpenGraphMetadataEntity | null> {
    return this.openGraphService.findByPostId(postId, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => OpenGraphMetadataEntity)
  updateOpenGraphMetadata(
    @Args('updateOpenGraphInput') updateOpenGraphInput: UpdateOpenGraphInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpenGraphMetadataEntity> {
    return this.openGraphService.update(updateOpenGraphInput, user);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => OpenGraphMetadataEntity)
  removeOpenGraphMetadata(
    @Args('id', { type: () => ID }) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OpenGraphMetadataEntity> {
    return this.openGraphService.remove(id, user);
  }

  @UseGuards(OptionalGqlAuthGuard)
  @Query(() => ShareLinks, { name: 'generateShareLinks' })
  async generateShareLinks(
    @Args('url') url: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Args('postId', { type: () => ID, nullable: true }) postId?: number,
  ): Promise<ShareLinks> {
    let metadata: OpenGraphMetadataEntity | null = null;

    if (postId) {
      metadata = await this.openGraphService.findByPostId(postId, user);
    }

    return this.socialSharingService.generateShareLinks(url, metadata ?? undefined);
  }

  @UseGuards(OptionalGqlAuthGuard)
  @Query(() => String, { name: 'generateOpenGraphTags' })
  async generateOpenGraphTags(
    @Args('id', { type: () => ID }) id: number,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<string> {
    const metadata = await this.openGraphService.findOne(id, user);
    return this.socialSharingService.generateOpenGraphTags(metadata, config.app.webUrl);
  }
}
