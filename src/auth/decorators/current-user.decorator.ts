import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { type IGqlContext } from '../../types/gql-context';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);

  return ctx.getContext<IGqlContext>().req.user;
});
