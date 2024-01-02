import { Info, prWarn } from '@francescozoccheddu/ts-goodies/logs';
import { getTsconfig } from 'get-tsconfig';
import { canOptimize, optimizeCommand, optimizeProgram } from 'pidby/capture/optimizePdf';
import { findParentPaths, isExistingDir, isExistingFile, isSubDirOrEq, isSubFile } from 'pidby/utils/files';

export enum Layout {
  letter = 'letter',
  legal = 'legal',
  tabloid = 'tabloid',
  ledger = 'ledger',
  a0 = 'a0',
  a1 = 'a1',
  a2 = 'a2',
  a3 = 'a3',
  a4 = 'a4',
  a5 = 'a5',
  a6 = 'a6',
}

export const auto = Symbol();
export type Auto = typeof auto;

export type Config = R<{
  layout: Layout;
  pageFiles: RArr<Str>;
  nodeModulesDir: Str | Nul | Auto;
  tsConfigFile: Str | Nul | Auto;
  optimize: Bool | Auto;
  debug: Bool;
  rootDir: Str;
}>;

export function resolveTsConfigFile(config: Config, dir: Str): Str | Nul {
  if (config.tsConfigFile === null) {
    return null;
  }
  if (config.tsConfigFile !== auto) {
    return config.tsConfigFile;
  }
  const found = getTsconfig(dir)?.path;
  return (found && isSubFile(found, config.rootDir)) ? found : null;
}

export function resolveNodeModulesDir(config: Config, dir: Str): Str | Nul {
  if (config.nodeModulesDir === null) {
    return null;
  }
  if (config.nodeModulesDir !== auto) {
    return config.nodeModulesDir;
  }
  const found = findParentPaths([dir], 'node_modules', true, true, config.rootDir);
  if (found.isMany) {
    prWarn('Multiple candidates for \'node_modules\' found', {
      candidates: found,
      hint: 'Set \'nodeModulesDir\' in the config to silence this warning',
      contextDir: dir,
    });
  }
  if (!found.isSingle) {
    return null;
  }
  return found.single;
}

export function resolveOptimize(config: Config): Bool {
  if (config.optimize === false) {
    return false;
  }
  const can = canOptimize();
  if (config.optimize === true && !can) {
    prWarn(`The '${optimizeCommand}' command is not available in path`, { hint: `Install ${optimizeProgram} or set 'optimize' to false to silence this warning` });
  }
  return can;
}

export function ensureValidConfig(config: Config): void {
  function ensureProp<TKey extends keyof Config>(key: TKey, pred: Pred<Config[TKey]>, msg: Str): void {
    const value = config[key];
    ensure(key, value, pred, msg);
  }
  function ensure<TKey extends keyof Config, TValue extends Config[keyof Config]>(key: TKey, value: TValue, pred: Pred<TValue>, msg: Str, info: StrObj<Info> = {}): void {
    if (!pred(value)) {
      err('Invalid config', { ...info, property: key, value: value === auto ? undefined : value, reason: msg });
    }
  }
  ensureProp('rootDir', isExistingDir, 'Not a directory');
  ensureProp('tsConfigFile', f => !isStr(f) || isSubFile(f, config.rootDir), 'Path is outside root');
  ensureProp('tsConfigFile', f => !isStr(f) || isExistingFile(f), 'Not a file');
  ensureProp('nodeModulesDir', f => !isStr(f) || isSubDirOrEq(f, config.rootDir), 'Path is outside root');
  ensureProp('nodeModulesDir', f => !isStr(f) || isExistingDir(f), 'Not a dir');
  for (const [i, pageFile] of config.pageFiles.entries()) {
    ensure('pageFiles', pageFile, f => isSubFile(f, config.rootDir), 'Path is outside root', { index: i });
    ensure('pageFiles', pageFile, isExistingFile, 'Not a file', { index: i });
  }
}