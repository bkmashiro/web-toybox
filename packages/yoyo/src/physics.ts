export interface Vec2{x:number;y:number} export interface Body2D extends Vec2{vx:number;vy:number} export interface YoyoDisc extends Body2D{angle:number;angularVelocity:number}
export type YoyoPhase='falling'|'sleeping'|'returning';
export interface YoyoState{hand:Body2D;disc:YoyoDisc;discRadius:number;stringLength:number;maxStringLength:number;phase:YoyoPhase;taut:boolean;impactSerial:number;impactSpeed:number}
export interface YoyoInput extends Vec2{held:boolean} export interface YoyoBounds{width:number;height:number}
const clamp=(v:number,l:number,h:number)=>Math.min(h,Math.max(l,v));
export function createYoyoState(width:number,height:number):YoyoState{const w=Math.max(240,width),h=Math.max(320,height);const hand={x:w*.5,y:Math.max(72,h*.18),vx:0,vy:0};const length=Math.min(250,h*.42);return{hand,disc:{x:hand.x,y:hand.y+length*.72,vx:0,vy:0,angle:0,angularVelocity:8},discRadius:27,stringLength:length,maxStringLength:length,phase:'falling',taut:false,impactSerial:0,impactSpeed:0};}
export function requestReturn(state:YoyoState):void{if(Math.abs(state.disc.angularVelocity)<8)return;state.phase='returning';}
export function releaseYoyo(state:YoyoState):void{state.phase='falling';state.stringLength=state.maxStringLength;}
export function stepYoyo(state:YoyoState,input:YoyoInput,dt:number,bounds:YoyoBounds):void{const step=clamp(Number.isFinite(dt)?dt:0,0,1/30),width=Math.max(1,bounds.width),height=Math.max(1,bounds.height);
if(input.held&&Number.isFinite(input.x)&&Number.isFinite(input.y)){const ax=(input.x-state.hand.x)*120-state.hand.vx*18,ay=(input.y-state.hand.y)*120-state.hand.vy*18;state.hand.vx+=ax*step;state.hand.vy+=ay*step;}else{const d=Math.exp(-8*step);state.hand.vx*=d;state.hand.vy*=d;}
state.hand.x=clamp(state.hand.x+state.hand.vx*step,35,width-35);state.hand.y=clamp(state.hand.y+state.hand.vy*step,38,height*.55);
if(state.phase==='returning')state.stringLength=Math.max(36,state.stringLength-280*step);
state.disc.vy+=1120*step;const drag=Math.exp(-.11*step);state.disc.vx*=drag;state.disc.vy*=drag;state.disc.x+=state.disc.vx*step;state.disc.y+=state.disc.vy*step;
const dx=state.disc.x-state.hand.x,dy=state.disc.y-state.hand.y,distance=Math.hypot(dx,dy);state.taut=distance>=state.stringLength-.5;
if(distance>state.stringLength&&distance>0){const nx=dx/distance,ny=dy/distance;state.disc.x=state.hand.x+nx*state.stringLength;state.disc.y=state.hand.y+ny*state.stringLength;const outward=(state.disc.vx-state.hand.vx)*nx+(state.disc.vy-state.hand.vy)*ny;if(outward>0){state.disc.vx-=outward*nx;state.disc.vy-=outward*ny;state.disc.angularVelocity+=outward/state.discRadius*1.15;}}
const relativeSpeed=Math.hypot(state.disc.vx-state.hand.vx,state.disc.vy-state.hand.vy);if(state.phase!=='returning'&&state.taut&&relativeSpeed<35&&Math.abs(state.disc.angularVelocity)>28)state.phase='sleeping';
if(state.phase==='returning'){const dx2=state.disc.x-state.hand.x,dy2=state.disc.y-state.hand.y,dist2=Math.hypot(dx2,dy2)||1;const pull=900;state.disc.vx+=(-dx2/dist2*pull+state.hand.vx*.4)*step;state.disc.vy+=(-dy2/dist2*pull+state.hand.vy*.4)*step;}
state.disc.angularVelocity*=Math.exp(-(state.phase==='sleeping'?.09:.24)*step);state.disc.angle=Math.atan2(Math.sin(state.disc.angle+state.disc.angularVelocity*step),Math.cos(state.disc.angle+state.disc.angularVelocity*step));
const r=state.discRadius;if(state.disc.x<r||state.disc.x>width-r){state.disc.x=clamp(state.disc.x,r,width-r);state.disc.vx*=-.48;}if(state.disc.y>height-r){state.disc.y=height-r;if(Math.abs(state.disc.vy)>45){state.impactSerial++;state.impactSpeed=Math.abs(state.disc.vy);}state.disc.vy*=-.34;state.disc.angularVelocity+=state.disc.vx/r*.5;}if(state.disc.y<r){state.disc.y=r;state.disc.vy=Math.abs(state.disc.vy)*.35;}
}
