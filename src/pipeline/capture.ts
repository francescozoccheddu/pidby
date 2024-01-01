import { capturePdfs } from 'pidby/capture/capturePdfs';
import { combinePdfs } from 'pidby/capture/combinePdfs';
import { optimizePdf } from 'pidby/capture/optimizePdf';
import { Config, resolveOptimize } from 'pidby/config';
import { ServeInstance, Task } from 'pidby/pipeline/serve';
import { resolvePathToUrl } from 'pidby/utils/file';

export async function captureTask(instance: ServeInstance, config: Config): Promise<Buffer> {
  instance.config(config);
  const pageUrls = config.pageFiles.map(f => resolvePathToUrl(f, config.rootDir, instance.rootUrl));
  const pdfs = await capturePdfs(pageUrls, config.layout);
  const singlePdf = await combinePdfs(pdfs);
  const optimizedPdf = await (resolveOptimize(config) ? optimizePdf(singlePdf) : singlePdf);
  return optimizedPdf;
}

export function makeCaptureTaskForConfig(config: Config): Task<Buffer> {
  return (instance) => captureTask(instance, config);
}