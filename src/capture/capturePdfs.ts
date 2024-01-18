import { orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { Layout } from 'pidby/config';
import { launch as launchPuppeteer } from 'puppeteer';
import wkhtmltopdf from 'wkhtmltopdf';

export async function capturePdfsWithPuppeteer(urls: RArr<Str>, layout: Layout): Promise<RArr<Buffer>> {
  return await orThrowAsync(async () => {
    const browser = await launchPuppeteer({
      headless: 'new',
    });
    const page = await browser.newPage();
    const buffers: Buffer[] = [];
    for (const url of urls) {
      await page.goto(url, { waitUntil: 'networkidle0' });
      buffers.push(await page.pdf({ format: layout, pageRanges: '1' }));
    }
    await browser.close();
    return buffers;
  }, 'Failed to capture PDF(s)');
}

export async function capturePdfsWithWkHtmlToPdf(urls: RArr<Str>, layout: Layout): Promise<RArr<Buffer>> {
  const pageSize = ({
    [Layout.a0]: 'A0',
    [Layout.a1]: 'A1',
    [Layout.a2]: 'A2',
    [Layout.a3]: 'A3',
    [Layout.a4]: 'A4',
    [Layout.a5]: 'A5',
    [Layout.a6]: 'A6',
    [Layout.ledger]: 'Ledger',
    [Layout.legal]: 'Legal',
    [Layout.letter]: 'Letter',
    [Layout.tabloid]: 'Tabloid',
  } as const satisfies Record<Layout, Str>)[layout];
  return await orThrowAsync(async () => {
    return await Promise.all(urls.map(async url => {
      const stream = wkhtmltopdf(url, { pageSize });
      const buffers: (Str | Buffer)[] = [];
      for await (const data of stream) {
        buffers.push(data);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      return Buffer.concat(buffers as any);
    }));
  }, 'Failed to capture PDF(s)');
}

export enum CaptureEngine {
  puppeteer, wkHtmlToPdf
}

export async function capturePdfs(urls: RArr<Str>, layout: Layout, engine: CaptureEngine): Promise<RArr<Buffer>> {
  return await {
    [CaptureEngine.puppeteer]: capturePdfsWithPuppeteer,
    [CaptureEngine.wkHtmlToPdf]: capturePdfsWithWkHtmlToPdf,
  }[engine](urls, layout);
}