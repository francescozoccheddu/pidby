import { orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { Layout } from 'pidby/config';
import { launch as launchPuppeteer } from 'puppeteer';

export async function capturePdfs(urls: RArr<Str>, layout: Layout): Promise<RArr<Buffer>> {
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