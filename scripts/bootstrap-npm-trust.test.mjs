import { describe, expect, it } from 'vitest';
import { bootstrapCommands } from './bootstrap-npm-trust.mjs';

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
});
