import { orThrow } from '@francescozoccheddu/ts-goodies/errors';
import fs from 'fs';
import p from 'path';
import { joinUrl } from 'pidby/utils/net';

export function readTextFile(file: Str): Str {
  return orThrow(() => fs.readFileSync(file, 'utf8'), 'Failed to read file', { file });
}

export function normPath(file: Str): Str {
  return p.normalize(process.platform === 'win32' ? file.toLowerCase() : file);
}

export function isSamePath(a: Str, b: Str): Bool {
  return p.normalize(p.resolve(a)) === p.normalize(p.resolve(b));
}

export function findParentPath(from: Str, name: Str, directory: Bool, stopAt: Num | Str = 64): Str {
  return findParentPaths([from], name, directory, false, stopAt)[0] ?? err('No file found', { root: from, pattern: name, kind: directory ? 'directory' : 'file' });
}

export function isSubDirOrEq(sub: Str, parent: Str): Bool {
  return !p.relative(parent, sub).startsWith('..');
}

export function isSubFile(sub: Str, parent: Str): Bool {
  return isSubDirOrEq(p.dirname(sub), parent);
}

export function findParentPaths(from: RArr<Str>, name: Str, directory: Bool, multiple: Bool = false, stopAt: Num | Str = 64): RArr<Str> {
  const normName = normPath(name);
  const found = new Set<Str>();
  const maxDepth = isNum(stopAt) ? stopAt : Infinity;
  const maxDir = isStr(stopAt) ? stopAt : null;
  from.forEach(root => {
    let depth = 0;
    return walkUp(root,
      (dir: Str) => {
        depth += 1;
        if (depth > maxDepth || (maxDir !== null && !isSubDirOrEq(dir, maxDir))) {
          return true;
        }
        const candidates = [p.join(dir, name), dir];
        for (const candidate of candidates) {
          if (normName === p.basename(candidate) && fs.existsSync(candidate) && fs.lstatSync(candidate).isDirectory() === directory) {
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
  let current = normPath(from);
  while (!func(current)) {
    const next = p.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
}

export function resolvePath(file: Str, currentDir: Str, rootDir: Str | Nul = null): Str {
  if (rootDir !== null && p.isAbsolute(file)) {
    return normPath(p.join(rootDir, file));
  } else {
    return normPath(p.resolve(currentDir, file));
  }
}

export function fileExt(file: Str): Str {
  const basename = p.basename(file);
  const lastDot = basename.lastIndexOf('.');
  if (lastDot < 0) {
    return '';
  }
  return basename.slice(lastDot + 1).toLowerCase();
}

export function pathToUrl(path: Str): Str {
  return p.posix.normalize(path.replaceAll(p.win32.sep, p.posix.sep));
}

export function resolvePathToUrl(file: Str, rootDir: Str, baseUrl: Str = '/'): Str {
  const relFile = pathToUrl(p.relative(rootDir, file)).stripStart('.').stripStart('/');
  return joinUrl(baseUrl, relFile);
}

export function isExistingDir(path: Str): Bool {
  return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
}

export function isExistingFile(path: Str): Bool {
  return fs.existsSync(path) && fs.lstatSync(path).isFile();
}