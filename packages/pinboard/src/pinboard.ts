import { PinboardVoice } from './audio';
import { createPinboardState, dropPinboardBall, resetPinboard, setPinboardLauncher, stepPinboard, type PinboardState } from './model';

const TAG_NAME = 'toy-pinboard';
const BaseHTMLElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;
export interface PinboardOptions { sound?: boolean; volume?: number }

export class PinboardElement extends BaseHTMLElement {
  private readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d')!;
  private readonly voice = new PinboardVoice();
  private resizeObserver?: ResizeObserver;
  private animationFrame = 0;
  private lastFrame = 0;
  private stateValue = createPinboardState();
  private dragging = false;
  private pointerId?: number;
  private soundEnabled = true;
  private initialized = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    const hint = document.createElement('p');
    style.textContent = `
      :host{display:block;position:relative;min-height:480px;overflow:hidden;background:#28485a;color:#f2d889;font:700 13px/1.4 ui-monospace,monospace}
      canvas{display:block;width:100%;height:100%;min-height:480px;touch-action:none;cursor:crosshair;outline:none}
      .hint{position:absolute;left:16px;top:12px;margin:0;padding:6px 9px;border:1px solid rgba(243,213,130,.46);background:rgba(26,49,62,.88);pointer-events:none}
    `;
    hint.className = 'hint';
    hint.textContent = '顶部选位置，松手落珠 · ← → 与空格也可操作';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', '弹珠钉板，移动落珠位置并放球');
    root.append(style, this.canvas, hint);
  }

  get state(): Readonly<PinboardState> { return this.stateValue; }
  get playbackState(): 'uninitialized' | 'suspended' | 'running' | 'unsupported' { return this.voice.playbackState; }

  connectedCallback(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('keydown', this.onKeyDown);
    this.resize();
    this.lastFrame = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  disconnectedCallback(): void { this.destroy(); }

  configure(options: PinboardOptions): void {
    if (typeof options.sound === 'boolean') this.soundEnabled = options.sound;
    if (Number.isFinite(options.volume)) this.setVolume(options.volume!);
  }
  async unlockSound(): Promise<boolean> { return this.soundEnabled ? this.voice.unlock() : false; }
  setVolume(value: number): void { this.voice.setVolume(value); }

  drop = (x?: number): boolean => {
    if (Number.isFinite(x)) setPinboardLauncher(this.stateValue, x!);
    const dropped = dropPinboardBall(this.stateValue);
    if (dropped) this.dispatchEvent(new CustomEvent('drop', { detail: { x: this.stateValue.launcherX } }));
    return dropped;
  };

  reset = (): void => { resetPinboard(this.stateValue); this.draw(); };

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('keydown', this.onKeyDown);
    this.voice.destroy();
  }

  private pointX(event: PointerEvent): number {
    const rect = this.canvas.getBoundingClientRect();
    return event.clientX - rect.left;
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.isTrusted) void this.unlockSound();
    if (this.stateValue.ball.active) return;
    this.dragging = true;
    this.pointerId = event.pointerId;
    setPinboardLauncher(this.stateValue, this.pointX(event));
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.focus();
    this.draw();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging || this.pointerId !== event.pointerId) return;
    setPinboardLauncher(this.stateValue, this.pointX(event));
    this.draw();
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    if (!this.dragging || this.pointerId !== event.pointerId) return;
    this.dragging = false;
    this.pointerId = undefined;
    setPinboardLauncher(this.stateValue, this.pointX(event));
    this.drop();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    if (event.isTrusted) void this.unlockSound();
    if (event.key === 'ArrowLeft') setPinboardLauncher(this.stateValue, this.stateValue.launcherX - this.stateValue.width * 0.055);
    if (event.key === 'ArrowRight') setPinboardLauncher(this.stateValue, this.stateValue.launcherX + this.stateValue.width * 0.055);
    if (event.key === ' ' || event.key === 'Enter') this.drop();
    this.draw();
  };

  private tick = (now: number): void => {
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    const speed = Math.hypot(this.stateValue.ball.vx, this.stateValue.ball.vy);
    const result = stepPinboard(this.stateValue, dt);
    if (result.pegHits) this.voice.peg(speed / 320);
    if (result.pocket !== undefined) {
      this.voice.pocket(result.pocket);
      this.dispatchEvent(new CustomEvent('pocket', { detail: { pocket: result.pocket, points: result.scoreDelta, score: this.stateValue.score } }));
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
      this.stateValue = createPinboardState(width, height);
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
    const board = context.createLinearGradient(0, 0, width, height);
    board.addColorStop(0, '#315f70'); board.addColorStop(1, '#173441');
    context.fillStyle = board; context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(233,203,117,.13)'; context.lineWidth = 1;
    for (let x = 12; x < width; x += 28) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x + 20, height); context.stroke(); }

    context.fillStyle = '#d4a94d';
    context.fillRect(this.stateValue.launcherX - 2, 4, 4, height * .13);
    context.beginPath(); context.moveTo(this.stateValue.launcherX - 12, 12); context.lineTo(this.stateValue.launcherX + 12, 12); context.lineTo(this.stateValue.launcherX, 28); context.closePath(); context.fill();

    for (const peg of this.stateValue.pegs) {
      const brass = context.createRadialGradient(peg.x - 2, peg.y - 3, 1, peg.x, peg.y, peg.radius + 2);
      brass.addColorStop(0, '#fff1a7'); brass.addColorStop(.45, '#c69736'); brass.addColorStop(1, '#60421f');
      context.shadowColor = 'rgba(0,0,0,.35)'; context.shadowBlur = 3; context.shadowOffsetY = 2;
      context.fillStyle = brass; context.beginPath(); context.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2); context.fill();
    }
    context.shadowColor = 'transparent';

    const pocketWidth = width / this.stateValue.pockets.length;
    const pocketTop = height - Math.max(58, height * .13);
    for (let index = 0; index < this.stateValue.pockets.length; index += 1) {
      context.fillStyle = index === 2 ? '#b34d38' : index % 2 ? '#d1a24a' : '#e1c67b';
      context.globalAlpha = .88; context.fillRect(index * pocketWidth + 2, pocketTop, pocketWidth - 4, height - pocketTop);
      context.globalAlpha = 1; context.strokeStyle = '#472f20'; context.lineWidth = 3; context.strokeRect(index * pocketWidth + 2, pocketTop, pocketWidth - 4, height - pocketTop);
      context.fillStyle = index === 2 ? '#fff3b4' : '#3e2b1d'; context.font = '800 17px ui-monospace'; context.textAlign = 'center'; context.fillText(String(this.stateValue.pockets[index]), (index + .5) * pocketWidth, pocketTop + 31);
    }

    const ball = this.stateValue.ball;
    const glass = context.createRadialGradient(ball.x - ball.radius * .4, ball.y - ball.radius * .45, 1, ball.x, ball.y, ball.radius);
    glass.addColorStop(0, '#fff8d1'); glass.addColorStop(.25, '#8dc4bd'); glass.addColorStop(.68, '#2f7a78'); glass.addColorStop(1, '#173b42');
    context.shadowColor = 'rgba(0,0,0,.45)'; context.shadowBlur = 5; context.shadowOffsetY = 3;
    context.fillStyle = glass; context.beginPath(); context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); context.fill(); context.shadowColor = 'transparent';
  }
}

export function definePinboard(tagName = TAG_NAME): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) customElements.define(tagName, PinboardElement);
}
export function mountPinboard(target: Element, options: PinboardOptions = {}): PinboardElement {
  definePinboard(); const element = document.createElement(TAG_NAME) as PinboardElement; element.configure(options); target.append(element); return element;
}
