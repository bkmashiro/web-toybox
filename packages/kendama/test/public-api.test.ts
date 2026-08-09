import { describe, expect, it } from 'vitest';

describe('public package boundary', () => {
  it('can be imported without DOM globals', async () => {
    await expect(import('../src/index')).resolves.toMatchObject({
      mountKendama: expect.any(Function),
      createKendamaState: expect.any(Function),
    });
  });
});
