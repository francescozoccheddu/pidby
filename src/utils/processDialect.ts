import { orThrow, orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { Info } from '@francescozoccheddu/ts-goodies/logs';
import { fileExt } from 'pidby/utils/files';

export type DialectProcessor<TOut, TProcessorArgs extends AnyArr> = (...args: TProcessorArgs) => TOut;

export type Dialect<TDialectKey extends Str, TOut, TProcessorArgs extends AnyArr = []> = R<{
  key: TDialectKey;
  extensions: RArr<Str>;
  processor: DialectProcessor<TOut, TProcessorArgs>;
}>

function dialectToInfo<TDialectKey extends Str, TOut, TProcessorArgs extends AnyArr>(dialect: Dialect<TDialectKey, TOut, TProcessorArgs>): Info {
  return {
    name: dialect.key,
    validExtensions: [...dialect.extensions].map(ext => `.${ext}`),
  };
}

export function makeDialectProcessor<TDialectKey extends Str, TOut, TExtraProcessorArgs extends AnyArr>(
  dialects: RArr<Dialect<TDialectKey, TOut, [file: Str, ...args: TExtraProcessorArgs]>>,
  async?: false,
): DialectProcessor<TOut, [file: Str, ...args: TExtraProcessorArgs]>;

export function makeDialectProcessor<TOut, TDialectKey extends Str, TExtraProcessorArgs extends AnyArr>(
  dialects: RArr<Dialect<TDialectKey, TOut | Promise<TOut>, [file: Str, ...args: TExtraProcessorArgs]>>,
  async: true,
): DialectProcessor<Promise<TOut>, [file: Str, ...args: TExtraProcessorArgs]>;

export function makeDialectProcessor<TOut, TDialectKey extends Str, TExtraProcessorArgs extends AnyArr>(
  dialects: RArr<Dialect<TDialectKey, TOut | Promise<TOut>, [file: Str, ...args: TExtraProcessorArgs]>>,
  async: Bool = false,
): DialectProcessor<TOut, [file: Str, ...args: TExtraProcessorArgs]> | DialectProcessor<Promise<TOut>, [file: Str, ...args: TExtraProcessorArgs]> {
  const extDict = dialects.flatMap(d => d.extensions.map(ext => [ext.toLowerCase(), d] as const)).toDict;
  function getDialect(file: Str): Dialect<TDialectKey, TOut | Promise<TOut>, [file: Str, ...args: TExtraProcessorArgs]> {
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
    return async (file, ...args: TExtraProcessorArgs) => {
      const dialect = getDialect(file);
      return await orThrowAsync(async () => await dialect.processor(file, ...args), 'Failed to process file', { dialect: dialectToInfo(dialect), file });
    };
  }
  else {
    return (file, ...args: TExtraProcessorArgs) => {
      const dialect = getDialect(file);
      return orThrow(() => dialect.processor(file, ...args) as TOut, 'Failed to process file', { dialect: dialectToInfo(dialect), file });
    };
  }
}