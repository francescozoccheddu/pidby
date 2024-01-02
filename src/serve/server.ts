import { orThrow, orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { prExc } from '@francescozoccheddu/ts-goodies/logs';
import { Server as KoaServer } from 'http';
import Koa from 'koa';
import send from 'koa-send';
import path from 'path';
import { isExistingFile, resolvePath } from 'pidby/utils/files';
import { randomPort } from 'pidby/utils/net';

export type ResolvedFile = R<{
  data: Buffer | Str;
  mimeType: Str;
}>

export type Resolver = (file: Str) => Promise<ResolvedFile | Nul> | ResolvedFile | Nul;

export const noResolver: Resolver = () => null;

export type RetrieverFilter = R<{
  extensions: RArr<Str>;
  retrieve: Resolver;
}>

export type ServeErrorHandler = (e: Unk, file: Str, url: Str) => void;

export class Server {

  private readonly _app: Koa;
  private _server: KoaServer | Nul;
  readonly host: Str;
  readonly port: Num;
  rootDir: Str | Nul;
  resolver: Resolver;
  onError: ServeErrorHandler;

  constructor(host: Str = '127.0.0.1', port: Num = randomPort()) {
    this.host = host;
    this.port = port;
    this._app = new Koa();
    this._server = null;
    this.rootDir = null;
    this.resolver = noResolver;
    this.onError = (e, file, url): void => prExc(e, 'Error while serving', { file, url });
    this._app.use(async ctx => {
      if (this.rootDir) {
        const urlPath = path.posix.normalize(ctx.URL.pathname).stripStart('.').stripStart('/');
        const file = resolvePath(urlPath, this.rootDir, this.rootDir);
        if (isExistingFile(file)) {
          try {
            const resolved = await this.resolver(file);
            if (resolved) {
              ctx.body = resolved.data;
              ctx.type = resolved.mimeType;
            } else {
              await send(ctx, ctx.path, { root: this.rootDir });
            }
          } catch (e) {
            this.onError(e, file, ctx.url);
          }
        } else {
          ctx.status = 404;
        }
      }
    });
  }

  get running(): Bool {
    return this._server?.listening ?? false;
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }
    await orThrowAsync(async () => {
      const server = this._server = this._app.listen(this.port, this.host);
      await new Promise(resolve => {
        server.addListener('listening', () => {
          resolve(null);
        });
      });
    }, 'Failed to start the server', { host: this.host, port: this.port });
  }

  stop(): void {
    const server = this._server;
    if (!server) {
      return;
    }
    orThrow(() => {
      server.close();
      server.closeAllConnections();
    }, 'Failed to stop the server', { host: this.host, port: this.port });
  }

}