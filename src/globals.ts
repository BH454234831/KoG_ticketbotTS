/* eslint-disable @typescript-eslint/naming-convention */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectDir = path.resolve(__dirname, '..');
