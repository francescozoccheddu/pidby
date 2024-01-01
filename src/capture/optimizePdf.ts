import { err, orThrowAsync } from '@francescozoccheddu/ts-goodies/errors';
import { sync as commandExists } from 'command-exists';
import { compressPDF, convertToPDFA } from 'ghostscript-node';

export async function optimizePdf(pdf: Buffer): Promise<Buffer> {
  return await orThrowAsync(async () => {
    if (!commandExists('gs')) {
      err(`The '${optimizeCommand}' command is not available in path`, { hint: `Install ${optimizeProgram}` });
    }
    return await convertToPDFA(await compressPDF(pdf), {
      version: 1,
    });
  }, 'Failed to optimize PDF');
}

export const optimizeCommand = 'gs';
export const optimizeProgram = 'GhostScript';

export function canOptimize(): Bool {
  return commandExists('gs');
}