import { prDone, prExc } from '@francescozoccheddu/ts-goodies/logs';
import { watch as chokidarWatch, WatchOptions } from 'chokidar';
import path from 'path';
import { Config, ensureValidConfig } from 'pidby/config';
import { loadConfig } from 'pidby/loadConfig';
import { ServeInstance, Task } from 'pidby/pipeline/serve';
import { normalizePath, resolvePathToUrl } from 'pidby/utils/file';

export async function watchTask(instance: ServeInstance, configFile: Str, delay: Num = 0.5): Promise<void> {
  function tryLoadConfig(): Config | Nul {
    try {
      const config = loadConfig(configFile);
      ensureValidConfig(config);
      const pageUrls = config.pageFiles.map(f => resolvePathToUrl(f, config.rootDir, instance.rootUrl));
      prDone('Loaded config', {
        file: configFile,
        pageUrls,
      });
      return config;
    } catch (e) {
      prExc(e, 'Failed load config', {
        configFile,
      });
    }
    return null;
  }
  let config: Config | Nul = null;
  function updateConfig(): void {
    config ??= tryLoadConfig();
    instance.config(config);
    if (config) {
      prDone('Setup config', {
        file: configFile,
      });
    }
  }
  const rootDir = normalizePath(path.dirname(configFile));
  prDone('Listening…', {
    rootUrl: instance.rootUrl,
    rootDir,
  });
  let timeoutId: NodeJS.Timeout | Nul = null;
  function onFileChange(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(updateConfig, delay * 1000);
  }
  function onConfigFileChange(): void {
    config = null;
    onFileChange();
  }
  updateConfig();
  instance.config(config);
  const watcherOpts: WatchOptions = {
    ignoreInitial: true,
  };
  const watchers = [
    chokidarWatch(rootDir, watcherOpts)
      .on('add', onFileChange)
      .on('change', onFileChange)
      .on('unlink', onFileChange),
    chokidarWatch(configFile, watcherOpts)
      .on('add', onConfigFileChange)
      .on('change', onConfigFileChange)
      .on('unlink', onConfigFileChange),
  ];
  await new Promise<void>(resolve => {
    process.on('SIGINT', resolve);
  });
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  await Promise.all(watchers.map(w => w.close()));
}

export function makeWatchTaskForConfigFile(configFile: Str): Task {
  return (instance) => watchTask(instance, configFile);
}