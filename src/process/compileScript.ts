import { orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { Info, prWarn } from '@francescozoccheddu/ts-goodies/logs';
import babelPlugin from '@rollup/plugin-babel';
import commonJsPlugin from '@rollup/plugin-commonjs';
import nodeResolvePlugin from '@rollup/plugin-node-resolve';
import typescriptPlugin from '@rollup/plugin-typescript';
import path from 'path';
import { Config, resolveNodeModulesDir, resolveTsConfigFile } from 'pidby/config';
import { fileExt } from 'pidby/utils/files';
import { OutputChunk, OutputOptions, rollup, RollupOptions } from 'rollup';
import inMemoryPlugin from 'rollup-plugin-memory-fs';

export async function compileScript(file: Str, config: Config): Promise<Str> {
  const dir = path.dirname(file);
  const warnings: Arr<Info> = [];
  const inputOptions: RollupOptions = {
    input: file,
    output: {
      format: 'iife',
      sourcemap: config.debug ? 'inline' : false,
      sourcemapBaseUrl: `file://${config.rootDir}`,
      sourcemapPathTransform: file => path.basename(file),
    },
    onLog(level, log) {
      if (level === 'warn') {
        warnings.push({
          message: log.message,
          code: log.code,
          line: log.loc?.line,
          file: log.loc?.file,
          column: log.loc?.column,
          source: log.frame,
        });
      }
    },
    plugins: [
      inMemoryPlugin(),
      commonJsPlugin(),
      nodeResolvePlugin({
        moduleDirectories: [resolveNodeModulesDir(config, dir)].nonNul,
        browser: true,
        extensions: ['.ts', '.js'],
      }),
      typescriptPlugin({
        tsconfig: resolveTsConfigFile(config, dir, fileExt(file) === 'ts') ?? false,
        compilerOptions: {
          target: 'ES6',
          module: 'ESNext',
          allowJs: true,
          checkJs: true,
          inlineSourceMap: config.debug,
          inlineSources: config.debug,
        },
        filterRoot: config.rootDir,
      }),
      babelPlugin({
        extensions: ['.ts', '.js', '.json'],
        babelHelpers: 'bundled',
      }),
    ],
  };
  return await orThrowAsync(async () => {
    try {
      const bundle = await rollup(inputOptions);
      try {
        const { output } = await bundle.generate(inputOptions.output as OutputOptions);
        return output
          .filter(o => o.type === 'chunk')
          .map(o => (o as OutputChunk).code)
          .join('\n;\n');
      } finally {
        await bundle.close();
      }
    } finally {
      if (warnings.length > 0) {
        prWarn('Script compiled with warnings', { warnings, entryFile: file });
      }
    }
  }, 'Failed to compile script', { file });
}