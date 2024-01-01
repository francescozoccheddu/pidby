import '@francescozoccheddu/ts-goodies/globals/augmentations';

import { orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { prDone, prExc } from '@francescozoccheddu/ts-goodies/logs';
import fs from 'fs';
import { loadConfig } from 'pidby/loadConfig';
import { makeCaptureTaskForConfig } from 'pidby/pipeline/capture';
import { serve } from 'pidby/pipeline/serve';
import { makeWatchTaskForConfigFile } from 'pidby/pipeline/watch';
import { getAppInfo } from 'pidby/utils/app';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

const appInfo = getAppInfo();

async function watch(configFile: Str, port: Num): Promise<void> {
  await orPrintExc(async () => {
    await serve(makeWatchTaskForConfigFile(configFile), port);
  });
}

async function run(configFile: Str, outFile: Str): Promise<void> {
  await orPrintExc(async () => {
    const config = loadConfig(configFile);
    const pdf = await serve(makeCaptureTaskForConfig(config));
    fs.writeFileSync(outFile, pdf);
    prDone('PDF file generated successfully', { outputFile: outFile });
  });
}

async function orPrintExc(func: () => Promise<void>): Promise<void> {
  try {
    await orThrowAsync(func, 'Command failed');
  } catch (e) {
    prExc(e, 'Command failed due to an error:');
  }
}

function main(): void {
  void yargs(hideBin(process.argv))
    .command(
      'dev <config_file> [-p <port>]',
      'Serve the specified config and watch for file changes',
      yargs => yargs
        .positional('config_file', {
          describe: 'The JSON or YAML config file',
          type: 'string',
          demandOption: true,
        })
        .option('port', {
          describe: 'The port to bind on',
          default: 3000,
          type: 'number',
          alias: 'p',
        })
        .strict(),
      argv => watch(argv.config_file, argv.port),
    )
    .command(
      'run <config_file> <out_file>',
      'Build the specified config',
      yargs => yargs
        .positional('config_file', {
          describe: 'The JSON or YAML config file',
          type: 'string',
          demandOption: true,
        })
        .positional('out_file', {
          describe: 'The output PDF file',
          type: 'string',
          demandOption: true,
        })
        .strict(),
      argv => run(argv.config_file, argv.out_file),
    )
    .scriptName(appInfo.name)
    .demandCommand()
    .alias('v', 'version')
    .alias('h', 'help')
    .help('help')
    .version(appInfo.version)
    .strict()
    .parse();
}

void main();