import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)); // server/src
export const SERVER_ROOT = path.resolve(here, '..'); // server/
export const UPLOAD_DIR = path.join(SERVER_ROOT, 'uploads');

// Ensure the uploads folder exists on boot.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
