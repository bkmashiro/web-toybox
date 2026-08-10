import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
await rm(join(root, 'site'), { recursive: true, force: true });
for (const entry of await readdir(join(root, 'packages'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = join(root, 'packages', entry.name);
  await Promise.all([
    rm(join(directory, 'dist'), { recursive: true, force: true }),
    rm(join(directory, 'tsconfig.tsbuildinfo'), { force: true }),
    rm(join(directory, 'tsconfig.build.tsbuildinfo'), { force: true }),
  ]);
}
