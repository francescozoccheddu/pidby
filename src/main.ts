import '@francescozoccheddu/ts-goodies/globals/augmentations';

import { orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { prDone, prExc } from '@francescozoccheddu/ts-goodies/logs';
import fs from 'fs';
import { CaptureEngine } from 'pidby/capture/capturePdfs';
import { loadConfig } from 'pidby/loadConfig';
import { makeCaptureTaskForConfig } from 'pidby/pipeline/capture';
import { run } from 'pidby/pipeline/runner';
import { makeWatchTaskForConfigFile } from 'pidby/pipeline/watch';
import { getAppInfo } from 'pidby/utils/app';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

const appInfo = getAppInfo();

async function cmdDev(configFile: Str, port: Num): Promise<void> {
  await orPrintExc(async () => {
    await run(makeWatchTaskForConfigFile(configFile), port);
  });
}

async function cmdRun(configFile: Str, outFile: Str, engine: CaptureEngine): Promise<void> {
  await orPrintExc(async () => {
    const config = loadConfig(configFile);
    const pdf = await run(makeCaptureTaskForConfig(config, engine));
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
      argv => cmdDev(argv.config_file, argv.port),
    )
    .command(
      'run <config_file> <out_file> [-e <engine>]',
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
        .option('engine', {
          describe: 'The PDF capture engine',
          choices: ['wkhtmltopdf', 'puppeteer'],
          default: 'puppeteer',
          alias: 'e',
        })
        .strict(),
      argv => cmdRun(argv.config_file, argv.out_file, {
        'puppeteer': CaptureEngine.puppeteer,
        'wkhtmltopdf': CaptureEngine.wkHtmlToPdf,
      }[argv.engine]!),
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