import { describe, expect, it } from 'vitest';
import { bootstrapCommands, planBootstraps } from './bootstrap-npm-trust.mjs';

describe('npm trust bootstrap', () => {
  it('builds first-publish and trusted-publisher commands', () => {
    const commands = bootstrapCommands({
      name: '@web-toybox/new-toy',
      version: '0.0.1',
      directory: '/tmp/new-toy',
    });
    expect(commands).toEqual([
      {
        command: 'npm',
        args: ['publish', '--access', 'public'],
        cwd: '/tmp/new-toy',
      },
      {
        command: 'npm',
        args: [
          'trust',
          'github',
          '@web-toybox/new-toy',
          '--file',
          'release.yml',
          '--repo',
          'bkmashiro/web-toybox',
          '--allow-publish',
          '--yes',
        ],
      },
    ]);
  });

  it('can repair trust without republishing an existing package', () => {
    const commands = bootstrapCommands({
      name: '@web-toybox/kendama',
      version: '0.0.1',
      directory: '/tmp/kendama',
    }, false);
    expect(commands).toHaveLength(1);
    expect(commands[0].args.slice(0, 3)).toEqual(['trust', 'github', '@web-toybox/kendama']);
  });

  it('does not bootstrap a new version of an existing package name', async () => {
    const packages = [
      { name: '@web-toybox/kendama', version: '0.0.2', directory: '/tmp/kendama' },
      { name: '@web-toybox/new-toy', version: '0.0.1', directory: '/tmp/new-toy' },
    ];
    const plan = await planBootstraps(packages, async name => name === '@web-toybox/kendama');
    expect(plan.map(pkg => pkg.name)).toEqual(['@web-toybox/new-toy']);
  });
});
