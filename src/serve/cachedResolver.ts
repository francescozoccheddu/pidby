import { ResolvedFile, Resolver } from 'pidby/serve/server';

export function makeCachedResolver(resolver: Resolver): Resolver {
  const cache: StrDict<ResolvedFile | Nul> = new Dict();
  return async (file: Str) => await cache.getOrSetAsync(file, async () => await resolver(file));
}