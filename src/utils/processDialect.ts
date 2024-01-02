import { orThrow, orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { Info } from '@francescozoccheddu/ts-goodies/logs';
import { fileExt } from 'pidby/utils/files';

export type Dialect<TKey extends Str, TOut, TProcessorArgs extends AnyArr = []> = R<{
  key: TKey;
  extensions: RArr<Str>;
  processor: (...args: TProcessorArgs) => TOut;
}>

function dialectToInfo<TDialectKey extends Str, TOut, TProcessorArgs extends AnyArr>(dialect: Dialect<TDialectKey, TOut, TProcessorArgs>): Info {
  return {
    name: dialect.key,
    validExtensions: [...dialect.extensions].map(ext => `.${ext}`),
  };
}

export function skipFileArg<TOut, TArgs extends AnyArr>(func: (...args: TArgs) => TOut) {
  return (_file: Str, ...args: TArgs): TOut => func(...args);
}

export function makeDialectProcessor<TKey extends Str, TOut, TArgs extends AnyArr>(
  dialects: RArr<Dialect<TKey, TOut, [file: Str, ...args: TArgs]>>,
  async?: false,
): (file: Str, ...args: TArgs) => TOut;

export function makeDialectProcessor<TOut, TKey extends Str, TArgs extends AnyArr>(
  dialects: RArr<Dialect<TKey, TOut | Promise<TOut>, [file: Str, ...args: TArgs]>>,
  async: true,
): (file: Str, ...args: TArgs) => TOut | Promise<TOut>;

export function makeDialectProcessor<TOut, TKey extends Str, TArgs extends AnyArr>(
  dialects: RArr<Dialect<TKey, TOut | Promise<TOut>, [file: Str, ...args: TArgs]>>,
  async: Bool = false,
): ((file: Str, ...args: TArgs) => TOut) | ((file: Str, ...args: TArgs) => TOut | Promise<TOut>) {
  const extDict = dialects.flatMap(d => d.extensions.map(ext => [ext.toLowerCase(), d] as const)).toDict;
  function getDialect(file: Str): Dialect<TKey, TOut | Promise<TOut>, [file: Str, ...args: TArgs]> {
    const ext = fileExt(file);
    return extDict.get(ext)
      ?? err(
        'Cannot match a valid dialect for the file',
        {
          file,
          dialects: dialects.map(dialectToInfo),
          foundExtension: ext,
        },
      );
  }
  if (async) {
    return async (file, ...args: TArgs) => {
      const dialect = getDialect(file);
      return await orThrowAsync(async () => await dialect.processor(file, ...args), 'Failed to process file', { dialect: dialectToInfo(dialect), file });
    };
  }
  else {
    return (file, ...args: TArgs) => {
      const dialect = getDialect(file);
      return orThrow(() => dialect.processor(file, ...args) as TOut, 'Failed to process file', { dialect: dialectToInfo(dialect), file });
    };
  }
}