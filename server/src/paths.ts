import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)); // server/src
export const SERVER_ROOT = path.resolve(here, '..'); // server/
export const REPO_ROOT = path.resolve(SERVER_ROOT, '..'); // repo root

/** Built client SPA (produced by `npm --prefix client run build`). Served in production. */
export const CLIENT_DIST = path.join(REPO_ROOT, 'client', 'dist');
export const hasClientBuild = fs.existsSync(path.join(CLIENT_DIST, 'index.html'));
