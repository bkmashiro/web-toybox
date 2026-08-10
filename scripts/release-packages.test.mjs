import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  discoverPackages,
  matchesRegistryVersion,
  planReleases,
  publishPlannedReleases,
} from './release-packages.mjs';

describe('batch package release planning', () => {
  it('recognizes npm 12 exact-version array output', () => {
    expect(matchesRegistryVersion('["0.0.1"]', '0.0.1')).toBe(true);
    expect(matchesRegistryVersion('"0.0.1"', '0.0.1')).toBe(true);
    expect(matchesRegistryVersion('["0.0.1"]', '0.0.2')).toBe(false);
  });

  it('discovers only public zero-runtime packages in stable name order', async () => {
    const root = await mkdtemp(join(tmpdir(), 'toy-release-'));
    const base = join(root, 'packages');
    await mkdir(join(base, 'b'), { recursive: true });
    await mkdir(join(base, 'a'), { recursive: true });
    await mkdir(join(base, 'private'), { recursive: true });
    await writeFile(join(base, 'b', 'package.json'), JSON.stringify({
      name: '@toy/b', version: '2.0.0', dependencies: {},
    }));
    await writeFile(join(base, 'a', 'package.json'), JSON.stringify({
      name: '@toy/a', version: '1.0.0',
    }));
    await writeFile(join(base, 'private', 'package.json'), JSON.stringify({
      name: 'private', version: '1.0.0', private: true,
    }));
    expect((await discoverPackages(root)).map((item) => item.name)).toEqual(['@toy/a', '@toy/b']);
  });

  it('plans only versions absent from the registry fixture', async () => {
    const packages = [
      { name: '@toy/a', version: '1.0.0', directory: '/a' },
      { name: '@toy/b', version: '2.0.0', directory: '/b' },
    ];
    const existing = new Set(['@toy/a@1.0.0']);
    expect((await planReleases(
      packages,
      async (name, version) => existing.has(`${name}@${version}`),
    )).map((item) => item.name)).toEqual(['@toy/b']);
  });

  it('rechecks stale plans immediately before each publish', async () => {
    const plan = [
      { name: '@toy/a', version: '1.0.0', directory: '/a' },
      { name: '@toy/b', version: '2.0.0', directory: '/b' },
    ];
    const published = [];
    await publishPlannedReleases(
      plan,
      async (name, version) => `${name}@${version}` === '@toy/a@1.0.0',
      async (pkg) => { published.push(pkg.name); },
    );
    expect(published).toEqual(['@toy/b']);
  });

  it('fails closed when a package gains runtime dependencies', async () => {
    const root = await mkdtemp(join(tmpdir(), 'toy-release-'));
    const directory = join(root, 'packages', 'bad');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'package.json'), JSON.stringify({
      name: '@toy/bad', version: '1.0.0', dependencies: { leftpad: '1.0.0' },
    }));
    await expect(discoverPackages(root)).rejects.toThrow('runtime dependencies must stay empty');
  });
});
