import { orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { Layout } from 'pidby/config';
import { launch as launchPuppeteer, PaperFormat } from 'puppeteer';

const layoutMap: RObj<Layout, PaperFormat> = {
  [Layout.a4]: 'A4',
};

export async function capturePdfs(urls: RArr<Str>, layout: Layout): Promise<RArr<Buffer>> {
  return await orThrowAsync(async () => {
    const browser = await launchPuppeteer({
      headless: 'new',
    });
    const page = await browser.newPage();
    const format = layoutMap[layout];
    const buffers: Buffer[] = [];
    for (const url of urls) {
      await page.goto(url, { waitUntil: 'networkidle0' });
      buffers.push(await page.pdf({ format, pageRanges: '1' }));
    }
    await browser.close();
    return buffers;
  }, 'Failed to capture PDF(s)');
}