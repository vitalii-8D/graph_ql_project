import { Plugin } from '@nestjs/apollo';
import type {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContextDidResolveOperation,
  GraphQLRequestContextWillSendResponse,
} from '@apollo/server';

import { createLogger } from './logger';

const REDACTED_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'token']);

function redactVariables(variables: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(variables).map(([key, value]) => {
      if (REDACTED_KEYS.has(key)) {
        return [key, '[REDACTED]'];
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return [key, redactVariables(value as Record<string, unknown>)];
      }
      return [key, value];
    }),
  );
}

@Plugin()
export class GraphqlLoggingPlugin implements ApolloServerPlugin {
  private readonly logger = createLogger('Request');

  requestDidStart(): Promise<GraphQLRequestListener<object>> {
    const startedAt = Date.now();

    const logger = this.logger;

    return Promise.resolve({
      didResolveOperation({ request, operation, operationName }: GraphQLRequestContextDidResolveOperation<object>) {
        logger.info({
          type: operation?.operation ?? 'unknown',
          operationName: operationName ?? 'anonymous',
          variables: request.variables ? redactVariables(request.variables) : undefined,
        });

        return Promise.resolve();
      },

      willSendResponse({ operationName, errors }: GraphQLRequestContextWillSendResponse<object>) {
        logger.info({
          timestamp: new Date().toISOString(),
          operationName: operationName ?? 'anonymous',
          responseTimeMs: Date.now() - startedAt,
          ...(errors?.length ? { errors: errors.map((error) => error.message) } : {}),
        });

        return Promise.resolve();
      },
    });
  }
}
