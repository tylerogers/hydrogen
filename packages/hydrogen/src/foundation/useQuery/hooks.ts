import {CacheOptions} from '../../types';
import {
  deleteItemFromCache,
  getItemFromCache,
  hashKey,
  isStale,
  setItemInCache,
} from '../../framework/cache';
import {runDelayedFunction} from '../../framework/runtime';
import {useRequest} from '../../framework/RequestContext';

export interface HydrogenUseQueryOptions {
  cache: CacheOptions;
}

/**
 * The `useQuery` hook is a wrapper around `useQuery` from `react-query`. It supports Suspense calls on the server and on the client.
 */
export function useQuery<T>(
  /** A string or array to uniquely identify the current query. */
  key: string | unknown[],
  /** An asynchronous query function like `fetch` which returns data. */
  queryFn: () => Promise<T>,
  /** Options including `cache` to manage the cache behavior of the sub-request. */
  queryOptions?: HydrogenUseQueryOptions
) {
  const resolvedQueryOptions = {
    ...(queryOptions ?? {}),
  };

  /**
   * Attempt to read the query from cache. If it doesn't exist or if it's stale, regenerate it.
   */
  async function cachedQueryFn() {
    const cacheResponse = await getItemFromCache(key);

    async function generateNewOutput() {
      return await queryFn();
    }

    if (cacheResponse) {
      const [output, response] = cacheResponse;

      /**
       * Important: Do this async
       */
      if (isStale(response)) {
        console.log(
          '[useQuery] cache stale; generating new response in background'
        );
        const lockKey = `lock-${key}`;

        runDelayedFunction(async () => {
          console.log(`[stale regen] fetching cache lock`);
          const lockExists = await getItemFromCache(lockKey);
          if (lockExists) return;

          await setItemInCache(lockKey, true);
          try {
            const output = await generateNewOutput();
            await setItemInCache(key, output, resolvedQueryOptions?.cache);
          } catch (e: any) {
            console.error(`Error generating async response: ${e.message}`);
          } finally {
            await deleteItemFromCache(lockKey);
          }
        });
      }

      return output;
    }

    const newOutput = await generateNewOutput();

    /**
     * Important: Do this async
     */
    runDelayedFunction(
      async () =>
        await setItemInCache(key, newOutput, resolvedQueryOptions?.cache)
    );

    return newOutput;
  }

  const data = useData(key, cachedQueryFn);

  return {data};
}

export function useData(
  cacheKey: string | Array<any>,
  fetcher: () => Promise<any>
) {
  const key = hashKey(cacheKey);
  const {cache} = useRequest();

  if (!cache[key]) {
    let data: any;
    let promise: Promise<any>;
    cache[key] = () => {
      if (data !== undefined) return data;
      if (!promise) promise = fetcher().then((r) => (data = r));
      throw promise;
    };
  }
  return cache[key]();
}
