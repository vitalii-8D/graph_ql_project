import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { type IGqlContext } from '../types/gql-context';

export const ClientIp = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const ctx = GqlExecutionContext.create(context);
  const req = ctx.getContext<IGqlContext>().req;

  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
});
