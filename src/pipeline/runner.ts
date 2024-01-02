import { orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { Config, ensureValidConfig } from 'pidby/config';
import { compilePage } from 'pidby/process/compilePage';
import { compileScript } from 'pidby/process/compileScript';
import { compileStyle } from 'pidby/process/compileStyle';
import { makeCachedResolver } from 'pidby/serve/cachedResolver';
import { makeRouterResolver } from 'pidby/serve/routerResolver';
import { noResolver, ResolvedFile, Resolver, ServeErrorHandler, Server } from 'pidby/serve/server';
import { resolvePathToUrl } from 'pidby/utils/files';
import { getUrl, randomPort } from 'pidby/utils/net';

export type Task<TRes = void> = (runner: TaskRunner) => Promise<TRes> | TRes;

export class TaskRunner {

  private _config: Config | Nul;
  private readonly _server: Server;

  constructor(host: Str = '127.0.0.1', port: Num = randomPort()) {
    this._server = new Server(host, port);
    this._config = null;
    this.unconfig();
  }

  get port(): Num {
    return this._server.port;
  }

  get host(): Str {
    return this._server.host;
  }

  get onError(): ServeErrorHandler {
    return this._server.onError;
  }

  set onError(onError: ServeErrorHandler) {
    this._server.onError = onError;
  }

  get url(): Str {
    return getUrl(this._server.host, this._server.port);
  }

  fileUrl(file: Str): Str {
    const config = this._config ?? err('No config');
    return resolvePathToUrl(file, config.rootDir, this.url);
  }

  private unconfig(): void {
    this._config = null;
    this._server.rootDir = null;
    this._server.resolver = noResolver;
  }

  get config(): Config | Nul {
    return this._config;
  }

  set config(config: Config | Nul) {
    this.unconfig();
    if (config) {
      ensureValidConfig(config);
      this._server.rootDir = config.rootDir;
      this._server.resolver = makeResolver(config);
    }
  }

  async run<TRes>(task: Task<TRes>): Promise<TRes> {
    return await orThrowAsync(async () => {
      try {
        await this._server.start();
        return await task(this);
      } finally {
        this._server.stop();
      }
    }, 'Error while running task');
  }

}

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

export async function run<TRes>(task: Task<TRes>, port: Num = randomPort(), host: Str = '127.0.0.1'): Promise<TRes> {
  return await new TaskRunner(host, port).run(task);
}
