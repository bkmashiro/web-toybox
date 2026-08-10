import { describe, expect, it } from 'vitest';
describe('yo-yo package boundary',()=>{it('imports without DOM globals',async()=>{await expect(import('../src/index')).resolves.toMatchObject({mountYoyo:expect.any(Function),createYoyoState:expect.any(Function)});});});
