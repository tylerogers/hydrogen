import type {CacheOptions, QueryKey} from '../../types';
import {
  deleteItemFromCache,
  getItemFromCache,
  isStale,
  setItemInCache,
  hashKey,
} from '../../framework/cache';
import {runDelayedFunction} from '../../framework/runtime';
import {SuspensePromise} from './SuspensePromise';
import {useRequest} from '../RequestServerProvider/hook';

type SuspenseCache = Map<string, SuspensePromise<unknown>>;
let requestCaches: Map<string, SuspenseCache> = new Map();

function getRequestCache(): SuspenseCache {
  const {requestId} = useRequest();
  console.log('Request Id: ', requestId);

  let requestCache: SuspenseCache | undefined = requestCaches.get(requestId);
  if (!requestCache) {
    requestCache = new Map();
    requestCaches.set(requestId, requestCache);
  }
  return requestCache;
}

export interface HydrogenUseQueryOptions {
  cache: CacheOptions;
}

export function clearRequestCache(requestId: string) {
  requestCaches.delete(requestId);
  logg(`Clear cache on ${requestId} request`);
}

/**
 * The `useQuery` hook is a wrapper around Suspense calls and
 * global runtime's Cache if it exist.
 * It supports Suspense calls on the server and on the client.
 */
export function useQuery<T>(
  /** A string or array to uniquely identify the current query. */
  key: QueryKey,
  /** An asynchronous query function like `fetch` which returns data. */
  queryFn: () => Promise<T>,
  /** Options including `cache` to manage the cache behavior of the sub-request. */
  queryOptions?: HydrogenUseQueryOptions
): T {
  console.log(`\nLoading ${findQueryname(key)} query`);
  const suspensePromise = getSuspensePromise<T>(key, queryFn, queryOptions);
  const status = suspensePromise.status;

  if (status === SuspensePromise.PENDING) {
    throw suspensePromise.promise;
  } else if (status === SuspensePromise.ERROR) {
    throw suspensePromise.result;
  } else if (status === SuspensePromise.SUCCESS) {
    return suspensePromise.result as T;
  }

  throw 'useQuery - something is really wrong if this throws';
}

/**
 * Preloads the query with suspense support
 */
export function preloadQuery<T>(
  /** A string or array to uniquely identify the current query. */
  key: QueryKey,
  /** An asynchronous query function like `fetch` which returns data. */
  queryFn: () => Promise<T>,
  /** Options including `cache` to manage the cache behavior of the sub-request. */
  queryOptions?: HydrogenUseQueryOptions
): void {
  logg(`\nPreloading ${findQueryname(key)} query`);
  getSuspensePromise<T>(key, queryFn, queryOptions);
}

function findQueryname(key: QueryKey) {
  const match = (typeof key === 'string' ? key : key.join()).match(
    /query ([^\s\()]*)\s?(|\(\{)/
  );
  if (match && match.length > 1) {
    return match[1];
  }
  return '<unknown>';
}

function log(...text: any[]) {
  console.log('\x1b[33m%s\x1b[0m', ...text);
}

function logg(...text: any[]) {
  console.log('\x1b[32m%s\x1b[0m', ...text);
}

function getSuspensePromise<T>(
  key: QueryKey,
  queryFn: () => Promise<T>,
  queryOptions?: HydrogenUseQueryOptions
): SuspensePromise<T> {
  const cacheKey = hashKey(key);
  const suspenseCache = getRequestCache();
  let suspensePromise = suspenseCache.get(cacheKey);
  if (!suspensePromise) {
    suspensePromise = new SuspensePromise<T>(
      cachedQueryFnBuilder(key, queryFn, queryOptions),
      queryOptions?.cache?.maxAge
    );
    suspenseCache.set(cacheKey, suspensePromise);
    console.log(`${findQueryname(key)} SuspensePromise created`);
  }
  return suspensePromise as SuspensePromise<T>;
}

function cachedQueryFnBuilder<T>(
  key: QueryKey,
  queryFn: () => Promise<T>,
  queryOptions?: HydrogenUseQueryOptions
): () => Promise<T> {
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

      return output as T;
    }

    const newOutput = await generateNewOutput();

    /**
     * Important: Do this async
     */
    runDelayedFunction(
      async () =>
        await setItemInCache(key, newOutput, resolvedQueryOptions?.cache)
    );

    return newOutput as T;
  }

  return cachedQueryFn;
}
