import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { UserAvatarsService } from './user-avatars.service';
import { UserAvatarEntity } from './entities/user-avatar.entity';
import { UserAvatarInput } from './dto/user-avatar.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/common';

@Resolver()
export class UserAvatarsResolver {
  constructor(private readonly userAvatarsService: UserAvatarsService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserAvatarEntity)
  updateAvatar(
    @Args('input') input: UserAvatarInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserAvatarEntity> {
    return this.userAvatarsService.upsertForUser(user.id, input);
  }
}
