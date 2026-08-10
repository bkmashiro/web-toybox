import { describe, expect, it } from 'vitest';
import { createYoyoState, requestReturn, stepYoyo } from '../src/physics';

const bounds={width:600,height:620};
const input={held:false,x:0,y:0};

describe('yo-yo physics',()=>{
  it('keeps the finite disc within the current string limit',()=>{
    const state=createYoyoState(bounds.width,bounds.height);state.disc.x+=800;state.disc.y+=500;
    stepYoyo(state,input,1/60,bounds);
    expect(Math.hypot(state.disc.x-state.hand.x,state.disc.y-state.hand.y)).toBeLessThanOrEqual(state.stringLength+.001);
    expect([state.disc.x,state.disc.y,state.disc.vx,state.disc.vy,state.disc.angle,state.disc.angularVelocity].every(Number.isFinite)).toBe(true);
  });
  it('turns a taut downward throw into disc spin',()=>{
    const state=createYoyoState(bounds.width,bounds.height);state.disc.y=state.hand.y+state.stringLength+20;state.disc.vy=900;
    stepYoyo(state,input,1/120,bounds);
    expect(Math.abs(state.disc.angularVelocity)).toBeGreaterThan(1);
  });
  it('sleeps at the end of the string while retaining spin',()=>{
    const state=createYoyoState(bounds.width,bounds.height);state.disc.x=state.hand.x;state.disc.y=state.hand.y+state.stringLength;state.disc.vx=0;state.disc.vy=0;state.disc.angularVelocity=70;
    for(let i=0;i<20;i++)stepYoyo(state,input,1/120,bounds);
    expect(state.phase).toBe('sleeping');expect(Math.abs(state.disc.angularVelocity)).toBeGreaterThan(30);
  });
  it('shortens the string and pulls the disc upward when return is requested',()=>{
    const state=createYoyoState(bounds.width,bounds.height);state.disc.x=state.hand.x;state.disc.y=state.hand.y+state.stringLength;state.disc.angularVelocity=80;const before=state.stringLength;requestReturn(state);
    for(let i=0;i<60;i++)stepYoyo(state,input,1/120,bounds);
    expect(state.stringLength).toBeLessThan(before-40);expect(state.disc.y).toBeLessThan(state.hand.y+before-25);expect(state.phase).toBe('returning');
  });
});
