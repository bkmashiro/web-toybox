import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverPackages } from './release-packages.mjs';

const root = new URL('..', import.meta.url).pathname;
const toys = ['kendama', 'yoyo', 'jacobs-ladder', 'tin-frog', 'tangram', 'sliding-puzzle', 'peg-solitaire', 'marble-maze', 'pinboard', 'paper-football'];

describe('toy-audio workspace integration', () => {
  it('discovers toy-audio as an independent zero-runtime package', async () => {
    const packages = await discoverPackages(root);
    expect(packages.find((item) => item.name === '@web-toybox/toy-audio')).toMatchObject({ version: '0.0.1' });
  });

  it('keeps toy-audio build-only for every self-contained toy package', async () => {
    for (const toy of toys) {
      const manifest = JSON.parse(await readFile(join(root, 'packages', toy, 'package.json'), 'utf8'));
      expect(manifest.dependencies ?? {}).toEqual({});
      expect(manifest.devDependencies?.['@web-toybox/toy-audio']).toBe('workspace:*');
    }
  });
});
