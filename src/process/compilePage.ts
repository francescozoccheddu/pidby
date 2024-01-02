import { orThrow } from '@francescozoccheddu/ts-goodies/errors';
import ejs from 'ejs';
import path from 'path';
import { Config } from 'pidby/config';
import { loadJson } from 'pidby/process/loadJson';
import { isExistingFile, isSubDirOrEq, readTextFile, resolvePath } from 'pidby/utils/files';
import { layoutSizes } from 'pidby/utils/layouts';
import { makeDialectProcessor } from 'pidby/utils/processDialect';
import pug from 'pug';

enum PageDialect {
  pug = 'pug',
  html = 'html',
  ejs = 'ejs'
}

function makeLocals(file: Str, config: Config, additionalLocals: StrObj<RJson> = {}): StrObj {
  return {
    layout: {
      name: config.layout,
      ...layoutSizes[config.layout],
    },
    json(jsonFile: Str): RJson {
      if (arguments.length !== 1) {
        err(`The 'json' function got ${arguments.length === 0 ? 'no' : 'more than one'} argument`, { gotArgCount: arguments.length, requiredArgCount: 1 });
      }
      if (!isStr(jsonFile)) {
        err('The \'json\' function got an argument of unexpected type', { gotArgType: typeof jsonFile, requiredArgType: 'string' });
      }
      const resolvedFile = orThrow(
        () => resolvePath(file, path.dirname(file), config.rootDir),
        'Failed to resolve the file passed to the \'json\' function',
        { file, rootDir: config.rootDir },
      );
      if (!isExistingFile(jsonFile)) {
        err('The file passed to the \'json\' function does not exist', { file: jsonFile, resolvedFile });
      }
      if (!isSubDirOrEq(jsonFile, config.rootDir)) {
        err('The file passed to the \'json\' function is outside the project root', { file: jsonFile, resolvedFile, rootDir: config.rootDir });
      }
      return orThrow(
        () => loadJson(resolvedFile),
        'Failed to load the file passed to the \'json\' function', { file: jsonFile, resolvedFile },
      );
    },
    ...additionalLocals,
  };
}

function compilePug(file: Str, config: Config, additionalLocals: StrObj<RJson> = {}): Str {
  const template = pug.compileFile(file, {
    basedir: config.rootDir,
    doctype: 'html',
  });
  return template(makeLocals(file, config, additionalLocals));
}

function compileHtml(file: Str): Str {
  return readTextFile(file);
}

function compileEjs(file: Str, config: Config, additionalLocals: StrObj<RJson> = {}): Str {
  // eslint-disable-next-line import/no-named-as-default-member
  return ejs.compile(readTextFile(file), {
    async: false,
    root: config.rootDir,
    filename: file,
  })(makeLocals(file, config, additionalLocals));
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

export function compilePage(file: Str, config: Config, additionalLocals: StrObj<RJson> = {}): Str {
  return orThrow(() => compiler(file, config, additionalLocals), 'Failed to compile page', { file });
}