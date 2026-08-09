import { KendamaVoice } from './audio';
import {
  createKendamaState,
  getBallHole,
  getKendamaGeometry,
  releaseKendama,
  stepKendama,
  type KendamaState,
  type KendamaMode,
} from './physics';
import { styles } from './styles';

const TAG_NAME = 'retro-kendama';
const FIXED_STEP = 1 / 120;
const HTMLElementBase = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

export interface KendamaOptions {
  sound?: boolean;
  ropeLength?: number;
  mode?: KendamaMode;
}

export class RetroKendamaElement extends HTMLElementBase {
  private readonly canvas = document.createElement('canvas');
  private readonly hint = document.createElement('p');
  private readonly context = this.canvas.getContext('2d')!;
  private readonly voice = new KendamaVoice();
  private stateValue: KendamaState = createKendamaState(640, 620);
  private pointer = { held: false, x: 0, y: 0 };
  private resizeObserver?: ResizeObserver;
  private frame = 0;
  private previousTime = 0;
  private accumulator = 0;
  private previousImpact = 0;
  private soundEnabled = true;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styles;
    this.hint.className = 'hint';
    this.syncHint();
    this.canvas.setAttribute('aria-label', '可甩动的网页剑玉');
    this.canvas.tabIndex = 0;
    root.append(style, this.canvas, this.hint);
  }

  get state(): Readonly<KendamaState> { return this.stateValue; }
  get playbackState(): KendamaVoice['playbackState'] { return this.voice.playbackState; }

  connectedCallback(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('dblclick', this.release);
    this.resize();
    this.frame = requestAnimationFrame(this.tick);
  }

  disconnectedCallback(): void {
    this.destroy();
  }

  configure(options: KendamaOptions): void {
    if (typeof options.sound === 'boolean') this.soundEnabled = options.sound;
    if (Number.isFinite(options.ropeLength)) this.stateValue.ropeLength = Math.min(260, Math.max(90, options.ropeLength!));
    if (options.mode && options.mode !== this.stateValue.mode) this.setMode(options.mode);
  }

  setMode(mode: KendamaMode): void {
    const ropeLength = this.stateValue.ropeLength;
    this.stateValue = createKendamaState(this.clientWidth || 640, this.clientHeight || 620, mode);
    this.stateValue.ropeLength = ropeLength;
    this.previousImpact = 0;
    this.syncHint();
  }

  async unlockSound(): Promise<boolean> {
    if (!this.soundEnabled) return false;
    return this.voice.unlock();
  }

  reset = (): void => {
    this.stateValue = createKendamaState(this.clientWidth || 640, this.clientHeight || 620, this.stateValue.mode);
    this.previousImpact = 0;
  };

  release = (): void => releaseKendama(this.stateValue);

  private syncHint(): void {
    this.hint.textContent = this.stateValue.mode === 'hard'
      ? '困难模式 · 球洞对准剑尖才能入玉'
      : '普通模式 · 拖住剑身甩球 · 双击放球';
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('dblclick', this.release);
    this.voice.destroy();
  }

  private resize(): void {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(this.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  private point(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private onPointerDown = (event: PointerEvent): void => {
    const point = this.point(event);
    this.pointer = { held: true, ...point };
    this.canvas.setPointerCapture(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.pointer.held) return;
    Object.assign(this.pointer, this.point(event));
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.pointer.held = false;
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
  };

  private tick = (time: number): void => {
    const elapsed = Math.min(0.05, Math.max(0, (time - this.previousTime) / 1000));
    this.previousTime = time;
    this.accumulator += elapsed;
    const bounds = { width: this.clientWidth || 640, height: this.clientHeight || 620 };
    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < 8) {
      stepKendama(this.stateValue, this.pointer, FIXED_STEP, bounds);
      this.accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (this.stateValue.impactSerial !== this.previousImpact) {
      this.previousImpact = this.stateValue.impactSerial;
      this.voice.strike(this.stateValue.impactSpeed, this.stateValue.impactKind);
    }
    this.draw(bounds.width, bounds.height);
    this.frame = requestAnimationFrame(this.tick);
  };

  private draw(width: number, height: number): void {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const context = this.context;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const wash = context.createLinearGradient(0, 0, 0, height);
    wash.addColorStop(0, '#f7eac8');
    wash.addColorStop(1, '#e8c98e');
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(95,58,32,.08)';
    context.lineWidth = 1;
    for (let y = 24; y < height; y += 28) {
      context.beginPath();
      context.moveTo(0, y + Math.sin(y) * 2);
      context.lineTo(width, y);
      context.stroke();
    }

    const geometry = getKendamaGeometry(this.stateValue);
    context.strokeStyle = '#7d4b2d';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(geometry.stringAnchor.x, geometry.stringAnchor.y);
    const stringEnd = this.stateValue.mode === 'hard' ? getBallHole(this.stateValue) : this.stateValue.ball;
    context.lineTo(stringEnd.x, stringEnd.y);
    context.stroke();

    context.save();
    context.translate(this.stateValue.handle.x, this.stateValue.handle.y);
    context.rotate(this.stateValue.tilt);
    context.lineCap = 'round';
    context.strokeStyle = '#4b2e1d';
    context.fillStyle = '#c78039';
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(-12, -72, 24, 145, 11);
    context.fill();
    context.stroke();
    context.fillStyle = '#e0a85d';
    context.beginPath();
    context.moveTo(-52, -34);
    context.quadraticCurveTo(-45, -7, -18, -22);
    context.lineTo(18, -24);
    context.quadraticCurveTo(38, -11, 43, -38);
    context.lineTo(28, -43);
    context.quadraticCurveTo(24, -31, 12, -33);
    context.lineTo(-18, -31);
    context.quadraticCurveTo(-34, -17, -39, -40);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = '#8e4c28';
    context.beginPath();
    context.moveTo(-7, -72);
    context.lineTo(0, -98);
    context.lineTo(7, -72);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();

    context.save();
    context.translate(this.stateValue.ball.x, this.stateValue.ball.y);
    context.rotate(this.stateValue.ball.angle);
    const ballGradient = context.createRadialGradient(-8, -10, 2, 0, 0, this.stateValue.ballRadius);
    ballGradient.addColorStop(0, '#f65e42');
    ballGradient.addColorStop(1, '#a71f24');
    context.fillStyle = ballGradient;
    context.strokeStyle = '#651d1e';
    context.lineWidth = 4;
    context.beginPath();
    context.arc(0, 0, this.stateValue.ballRadius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.strokeStyle = 'rgba(255,190,135,.45)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, this.stateValue.ballRadius * 0.63, -0.8, 0.8);
    context.stroke();
    context.fillStyle = '#3d2118';
    context.beginPath();
    context.ellipse(this.stateValue.ballRadius * 0.72, 0, 7, 4.5, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#f0a35f';
    context.lineWidth = 1.5;
    context.stroke();
    context.restore();
  }
}

export function defineKendama(tagName = TAG_NAME): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) customElements.define(tagName, RetroKendamaElement);
}

export function mountKendama(target: Element, options: KendamaOptions = {}): RetroKendamaElement {
  defineKendama();
  const element = document.createElement(TAG_NAME) as RetroKendamaElement;
  element.configure(options);
  target.append(element);
  return element;
}
