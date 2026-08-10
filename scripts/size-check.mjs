import { gzipSync } from 'node:zlib';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const packageEntries = await readdir(join(root, 'packages'), { withFileTypes: true });
const targets = [
  ...packageEntries.filter((entry) => entry.isDirectory()).map((entry) => `packages/${entry.name}/dist`),
  'site',
];
let failed = false;
for (const target of targets) {
  const directory = join(root, target);
  const walk = async (path) => {
    for (const name of await readdir(path)) {
      const file = join(path, name);
      const info = await stat(file);
      if (info.isDirectory()) await walk(file);
      else if (/\.(js|css)$/.test(name)) {
        const content = await readFile(file);
        const gzip = gzipSync(content).byteLength;
        console.log(`${relative(root, file)}\t${content.byteLength} bytes\t${gzip} gzip`);
        if (target.startsWith('packages/') && name.endsWith('.js') && gzip > 30 * 1024) failed = true;
      }
    }
  };
  await walk(directory);
}
if (failed) throw new Error('A toy package exceeded the 30 KB gzip JavaScript budget.');
