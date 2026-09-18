import { type ApolloDriverConfig } from '@nestjs/apollo';

import { type AuthService } from './auth/auth.service';
import { createLogger } from './utils/logger';

const logger = createLogger('GraphqlSubscriptions');

// The `extra` bag graphql-ws attaches to every WebSocket connection - populated in `onConnect`
// below with the raw bearer token, then read back out in `context` for every
// query/mutation/subscription sent over that socket so it can be forwarded as an `Authorization`
// header. GqlAuthGuard runs the real `passport-jwt` strategy (JwtStrategy) against `req.headers`
// on every guarded call, HTTP or WS alike - so the token has to be re-attached here rather than
// just resolving the user once at connect time.
export interface ChatSocketExtra {
  token?: string;
}

interface GraphqlWsOnConnectContext {
  connectionParams?: Readonly<Record<string, unknown>>;
  extra: ChatSocketExtra;
}

export function createGraphqlSubscriptionsConfig(
  authService: AuthService,
): Pick<ApolloDriverConfig, 'subscriptions' | 'context'> {
  return {
    subscriptions: {
      'graphql-ws': {
        onConnect: async (rawContext: unknown) => {
          const context = rawContext as GraphqlWsOnConnectContext;

          const authorizationHeader =
            context.connectionParams?.authorization ?? context.connectionParams?.Authorization;
          const token = authService.extractTokenFromAuthorizationHeader(authorizationHeader);
          if (!token) {
            logger.error({ msg: 'GraphQL WS handshake rejected: missing bearer token' });
            throw new Error('Unauthorized');
          }

          try {
            await authService.verifyAccessToken(token);
          } catch (err) {
            logger.error(err);
            throw new Error('Unauthorized');
          }

          context.extra.token = token;
        },
      },
    },
    context: (contextOrRequest: { req?: unknown; extra?: ChatSocketExtra }) => {
      if (contextOrRequest.req) {
        return { req: contextOrRequest.req };
      }

      // No `req` means this operation came in over the graphql-ws WebSocket transport - build a
      // minimal request-shaped object carrying the bearer token as a header, so
      // GqlAuthGuard/CurrentUser/RolesGuard (which all expect an HTTP-request-shaped GraphQL
      // context) work completely unmodified for subscriptions and WS-transported mutations too.
      const token = contextOrRequest.extra?.token;

      return { req: { headers: { authorization: token ? `Bearer ${token}` : undefined } } };
    },
  };
}
