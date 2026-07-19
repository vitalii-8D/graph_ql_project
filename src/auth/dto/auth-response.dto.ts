import { ObjectType, Field } from '@nestjs/graphql';

import { UserEntity } from '../../users/entities/user.entity';
import { type AuthenticatedUser } from '../types';

@ObjectType()
export class AuthResponse {
  @Field()
  access_token: string;

  @Field(() => UserEntity)
  user: AuthenticatedUser;
}
