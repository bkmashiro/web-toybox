import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
await rm(join(root, 'site'), { recursive: true, force: true });
for (const entry of await readdir(join(root, 'packages'), { withFileTypes: true })) {
  if (entry.isDirectory()) await rm(join(root, 'packages', entry.name, 'dist'), { recursive: true, force: true });
}
