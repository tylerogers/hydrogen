import React from 'react';
import {RenderCacheContext} from './RenderCacheContext';
import type {RenderCacheProviderProps} from './types';

export function RenderCacheProvider({
  cache,
  preloadCache,
  startTimestamp,
  children,
}: RenderCacheProviderProps) {
  return (
    <RenderCacheContext.Provider
      value={{
        cache,
        preloadCache,
        startTimestamp,
      }}
    >
      {children}
    </RenderCacheContext.Provider>
  );
}
