// Wraps an async iterator (e.g. a PubSub topic iterator) so `cleanup` runs exactly once, whenever
// the consumer stops iterating for any reason - the client unsubscribing, the operation erroring,
// or the underlying WebSocket connection dropping. graphql-ws/graphql-js call `.return()` on the
// resolver's returned iterator in all of those cases, which is what makes this the right place to
// hook "leave" side effects for a subscription, mirroring how ChatGateway hooks socket disconnects.
export function withAsyncIteratorCleanup<T>(
  source: AsyncIterableIterator<T>,
  cleanup: () => void | Promise<void>,
): AsyncIterableIterator<T> {
  let cleanedUp = false;
  const runCleanupOnce = async (): Promise<void> => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    await cleanup();
  };

  const wrapped: AsyncIterableIterator<T> = {
    next: (...args) => source.next(...args),
    return: async (value?: T | PromiseLike<T>) => {
      await runCleanupOnce();
      return source.return ? source.return(value) : { done: true as const, value: value as T };
    },
    throw: async (err?: unknown) => {
      await runCleanupOnce();
      if (source.throw) {
        return source.throw(err);
      }
      throw err;
    },
    [Symbol.asyncIterator]() {
      return wrapped;
    },
  };

  return wrapped;
}
