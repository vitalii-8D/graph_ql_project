import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsUrl } from 'class-validator';

import { CreateOpenGraphInput } from '../../open-graph/dto/create-open-graph.input';

@InputType()
export class PostMetadataInput implements Partial<CreateOpenGraphInput> {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  image?: string;

  @Field({ nullable: true })
  @IsOptional()
  imageAlt?: string;
}
