import { ObjectType, Field } from '@nestjs/graphql';

import { UserEntity } from '../entities/user.entity';

@ObjectType()
export class UserSearchResult {
  @Field(() => [UserEntity])
  items: UserEntity[];

  @Field({ nullable: true })
  nextCursor?: string;
}
