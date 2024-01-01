import { orThrow } from '@francescozoccheddu/ts-goodies/errors';
import fs from 'fs';
import path from 'path';

export function readTextFile(file: Str): Str {
  return orThrow(() => fs.readFileSync(file, 'utf8'), 'Failed to read file', { file });
}

export function readFile(file: Str): Buffer {
  return orThrow(() => fs.readFileSync(file), 'Failed to read file', { file });
}

export function normalizePath(file: Str): Str {
  return path.normalize(process.platform === 'win32' ? file.toLowerCase() : file);
}

export function isSamePath(a: Str, b: Str): Bool {
  return path.normalize(path.resolve(a)) === path.normalize(path.resolve(b));
}

export function findParentPath(from: Str, name: Str, directory: Bool, stopAt: Num | Str = 64): Str {
  return findParentPaths([from], name, directory, false, stopAt)[0] ?? err('No file found', { root: from, pattern: name, kind: directory ? 'directory' : 'file' });
}

export function isSubDirOrEq(sub: Str, parent: Str): Bool {
  return path.relative(sub, parent).startsWith('..');
}

export function isSubFile(sub: Str, parent: Str): Bool {
  return isSubDirOrEq(path.dirname(sub), parent);
}

export function findParentPaths(from: RArr<Str>, name: Str, directory: Bool, multiple: Bool = false, stopAt: Num | Str = 64): RArr<Str> {
  const normName = normalizePath(name);
  const found = new Set<Str>();
  const maxDepth = isNum(stopAt) ? stopAt : Infinity;
  const maxDir = isStr(stopAt) ? stopAt : null;
  from.forEach(root => {
    let depth = 0;
    return walkUp(root,
      (dir: Str) => {
        depth += 1;
        if (depth > maxDepth || (maxDir !== null && isSubDirOrEq(maxDir, dir))) {
          return true;
        }
        const candidates = [path.join(dir, name), dir];
        for (const candidate of candidates) {
          if (normName === path.basename(candidate) && fs.existsSync(candidate) && fs.lstatSync(candidate).isDirectory() === directory) {
            found.add(candidate);
            if (!multiple) {
              return true;
            }
          }
        }
        return false;
      },
    );
  });
  return [...found];
}

function walkUp(from: Str, func: (dir: Str) => Bool): void {
  let current = normalizePath(from);
  while (!func(current)) {
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
}

export function resolvePath(file: Str, currentDir: Str, rootDir: Str | Nul = null): Str {
  if (rootDir !== null && path.isAbsolute(file)) {
    return normalizePath(path.join(rootDir, file));
  } else {
    return normalizePath(path.resolve(currentDir, file));
  }
}

export function fileExt(file: Str): Str {
  const basename = path.basename(file);
  const lastDot = basename.lastIndexOf('.');
  if (lastDot < 0) {
    return '';
  }
  return basename.slice(lastDot + 1).toLowerCase();
}

export function joinUrl(a: Str, b: Str): Str {
  const url = new URL(a);
  url.pathname = path.posix.join(pathToUrl(url.pathname), pathToUrl(b));
  return url.toString();
}

export function pathToUrl(url: Str): Str {
  return path.posix.normalize(url.replaceAll(path.win32.sep, path.posix.sep));
}

export function resolvePathToUrl(file: Str, rootDir: Str, baseUrl: Str): Str {
  const relFile = pathToUrl(path.relative(rootDir, file)).stripStart('.').stripStart('/');
  return joinUrl(baseUrl, relFile);
}

export function isDir(file: Str): Bool {
  return fs.existsSync(file) && fs.lstatSync(file).isDirectory();
}

export function isFile(file: Str): Bool {
  return fs.existsSync(file) && fs.lstatSync(file).isFile();
}

export function canWriteFile(file: Str): Bool {
  try {
    fs.accessSync(file, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}