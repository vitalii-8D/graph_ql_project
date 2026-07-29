import { ObjectType, Field } from '@nestjs/graphql';

import { UserEntity } from '../../users/entities/user.entity';
import { type AuthenticatedUser } from '../types/common';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => UserEntity)
  user: AuthenticatedUser;
}
