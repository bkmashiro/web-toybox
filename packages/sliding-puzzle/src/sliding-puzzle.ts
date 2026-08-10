import { SlidingVoice } from './audio';
import { createSlidingState, moveTile, shuffleSliding, type SlidingState } from './model';

const TAG_NAME = 'sliding-puzzle';
const BaseHTMLElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

export interface SlidingPuzzleOptions { sound?: boolean; volume?: number; seed?: number }

export class SlidingPuzzleElement extends BaseHTMLElement {
  private readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d')!;
  private readonly hint = document.createElement('p');
  private readonly voice = new SlidingVoice();
  private resizeObserver?: ResizeObserver;
  private stateValue = createSlidingState();
  private soundEnabled = true;
  private initialSeed?: number;
  private initialized = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host{display:block;position:relative;min-height:480px;overflow:hidden;background:#d7b56f;color:#4b2d1c;font:700 13px/1.4 ui-monospace,monospace}
      canvas{display:block;width:100%;height:100%;min-height:480px;touch-action:manipulation;outline:none;cursor:pointer}
      .hint{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);margin:0;padding:6px 10px;white-space:nowrap;border:1px solid rgba(72,43,27,.4);background:rgba(249,231,187,.88);pointer-events:none}
    `;
    this.hint.className = 'hint';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', '可点击和使用方向键移动的十五滑块');
    root.append(style, this.canvas, this.hint);
  }

  get state(): Readonly<SlidingState> { return this.stateValue; }
  get playbackState(): 'uninitialized' | 'suspended' | 'running' | 'unsupported' { return this.voice.playbackState; }

  connectedCallback(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this);
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('keydown', this.onKeyDown);
    if (!this.initialized) {
      this.shuffle(this.initialSeed ?? Date.now());
      this.initialized = true;
    }
    this.resize();
  }

  disconnectedCallback(): void { this.destroy(); }

  configure(options: SlidingPuzzleOptions): void {
    if (typeof options.sound === 'boolean') this.soundEnabled = options.sound;
    if (Number.isFinite(options.volume)) this.setVolume(options.volume!);
    if (Number.isFinite(options.seed)) this.initialSeed = options.seed;
  }

  async unlockSound(): Promise<boolean> { return this.soundEnabled ? this.voice.unlock() : false; }
  setVolume(value: number): void { this.voice.setVolume(value); }

  shuffle = (seed = Date.now()): void => {
    shuffleSliding(this.stateValue, seed, 180);
    this.updateHint();
    this.draw();
  };

  reset = (): void => this.shuffle(Date.now());

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('keydown', this.onKeyDown);
    this.voice.destroy();
  }

  private boardGeometry(): { left: number; top: number; size: number; cell: number } {
    const width = this.clientWidth || 640;
    const height = this.clientHeight || 520;
    const size = Math.min(width - 46, height - 82, 430);
    return { left: (width - size) / 2, top: Math.max(22, (height - size) / 2 - 10), size, cell: size / 4 };
  }

  private onClick = (event: MouseEvent): void => {
    if (event.isTrusted) void this.unlockSound();
    const rect = this.canvas.getBoundingClientRect();
    const { left, top, size, cell } = this.boardGeometry();
    const x = event.clientX - rect.left - left;
    const y = event.clientY - rect.top - top;
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const index = Math.floor(y / cell) * 4 + Math.floor(x / cell);
    const tile = this.stateValue.cells[index];
    if (moveTile(this.stateValue, tile)) {
      this.voice.click(this.stateValue.won ? 520 : 245 + tile * 4);
      this.updateHint();
      this.draw();
    }
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[event.key];
    if (delta === undefined) return;
    const blank = this.stateValue.cells.indexOf(0);
    const target = blank + delta;
    if (target < 0 || target >= 16 || (Math.abs(delta) === 1 && Math.floor(blank / 4) !== Math.floor(target / 4))) return;
    event.preventDefault();
    if (event.isTrusted) void this.unlockSound();
    const tile = this.stateValue.cells[target];
    if (moveTile(this.stateValue, tile)) {
      this.voice.click(245 + tile * 4);
      this.updateHint();
      this.draw();
    }
  };

  private updateHint(): void {
    this.hint.textContent = this.stateValue.won
      ? `完成！用了 ${this.stateValue.moves} 步`
      : `步数 ${this.stateValue.moves} · 点击滑块或使用方向键`;
  }

  private resize(): void {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round((this.clientWidth || 640) * ratio));
    this.canvas.height = Math.max(1, Math.round((this.clientHeight || 520) * ratio));
    this.updateHint();
    this.draw();
  }

  private draw(): void {
    const width = this.clientWidth || 640;
    const height = this.clientHeight || 520;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const context = this.context;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const paper = context.createLinearGradient(0, 0, 0, height);
    paper.addColorStop(0, '#f0ddb0');
    paper.addColorStop(1, '#cfaa61');
    context.fillStyle = paper;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(81,47,26,.1)';
    for (let y = 20; y < height; y += 27) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y + 1); context.stroke();
    }

    const { left, top, size, cell } = this.boardGeometry();
    context.fillStyle = '#5f3520';
    context.shadowColor = 'rgba(55,30,17,.32)';
    context.shadowBlur = 14;
    context.shadowOffsetY = 7;
    context.beginPath();
    context.roundRect(left - 15, top - 15, size + 30, size + 30, 18);
    context.fill();
    context.shadowColor = 'transparent';
    context.fillStyle = '#8b502c';
    context.beginPath();
    context.roundRect(left - 8, top - 8, size + 16, size + 16, 12);
    context.fill();

    this.stateValue.cells.forEach((tile, index) => {
      if (tile === 0) return;
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = left + column * cell + 4;
      const y = top + row * cell + 4;
      const tileSize = cell - 8;
      const wood = context.createLinearGradient(x, y, x + tileSize, y + tileSize);
      wood.addColorStop(0, tile % 3 === 0 ? '#d16a3e' : '#e4b260');
      wood.addColorStop(1, tile % 3 === 0 ? '#9f3f2d' : '#b87536');
      context.fillStyle = wood;
      context.strokeStyle = '#4a2b1e';
      context.lineWidth = 2.5;
      context.shadowColor = 'rgba(45,24,14,.28)';
      context.shadowBlur = 4;
      context.shadowOffsetY = 3;
      context.beginPath();
      context.roundRect(x, y, tileSize, tileSize, Math.max(8, cell * 0.11));
      context.fill();
      context.shadowColor = 'transparent';
      context.stroke();
      context.fillStyle = '#4a2718';
      context.font = `800 ${Math.max(20, cell * 0.33)}px Georgia,serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(tile), x + tileSize / 2, y + tileSize / 2 + 1);
      context.strokeStyle = 'rgba(255,236,180,.34)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x + 12, y + tileSize * 0.28);
      context.lineTo(x + tileSize - 12, y + tileSize * 0.2);
      context.stroke();
    });
  }
}

export function defineSlidingPuzzle(tagName = TAG_NAME): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) customElements.define(tagName, SlidingPuzzleElement);
}

export function mountSlidingPuzzle(target: Element, options: SlidingPuzzleOptions = {}): SlidingPuzzleElement {
  defineSlidingPuzzle();
  const element = document.createElement(TAG_NAME) as SlidingPuzzleElement;
  element.configure(options);
  target.append(element);
  return element;
}
