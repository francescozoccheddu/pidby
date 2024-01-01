import { cerr } from '@francescozoccheddu/ts-goodies/errors';
import { Info, prWarn } from '@francescozoccheddu/ts-goodies/logs';
import autoprefixerPlugin from 'autoprefixer';
import path from 'path';
import { Config, resolveNodeModulesDir } from 'pidby/config';
import postcss, { CssSyntaxError } from 'postcss';
import importPlugin from 'postcss-import';
import sass from 'sass';

function addSourceMaps(css: Str, sourceMapObj: Unk): Str {
  const smJson = JSON.stringify(sourceMapObj);
  const smBase64 = (Buffer.from(smJson, 'utf8') || '').toString('base64');
  const smComment = '/*# sourceMappingURL=data:application/json;charset=utf-8;base64,' + smBase64 + ' */';
  return css + '\n'.repeat(2) + smComment;
}

export async function compileStyle(file: Str, config: Config): Promise<Str> {
  try {
    const dir = path.dirname(file);
    const loadPaths = [dir, resolveNodeModulesDir(config, dir)].nonNul;
    const warnings: Arr<Info> = [];
    const sassResult = sass.compile(
      file,
      {
        sourceMap: config.debug,
        loadPaths: [...loadPaths],
        logger: {
          warn(message, options) {
            warnings.push({
              message,
              file: options.span?.url?.toString(),
              source: options.span?.text,
              line: options.span?.start?.line,
              column: options.span?.start?.column,
            });
          },
        },
        alertColor: false,
      },
    );
    const postcssResult = await postcss([
      importPlugin({
        path: [...loadPaths],
        root: config.rootDir,
      }),
      autoprefixerPlugin({}),
    ])
      .process(config.debug
        ? addSourceMaps(sassResult.css, sassResult.sourceMap)
        : sassResult.css, {
        from: file,
        map: config.debug,
      });
    warnings.push(...postcssResult.warnings().map(w => ({
      message: w.text,
      line: w.line,
      column: w.column,
      source: w.node?.source?.input?.file,
    })));
    if (warnings.length > 0) {
      prWarn('Style compiled with warnings', { warnings, entryFile: file });
    }
    return postcssResult.css;
  } catch (e) {
    if (e instanceof CssSyntaxError) {
      err('Failed to compile stylesheet', {
        message: e.reason,
        line: e.line,
        column: e.column,
        entryFile: file,
      });
    }
    cerr(e, 'Failed to compile stylesheet', { file });
  }
}
