import { MarbleMazeVoice } from './audio';
import { createMarbleMazeState, type MarbleMazeState, stepMarbleMaze } from './model';

const TAG_NAME = 'marble-maze';
const BaseHTMLElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export interface MarbleMazeOptions { sound?: boolean; volume?: number }

export class MarbleMazeElement extends BaseHTMLElement {
  private readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d')!;
  private readonly voice = new MarbleMazeVoice();
  private resizeObserver?: ResizeObserver;
  private animationFrame = 0;
  private lastFrame = 0;
  private lastWallSound = 0;
  private stateValue = createMarbleMazeState();
  private pointerId?: number;
  private pointerOrigin = { x: 0, y: 0 };
  private pointerTilt = { x: 0, y: 0 };
  private readonly keys = new Set<string>();
  private soundEnabled = true;
  private initialized = false;
  private wonNotified = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    const hint = document.createElement('p');
    style.textContent = `
      :host{display:block;position:relative;min-height:480px;overflow:hidden;background:#b5844d;color:#3d2518;font:700 13px/1.4 ui-monospace,monospace}
      canvas{display:block;width:100%;height:100%;min-height:480px;touch-action:none;cursor:grab;outline:none}canvas:active{cursor:grabbing}
      .hint{position:absolute;left:16px;bottom:12px;margin:0;padding:6px 9px;border:1px solid rgba(57,33,20,.42);background:rgba(244,218,160,.87);pointer-events:none}
    `;
    hint.className = 'hint';
    hint.textContent = '按住拖动倾斜木盘 · 也可用方向键';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', '可倾斜的滚珠迷宫');
    root.append(style, this.canvas, hint);
  }

  get state(): Readonly<MarbleMazeState> { return this.stateValue; }
  get playbackState(): 'uninitialized' | 'suspended' | 'running' | 'unsupported' { return this.voice.playbackState; }

  connectedCallback(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('keydown', this.onKeyDown);
    this.canvas.addEventListener('keyup', this.onKeyUp);
    this.resize();
    this.lastFrame = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  disconnectedCallback(): void { this.destroy(); }

  configure(options: MarbleMazeOptions): void {
    if (typeof options.sound === 'boolean') this.soundEnabled = options.sound;
    if (Number.isFinite(options.volume)) this.setVolume(options.volume!);
  }

  async unlockSound(): Promise<boolean> { return this.soundEnabled ? this.voice.unlock() : false; }
  setVolume(value: number): void { this.voice.setVolume(value); }

  reset = (): void => {
    this.stateValue = createMarbleMazeState(this.clientWidth || 640, this.clientHeight || 520);
    this.wonNotified = false;
    this.pointerTilt = { x: 0, y: 0 };
    this.draw();
  };

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('keydown', this.onKeyDown);
    this.canvas.removeEventListener('keyup', this.onKeyUp);
    this.voice.destroy();
  }

  private point(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.isTrusted) void this.unlockSound();
    this.pointerId = event.pointerId;
    this.pointerOrigin = this.point(event);
    this.pointerTilt = { x: 0, y: 0 };
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.focus();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.pointerId !== event.pointerId || !this.canvas.hasPointerCapture(event.pointerId)) return;
    const point = this.point(event);
    this.pointerTilt.x = clamp((point.x - this.pointerOrigin.x) / 80, -1, 1);
    this.pointerTilt.y = clamp((point.y - this.pointerOrigin.y) / 80, -1, 1);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    if (this.pointerId === event.pointerId) this.pointerId = undefined;
    this.pointerTilt = { x: 0, y: 0 };
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.isTrusted) void this.unlockSound();
    this.keys.add(event.key);
  };

  private onKeyUp = (event: KeyboardEvent): void => { this.keys.delete(event.key); };

  private currentTilt(): { x: number; y: number } {
    if (this.pointerId !== undefined) return this.pointerTilt;
    return {
      x: Number(this.keys.has('ArrowRight')) - Number(this.keys.has('ArrowLeft')),
      y: Number(this.keys.has('ArrowDown')) - Number(this.keys.has('ArrowUp')),
    };
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    const speedBefore = Math.hypot(this.stateValue.ball.vx, this.stateValue.ball.vy);
    const result = stepMarbleMaze(this.stateValue, this.currentTilt(), dt);
    if (result.wallHit && now - this.lastWallSound > 65) {
      this.voice.wall(speedBefore / 260);
      this.lastWallSound = now;
    }
    if (result.trap) {
      this.voice.trap();
      this.dispatchEvent(new CustomEvent('fall'));
    }
    if (result.won && !this.wonNotified) {
      this.wonNotified = true;
      this.voice.goal();
      this.dispatchEvent(new CustomEvent('win', { detail: { elapsed: this.stateValue.elapsed, falls: this.stateValue.falls } }));
    }
    this.draw();
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private resize(): void {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, this.clientWidth || 640);
    const height = Math.max(1, this.clientHeight || 520);
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    if (!this.initialized || width !== this.stateValue.width || height !== this.stateValue.height) {
      this.stateValue = createMarbleMazeState(width, height);
      this.initialized = true;
    }
    this.draw();
  }

  private draw(): void {
    const width = this.clientWidth || 640;
    const height = this.clientHeight || 520;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const context = this.context;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const wood = context.createLinearGradient(0, 0, width, height);
    wood.addColorStop(0, '#d8ad69'); wood.addColorStop(1, '#9c6738');
    context.fillStyle = wood; context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(78,42,20,.14)'; context.lineWidth = 1;
    for (let y = 18; y < height; y += 30) { context.beginPath(); context.moveTo(0, y); context.bezierCurveTo(width * .3, y + 5, width * .7, y - 5, width, y + 2); context.stroke(); }

    for (const trap of this.stateValue.traps) {
      const shade = context.createRadialGradient(trap.x - 3, trap.y - 4, 2, trap.x, trap.y, trap.radius);
      shade.addColorStop(0, '#523019'); shade.addColorStop(1, '#1f140d');
      context.fillStyle = shade; context.beginPath(); context.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2); context.fill();
    }
    const goal = this.stateValue.goal;
    context.fillStyle = '#a97922'; context.beginPath(); context.arc(goal.x, goal.y, goal.radius + 4, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#352514'; context.beginPath(); context.arc(goal.x, goal.y, goal.radius - 2, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#f2cc62'; context.font = `700 ${Math.max(10, goal.radius * .8)}px ui-monospace`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText('终', goal.x, goal.y);

    for (const wall of this.stateValue.walls) {
      context.shadowColor = 'rgba(50,25,12,.32)'; context.shadowBlur = 5; context.shadowOffsetY = 3;
      context.fillStyle = '#704520'; context.fillRect(wall.x, wall.y, wall.width, wall.height);
      context.shadowColor = 'transparent'; context.strokeStyle = '#d5a45b'; context.lineWidth = 2; context.strokeRect(wall.x + 1, wall.y + 1, wall.width - 2, wall.height - 2);
    }

    const ball = this.stateValue.ball;
    const steel = context.createRadialGradient(ball.x - ball.radius * .35, ball.y - ball.radius * .4, 1, ball.x, ball.y, ball.radius);
    steel.addColorStop(0, '#fff8db'); steel.addColorStop(.28, '#bac4c0'); steel.addColorStop(.72, '#596564'); steel.addColorStop(1, '#222d2d');
    context.shadowColor = 'rgba(24,21,17,.4)'; context.shadowBlur = 5; context.shadowOffsetY = 4;
    context.fillStyle = steel; context.beginPath(); context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); context.fill(); context.shadowColor = 'transparent';

    if (this.stateValue.status === 'won') {
      context.fillStyle = 'rgba(54,31,17,.82)'; context.fillRect(width * .22, height * .42, width * .56, 58);
      context.fillStyle = '#f7d983'; context.font = '800 24px ui-monospace'; context.textAlign = 'center'; context.fillText('进洞了！', width / 2, height * .42 + 36);
    }
  }
}

export function defineMarbleMaze(tagName = TAG_NAME): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) customElements.define(tagName, MarbleMazeElement);
}
export function mountMarbleMaze(target: Element, options: MarbleMazeOptions = {}): MarbleMazeElement {
  defineMarbleMaze();
  const element = document.createElement(TAG_NAME) as MarbleMazeElement;
  element.configure(options); target.append(element); return element;
}
