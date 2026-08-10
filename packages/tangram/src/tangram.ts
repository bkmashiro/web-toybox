import { TangramVoice } from './audio';
import { bringPieceToFront, createTangramState, hitPiece, movePiece, resizeTangramState, rotatePiece, type TangramState } from './model';

const TAG_NAME = 'tangram-puzzle';
const BaseHTMLElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

export interface TangramOptions { sound?: boolean; volume?: number }

export class TangramPuzzleElement extends BaseHTMLElement {
  private readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d')!;
  private readonly voice = new TangramVoice();
  private resizeObserver?: ResizeObserver;
  private stateValue = createTangramState();
  private selected?: string;
  private dragOffset = { x: 0, y: 0 };
  private soundEnabled = true;
  private initialized = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    const hint = document.createElement('p');
    style.textContent = `
      :host{display:block;position:relative;min-height:480px;overflow:hidden;background:#ead29d;color:#4c2d1d;font:600 13px/1.4 ui-monospace,monospace}
      canvas{display:block;width:100%;height:100%;min-height:480px;touch-action:none;cursor:grab;outline:none}
      canvas:active{cursor:grabbing}.hint{position:absolute;left:16px;bottom:12px;margin:0;padding:6px 9px;border:1px solid rgba(77,43,25,.34);background:rgba(247,231,190,.84);pointer-events:none}
    `;
    hint.className = 'hint';
    hint.textContent = '拖动拼片 · 双击或按空格旋转 45°';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', '可拖动和旋转的七巧板');
    root.append(style, this.canvas, hint);
  }

  get state(): Readonly<TangramState> { return this.stateValue; }
  get playbackState(): 'uninitialized' | 'suspended' | 'running' | 'unsupported' { return this.voice.playbackState; }

  connectedCallback(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('dblclick', this.onDoubleClick);
    this.canvas.addEventListener('keydown', this.onKeyDown);
    this.resize();
  }

  disconnectedCallback(): void { this.destroy(); }

  configure(options: TangramOptions): void {
    if (typeof options.sound === 'boolean') this.soundEnabled = options.sound;
    if (Number.isFinite(options.volume)) this.setVolume(options.volume!);
  }

  async unlockSound(): Promise<boolean> { return this.soundEnabled ? this.voice.unlock() : false; }
  setVolume(value: number): void { this.voice.setVolume(value); }

  reset = (): void => {
    this.stateValue = createTangramState(this.clientWidth || 640, this.clientHeight || 520);
    this.selected = undefined;
    this.draw();
  };

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('dblclick', this.onDoubleClick);
    this.canvas.removeEventListener('keydown', this.onKeyDown);
    this.voice.destroy();
  }

  private point(event: PointerEvent | MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.isTrusted) void this.unlockSound();
    const point = this.point(event);
    const id = hitPiece(this.stateValue, point.x, point.y);
    if (!id) return;
    this.selected = id;
    const piece = this.stateValue.pieces.find((candidate) => candidate.id === id)!;
    this.dragOffset = { x: piece.x - point.x, y: piece.y - point.y };
    bringPieceToFront(this.stateValue, id);
    this.canvas.setPointerCapture(event.pointerId);
    this.draw();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.selected || !this.canvas.hasPointerCapture(event.pointerId)) return;
    const point = this.point(event);
    movePiece(
      this.stateValue,
      this.selected,
      Math.min(this.clientWidth - 25, Math.max(25, point.x + this.dragOffset.x)),
      Math.min(this.clientHeight - 25, Math.max(25, point.y + this.dragOffset.y)),
    );
    this.draw();
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    if (this.selected) this.voice.click(330);
  };

  private onDoubleClick = (event: MouseEvent): void => {
    if (event.isTrusted) void this.unlockSound();
    const point = this.point(event);
    const id = hitPiece(this.stateValue, point.x, point.y);
    if (id && rotatePiece(this.stateValue, id)) {
      this.selected = id;
      bringPieceToFront(this.stateValue, id);
      this.voice.click(440);
      this.draw();
    }
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.selected || ![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    if (event.isTrusted) void this.unlockSound();
    rotatePiece(this.stateValue, this.selected);
    this.voice.click(440);
    this.draw();
  };

  private resize(): void {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, this.clientWidth || 640);
    const height = Math.max(1, this.clientHeight || 520);
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    if (!this.initialized) {
      this.stateValue = createTangramState(width, height);
      this.initialized = true;
    } else if (width !== this.stateValue.width || height !== this.stateValue.height) {
      resizeTangramState(this.stateValue, width, height);
    }
    this.draw();
  }

  private draw(): void {
    const width = this.clientWidth || 640;
    const height = this.clientHeight || 520;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const context = this.context;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const paper = context.createLinearGradient(0, 0, width, height);
    paper.addColorStop(0, '#f3e2b7');
    paper.addColorStop(1, '#d7b875');
    context.fillStyle = paper;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(91,55,29,.09)';
    context.lineWidth = 1;
    for (let x = 18; x < width; x += 24) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    }
    for (let y = 18; y < height; y += 24) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    }

    context.save();
    context.setLineDash([8, 7]);
    context.strokeStyle = 'rgba(73,49,31,.22)';
    context.lineWidth = 2;
    const guide = Math.min(width, height) * 0.47;
    context.strokeRect((width - guide) / 2, (height - guide) / 2, guide, guide);
    context.restore();

    for (const piece of this.stateValue.pieces) {
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.beginPath();
      context.moveTo(piece.points[0].x, piece.points[0].y);
      for (const point of piece.points.slice(1)) context.lineTo(point.x, point.y);
      context.closePath();
      context.shadowColor = 'rgba(61,35,20,.28)';
      context.shadowBlur = piece.id === this.selected ? 11 : 6;
      context.shadowOffsetY = 4;
      context.fillStyle = piece.color;
      context.fill();
      context.shadowColor = 'transparent';
      context.strokeStyle = piece.id === this.selected ? '#fff0b8' : '#4a2b20';
      context.lineWidth = piece.id === this.selected ? 4 : 2.5;
      context.stroke();
      context.globalAlpha = 0.22;
      context.strokeStyle = '#fff4cb';
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(piece.points[0].x * 0.72, piece.points[0].y * 0.72);
      for (const point of piece.points.slice(1)) context.lineTo(point.x * 0.72, point.y * 0.72);
      context.stroke();
      context.restore();
    }
  }
}

export function defineTangram(tagName = TAG_NAME): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) customElements.define(tagName, TangramPuzzleElement);
}

export function mountTangram(target: Element, options: TangramOptions = {}): TangramPuzzleElement {
  defineTangram();
  const element = document.createElement(TAG_NAME) as TangramPuzzleElement;
  element.configure(options);
  target.append(element);
  return element;
}
