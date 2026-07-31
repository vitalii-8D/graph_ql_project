import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PresignedUploadPayload {
  @Field()
  uploadUrl: string;

  @Field()
  publicUrl: string;

  @Field()
  key: string;
}
