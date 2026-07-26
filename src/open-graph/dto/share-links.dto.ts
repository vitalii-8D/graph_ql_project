import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ShareLinks {
  @Field()
  facebook: string;

  @Field()
  twitter: string;

  @Field()
  linkedin: string;

  @Field()
  whatsapp: string;

  @Field()
  telegram: string;
}
