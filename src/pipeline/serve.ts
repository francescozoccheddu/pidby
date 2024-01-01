import { orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { Config, ensureValidConfig } from 'pidby/config';
import { compilePage } from 'pidby/process/compilePage';
import { compileScript } from 'pidby/process/compileScript';
import { compileStyle } from 'pidby/process/compileStyle';
import { makeCachedResolver } from 'pidby/serve/cachedResolver';
import { makeRouterResolver } from 'pidby/serve/routerResolver';
import { noResolver, randomPort, ResolvedFile, Resolver, Server } from 'pidby/serve/server';

export type ServeInstance = R<{
  rootUrl: Str;
  config(config: Config | Nul): void;
}>

function makeResolver(config: Config): Resolver {
  const router = makeRouterResolver([
    {
      debugName: 'script',
      extensions: ['ts', 'js'],
      async resolver(file): Promise<ResolvedFile> {
        return {
          data: await compileScript(file, config),
          mimeType: 'text/javascript',
        };
      },
    },
    {
      debugName: 'style',
      extensions: ['css', 'sass', 'scss'],
      async resolver(file): Promise<ResolvedFile> {
        return {
          data: await compileStyle(file, config),
          mimeType: 'text/css',
        };
      },
    },
    {
      debugName: 'page',
      extensions: ['pug', 'html', 'ejs'],
      resolver(file): ResolvedFile {
        return {
          data: compilePage(file, config),
          mimeType: 'text/html',
        };
      },
    },
  ], config.debug);
  return makeCachedResolver(router);
}

export type Task<TRes = void> = (instance: ServeInstance) => Promise<TRes> | TRes;

export async function serve<TRes>(task: Task<TRes>, port: Num = randomPort(), host: Str = '127.0.0.1'): Promise<TRes> {
  return await orThrowAsync(async () => {
    function unconfig(): void {
      server.rootDir = null;
      server.resolver = noResolver;
    }
    const server = new Server(host, port);
    try {
      await server.start();
      unconfig();
      return await task({
        rootUrl: server.url,
        config(config) {
          if (config) {
            try {
              ensureValidConfig(config);
              server.rootDir = config.rootDir;
              server.resolver = makeResolver(config);
            } catch (e) {
              unconfig();
              throw e;
            }
          } else {
            unconfig();
          }
        },
      });
    } finally {
      server.stop();
    }
  }, 'Error while serving config');
}
