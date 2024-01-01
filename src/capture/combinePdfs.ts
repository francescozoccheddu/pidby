import { orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import PDFMerger from 'pdf-merger-js';

export async function combinePdfs(pdfs: RArr<Buffer>): Promise<Buffer> {
  return await orThrowAsync(async () => {
    const merger = new PDFMerger();
    for (const pdf of pdfs) {
      await merger.add(pdf, '1');
    }
    return await merger.saveAsBuffer();
  }, 'Failed to merge PDFs');
}