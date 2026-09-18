import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

import { type IGqlContext } from '../../types/gql-context';

/**
 * Like GqlAuthGuard, but never rejects an unauthenticated request — it just leaves
 * `req.user` unset. Use for public reads that should still recognize a caller's own
 * identity when a valid token is present (e.g. an owner previewing their own draft).
 */
@Injectable()
export class OptionalGqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);

    return ctx.getContext<IGqlContext>().req;
  }

  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser | undefined {
    return user || undefined;
  }
}
