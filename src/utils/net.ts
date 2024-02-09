import { randInt } from '@francescozoccheddu/ts-goodies/math';
import path from 'path';
import { pathToUrl } from 'pidby/utils/files';

export function randomPort(): Num {
  return randInt(1024, 65535);
}

export function getUrl(host: Str, port: Num): Str {
  return `http://${host}:${port}`;
}

export function joinUrl(a: Str, b: Str): Str {
  if (a === '/') {
    return path.posix.join('/', pathToUrl(b));
  }
  const url = new URL(a);
  url.pathname = path.posix.join(pathToUrl(url.pathname), pathToUrl(b));
  return url.toString();
}
