import path from 'path';
import { findParentPath } from 'pidby/utils/file';

const packageJsonFile = findParentPath(__dirname, 'package.json', false);
const root = path.dirname(packageJsonFile);
const schema = path.join(root, 'schema');

export const dirs = {
  root, schema,
};