import { CaptureEngine, capturePdfs } from 'pidby/capture/capturePdfs';
import { combinePdfs } from 'pidby/capture/combinePdfs';
import { optimizePdf } from 'pidby/capture/optimizePdf';
import { Config, resolveOptimize } from 'pidby/config';
import { Task, TaskRunner } from 'pidby/pipeline/runner';

export async function captureTask(runner: TaskRunner, config: Config, engine: CaptureEngine): Promise<Buffer> {
  runner.config = config;
  const pageUrls = config.pageFiles.map(f => runner.fileUrl(f));
  const pdfs = await capturePdfs(pageUrls, config.layout, engine);
  const singlePdf = await combinePdfs(pdfs);
  const optimizedPdf = await (resolveOptimize(config) ? optimizePdf(singlePdf) : singlePdf);
  return optimizedPdf;
}

export function makeCaptureTaskForConfig(config: Config, engine: CaptureEngine): Task<Buffer> {
  return runner => captureTask(runner, config, engine);
}