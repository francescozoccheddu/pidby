import { orThrow } from '@francescozoccheddu/ts-goodies/errors';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { Config } from 'pidby/config';
import { loadJson, loadYaml } from 'pidby/process/loadData';
import { isExistingFile, isSamePath, isSubDirOrEq, readTextFile, resolvePath, resolvePathToUrl } from 'pidby/utils/files';
import { layoutSizes } from 'pidby/utils/layouts';
import { makeDialectProcessor } from 'pidby/utils/processDialect';
import pug from 'pug';

enum PageDialect {
  pug = 'pug',
  html = 'html',
  ejs = 'ejs'
}

function makeDataLoader<TKey extends Str>(name: TKey, loader: (file: Str) => RJson, config: Config, dir: Str, failIfNotExists: false): Obj<TKey, (file: Str) => RJson | Und>;
function makeDataLoader<TKey extends Str>(name: TKey, loader: (file: Str) => RJson, config: Config, dir: Str, failIfNotExists: true): Obj<TKey, (file: Str) => RJson>;
function makeDataLoader<TKey extends Str>(name: TKey, loader: (file: Str) => RJson, config: Config, dir: Str, failIfNotExists: Bool): Obj<TKey, (file: Str) => RJson | Und> {
  return {
    [name]: function (file: Str): RJson | Und {
      if (arguments.length !== 1) {
        err(`The '${name}' function got ${arguments.length === 0 ? 'no' : 'more than one'} argument`, { gotArgCount: arguments.length, requiredArgCount: 1 });
      }
      if (!isStr(file)) {
        err(`The '${name}' function got an argument of unexpected type`, { gotArgType: typeof file, requiredArgType: 'string' });
      }
      const resolvedFile = orThrow(
        () => resolvePath(file, dir, config.rootDir),
        `Failed to resolve the file passed to the '${name}' function`,
        { file, rootDir: config.rootDir },
      );
      if (!isExistingFile(resolvedFile)) {
        if (failIfNotExists) {
          err(`The file passed to the '${name}' function does not exist`, { file: file, resolvedFile });
        }
        else {
          return undefined;
        }
      }
      if (!isSubDirOrEq(resolvedFile, config.rootDir)) {
        err(`The file passed to the '${name}' function is outside the project root`, { file: file, resolvedFile, rootDir: config.rootDir });
      }
      return orThrow(
        () => loader(resolvedFile),
        `Failed to load the file passed to the '${name}' function`, { file: file, resolvedFile },
      );
    },
  } as Obj<TKey, (file: Str) => RJson>;
}

function makeFsExists<TKey extends Str>(name: TKey, kind: 'file' | 'dir' | 'fileOrDir', config: Config, dir: Str): Obj<TKey, (file: Str) => Bool> {
  return {
    [name]: function (file: Str): Bool {
      if (arguments.length !== 1) {
        err(`The '${name}' function got ${arguments.length === 0 ? 'no' : 'more than one'} argument`, { gotArgCount: arguments.length, requiredArgCount: 1 });
      }
      if (!isStr(file)) {
        err(`The '${name}' function got an argument of unexpected type`, { gotArgType: typeof file, requiredArgType: 'string' });
      }
      const resolvedFile = orThrow(
        () => resolvePath(file, dir, config.rootDir),
        `Failed to resolve the file passed to the '${name}' function`,
        { file, rootDir: config.rootDir },
      );
      if (!isSubDirOrEq(resolvedFile, config.rootDir)) {
        err(`The path passed to the '${name}' function is outside the project root`, { path: file, resolvedFile, rootDir: config.rootDir });
      }
      try {
        switch (kind) {
          case 'file':
            return fs.lstatSync(resolvedFile).isFile();
          case 'dir':
            return fs.lstatSync(resolvedFile).isDirectory();
          case 'fileOrDir':
            return fs.existsSync(resolvedFile);
        }
      }
      catch (e) {
        return false;
      }
    },
  } as Obj<TKey, (file: Str) => Bool>;
}

function makeLocals(file: Str, config: Config): StrObj {
  const dir = path.dirname(file);
  return {
    layout: {
      name: config.layout,
      ...layoutSizes[config.layout],
    },
    ...makeDataLoader('jsonFile', loadJson, config, dir, true),
    ...makeDataLoader('yamlFile', loadYaml, config, dir, true),
    ...makeDataLoader('textFile', readTextFile, config, dir, true),
    ...makeFsExists('isFile', 'file', config, dir),
    ...makeFsExists('isDir', 'dir', config, dir),
    ...makeFsExists('isFileOrDir', 'fileOrDir', config, dir),
    page: config.pageFiles.findIndex(f => isSamePath(file, f)),
    pages: config.pageFiles.map(file => resolvePathToUrl(file, config.rootDir, '/')),
  };
}

export function compilePug(file: Str, config: Config): Str {
  const template = pug.compileFile(file, {
    basedir: config.rootDir,
    doctype: 'html',
  });
  return template(makeLocals(file, config));
}

export function compileHtml(file: Str): Str {
  return readTextFile(file);
}

export function compileEjs(file: Str, config: Config): Str {
  // eslint-disable-next-line import/no-named-as-default-member
  return ejs.compile(readTextFile(file), {
    async: false,
    root: config.rootDir,
    filename: file,
  })(makeLocals(file, config));
}

const compiler = makeDialectProcessor([
  {
    key: PageDialect.pug,
    extensions: ['pug'],
    processor: compilePug,
  },
  {
    key: PageDialect.html,
    extensions: ['html', 'htm', 'xhtml'],
    processor: compileHtml,
  },
  {
    key: PageDialect.ejs,
    extensions: ['ejs'],
    processor: compileEjs,
  },
]);

export function compilePage(file: Str, config: Config): Str {
  return orThrow(() => compiler(file, config), 'Failed to compile page', { file });
}