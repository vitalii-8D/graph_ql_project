import { ObjectType, Field } from '@nestjs/graphql';
import { UserEntity } from '../../users/entities/user.entity';

@ObjectType()
export class AuthResponse {
  @Field()
  access_token: string;

  @Field(() => UserEntity)
  user: Omit<UserEntity, 'password'>;
}
