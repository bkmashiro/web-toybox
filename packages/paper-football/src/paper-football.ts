import { PaperFootballVoice } from './audio';
import { createPaperFootballState, kickPaperFootball, resetPaperFootball, stepPaperFootball, type PaperFootballState } from './model';

const TAG_NAME = 'paper-football';
const BaseHTMLElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;
export interface PaperFootballOptions { sound?: boolean; volume?: number }

export class PaperFootballElement extends BaseHTMLElement {
  private readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d')!;
  private readonly voice = new PaperFootballVoice();
  private resizeObserver?: ResizeObserver;
  private animationFrame = 0;
  private lastFrame = 0;
  private lastRailSound = 0;
  private stateValue = createPaperFootballState();
  private dragPoint?: { x: number; y: number };
  private pointerId?: number;
  private soundEnabled = true;
  private initialized = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    const hint = document.createElement('p');
    style.textContent = `
      :host{display:block;position:relative;min-height:480px;overflow:hidden;background:#698257;color:#f4e8b4;font:700 13px/1.4 ui-monospace,monospace}
      canvas{display:block;width:100%;height:100%;min-height:480px;touch-action:none;cursor:grab;outline:none}canvas:active{cursor:grabbing}
      .hint{position:absolute;left:16px;bottom:12px;margin:0;padding:6px 9px;border:1px solid rgba(54,43,27,.42);background:rgba(239,218,155,.88);color:#3f3020;pointer-events:none}
    `;
    hint.className = 'hint';
    hint.textContent = '按住纸片向后拉，松手射门 · 空格直射';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', '可拉动弹射的桌上纸足球');
    root.append(style, this.canvas, hint);
  }

  get state(): Readonly<PaperFootballState> { return this.stateValue; }
  get playbackState(): 'uninitialized' | 'suspended' | 'running' | 'unsupported' { return this.voice.playbackState; }

  connectedCallback(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
    this.canvas.addEventListener('keydown', this.onKeyDown);
    this.resize();
    this.lastFrame = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  disconnectedCallback(): void { this.destroy(); }

  configure(options: PaperFootballOptions): void {
    if (typeof options.sound === 'boolean') this.soundEnabled = options.sound;
    if (Number.isFinite(options.volume)) this.setVolume(options.volume!);
  }
  async unlockSound(): Promise<boolean> { return this.soundEnabled ? this.voice.unlock() : false; }
  setVolume(value: number): void { this.voice.setVolume(value); }

  kick = (vx = 0, vy = -620): boolean => {
    const kicked = kickPaperFootball(this.stateValue, vx, vy);
    if (kicked) {
      this.voice.flick(Math.hypot(vx, vy) / 650);
      this.dispatchEvent(new CustomEvent('kick', { detail: { vx, vy, shots: this.stateValue.shots } }));
    }
    return kicked;
  };

  reset = (): void => { resetPaperFootball(this.stateValue); this.dragPoint = undefined; this.draw(); };

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.removeEventListener('keydown', this.onKeyDown);
    this.voice.destroy();
  }

  private point(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.isTrusted) void this.unlockSound();
    if (this.stateValue.paper.moving) return;
    const point = this.point(event);
    if (Math.hypot(point.x - this.stateValue.paper.x, point.y - this.stateValue.paper.y) > this.stateValue.paper.radius * 2.2) return;
    this.pointerId = event.pointerId;
    this.dragPoint = point;
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.focus();
    this.draw();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.pointerId !== event.pointerId || !this.canvas.hasPointerCapture(event.pointerId)) return;
    this.dragPoint = this.point(event);
    this.draw();
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    if (this.pointerId !== event.pointerId || !this.dragPoint) return;
    const point = this.point(event);
    const vx = (this.stateValue.paper.x - point.x) * 6.2;
    const vy = (this.stateValue.paper.y - point.y) * 6.2;
    this.pointerId = undefined;
    this.dragPoint = undefined;
    this.kick(vx, vy);
  };

  private onPointerCancel = (event: PointerEvent): void => {
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    this.pointerId = undefined; this.dragPoint = undefined; this.draw();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (![' ', 'Enter', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    if (event.isTrusted) void this.unlockSound();
    this.kick(0, -650);
  };

  private tick = (now: number): void => {
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    const speed = Math.hypot(this.stateValue.paper.vx, this.stateValue.paper.vy);
    const result = stepPaperFootball(this.stateValue, dt);
    if (result.railHit && now - this.lastRailSound > 70) {
      this.voice.rail(speed / 500); this.lastRailSound = now;
    }
    if (result.goal) {
      this.voice.goal();
      this.dispatchEvent(new CustomEvent('goal', { detail: { score: this.stateValue.score, shots: this.stateValue.shots } }));
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
      this.stateValue = createPaperFootballState(width, height);
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
    const felt = context.createLinearGradient(0, 0, width, height);
    felt.addColorStop(0, '#7c9566'); felt.addColorStop(1, '#4f6b45');
    context.fillStyle = felt; context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgba(255,244,202,.07)';
    for (let y = 12; y < height; y += 18) for (let x = (y / 18) % 2 ? 8 : 0; x < width; x += 22) context.fillRect(x, y, 9, 1);

    context.strokeStyle = 'rgba(245,231,175,.55)'; context.lineWidth = 3;
    context.strokeRect(14, 14, width - 28, height - 28);
    context.beginPath(); context.moveTo(14, height / 2); context.lineTo(width - 14, height / 2); context.stroke();
    context.beginPath(); context.arc(width / 2, height / 2, Math.min(48, width * .1), 0, Math.PI * 2); context.stroke();

    const goalLeft = this.stateValue.goal.x - this.stateValue.goal.width / 2;
    const goalRight = this.stateValue.goal.x + this.stateValue.goal.width / 2;
    context.strokeStyle = '#eee0ab'; context.lineWidth = 7;
    context.beginPath(); context.moveTo(goalLeft, 28); context.lineTo(goalLeft, 2); context.lineTo(goalRight, 2); context.lineTo(goalRight, 28); context.stroke();
    context.strokeStyle = 'rgba(238,224,171,.26)'; context.lineWidth = 1;
    for (let x = goalLeft + 12; x < goalRight; x += 12) { context.beginPath(); context.moveTo(x, 2); context.lineTo(x, 32); context.stroke(); }

    const paper = this.stateValue.paper;
    if (this.dragPoint) {
      context.setLineDash([7, 6]); context.strokeStyle = '#f4d878'; context.lineWidth = 2;
      context.beginPath(); context.moveTo(paper.x, paper.y); context.lineTo(this.dragPoint.x, this.dragPoint.y); context.stroke(); context.setLineDash([]);
      const power = Math.min(1, Math.hypot(paper.x - this.dragPoint.x, paper.y - this.dragPoint.y) / 145);
      context.fillStyle = '#d8b44d'; context.fillRect(18, 18, (width - 36) * power, 5);
    }

    context.save(); context.translate(paper.x, paper.y); context.rotate(paper.angle);
    context.shadowColor = 'rgba(31,28,17,.38)'; context.shadowBlur = 6; context.shadowOffsetY = 4;
    context.fillStyle = '#efe2aa'; context.beginPath(); context.moveTo(0, -paper.radius * 1.15); context.lineTo(paper.radius, paper.radius * .75); context.lineTo(-paper.radius, paper.radius * .75); context.closePath(); context.fill();
    context.shadowColor = 'transparent'; context.strokeStyle = '#6f5834'; context.lineWidth = 2; context.stroke();
    context.strokeStyle = 'rgba(111,88,52,.5)'; context.lineWidth = 1; context.beginPath(); context.moveTo(0, -paper.radius * 1.15); context.lineTo(0, paper.radius * .75); context.moveTo(-paper.radius, paper.radius * .75); context.lineTo(paper.radius * .45, paper.radius * .08); context.stroke();
    context.restore();
  }
}

export function definePaperFootball(tagName = TAG_NAME): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) customElements.define(tagName, PaperFootballElement);
}
export function mountPaperFootball(target: Element, options: PaperFootballOptions = {}): PaperFootballElement {
  definePaperFootball(); const element = document.createElement(TAG_NAME) as PaperFootballElement; element.configure(options); target.append(element); return element;
}
