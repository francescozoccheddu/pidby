import { orThrow } from '@francescozoccheddu/ts-goodies/errors';
import path from 'path';
import { Auto, auto, Config, Layout } from 'pidby/config';
import { createJsonValidator, JsonValidator, loadJson } from 'pidby/process/loadJson';
import { resolvePath } from 'pidby/utils/files';
import schema from 'schema/config.json';

let jsonValidator: JsonValidator<RawConfig> | Nul = null;

function validateConfigJson(obj: RJson): asserts obj is RawConfig {
  if (jsonValidator === null) {
    jsonValidator = createJsonValidator<RawConfig>(schema);
  }
  jsonValidator(obj);
}

type RawConfig = R<{
  layout: Layout;
  pageFiles: RArr<Str>;
  nodeModulesDir?: Str | Nul;
  tsConfigFile?: Str | Nul;
  optimize?: Bool;
}>

function orAuto<T>(value: T): Exclude<T, Und> | Auto {
  return isUnd(value) ? auto : value as Exclude<T, Und>;
}

export function resolveConfPath(file: Str | Nul | Und, rootDir: Str): Str | Nul | Und {
  if (!file) {
    return file;
  }
  return resolvePath(file, rootDir, rootDir);
}

export function loadConfig(file: Str, debug: Bool = false): Config {
  const rootDir = resolvePath(path.dirname(file), process.cwd());
  return orThrow(() => {
    const rawConfig = loadJson(file);
    validateConfigJson(rawConfig);
    return {
      rootDir,
      layout: rawConfig.layout,
      pageFiles: rawConfig.pageFiles.map(file => resolvePath(file, rootDir, rootDir)),
      debug,
      nodeModulesDir: orAuto(resolveConfPath(rawConfig.nodeModulesDir, rootDir)),
      tsConfigFile: orAuto(resolveConfPath(rawConfig.tsConfigFile, rootDir)),
      optimize: orAuto(rawConfig.optimize),
    };
  }, 'Failed to load config file', { file });
}