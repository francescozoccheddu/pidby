import { orThrow } from '@francescozoccheddu/ts-goodies/errors';
import ejs from 'ejs';
import { Config } from 'pidby/config';
import { readTextFile } from 'pidby/utils/file';
import { makeDialectProcessor } from 'pidby/utils/processDialect';
import pug from 'pug';

enum PageDialect {
  pug = 'pug',
  html = 'html',
  ejs = 'ejs'
}

function compilePug(file: Str, config: Config): Str {
  const template = pug.compileFile(file, {
    basedir: config.rootDir,
    doctype: 'html',
  });
  const locals: pug.LocalsObject = {
    layout: config.layout,
  };
  return template(locals);
}

function compileHtml(file: Str): Str {
  return readTextFile(file);
}

function compileEjs(file: Str, config: Config): Str {
  // eslint-disable-next-line import/no-named-as-default-member
  return ejs.compile(readTextFile(file), {
    async: false,
    root: config.rootDir,
    filename: file,
  })({
    layout: config.layout,
  });
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