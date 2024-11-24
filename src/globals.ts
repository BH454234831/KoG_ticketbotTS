/* eslint-disable @typescript-eslint/naming-convention */
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const projectDir = path.resolve(dirname, '..');
