import { prDebug } from '@francescozoccheddu/ts-goodies/logs';
import { Resolver } from 'pidby/serve/server';
import { fileExt } from 'pidby/utils/file';

export type Route = R<{
  extensions: RArr<Str>;
  resolver: Resolver;
  debugName: Str;
}>

export function makeRouterResolver(routes: RArr<Route>, debug: Bool = false): Resolver {
  const extDict = routes.flatMap(route =>
    route.extensions.map(ext => [ext.toLowerCase(), route] as const),
  ).toDict;
  return async (file) => {
    const route = extDict.get(fileExt(file));
    if (!route) {
      if (debug) {
        prDebug('No route found', { file });
      }
      return null;
    }
    if (debug) {
      prDebug('Route found', { file, route: route.debugName });
    }
    return await route.resolver(file);
  };
}