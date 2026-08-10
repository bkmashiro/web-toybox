import { PegVoice } from './audio';
import { createPegState, legalMoves, playMove, remainingPegs, type PegState, type Position } from './model';

const TAG_NAME = 'peg-solitaire';
const BaseHTMLElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

export interface PegSolitaireOptions { sound?: boolean; volume?: number }

export class PegSolitaireElement extends BaseHTMLElement {
  private readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d')!;
  private readonly hint = document.createElement('p');
  private readonly voice = new PegVoice();
  private resizeObserver?: ResizeObserver;
  private stateValue = createPegState();
  private selected?: Position;
  private soundEnabled = true;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host{display:block;position:relative;min-height:480px;overflow:hidden;background:#ddbf7f;color:#42291b;font:700 13px/1.4 ui-monospace,monospace}
      canvas{display:block;width:100%;height:100%;min-height:480px;touch-action:manipulation;outline:none;cursor:pointer}
      .hint{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);margin:0;padding:6px 10px;white-space:nowrap;border:1px solid rgba(65,38,24,.4);background:rgba(246,229,189,.9);pointer-events:none}
    `;
    this.hint.className = 'hint';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', '跳过棋子并尽量只留一颗的孔明棋');
    root.append(style, this.canvas, this.hint);
  }

  get state(): Readonly<PegState> { return this.stateValue; }
  get playbackState(): 'uninitialized' | 'suspended' | 'running' | 'unsupported' { return this.voice.playbackState; }

  connectedCallback(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this);
    this.canvas.addEventListener('click', this.onClick);
    this.resize();
  }

  disconnectedCallback(): void { this.destroy(); }

  configure(options: PegSolitaireOptions): void {
    if (typeof options.sound === 'boolean') this.soundEnabled = options.sound;
    if (Number.isFinite(options.volume)) this.setVolume(options.volume!);
  }

  async unlockSound(): Promise<boolean> { return this.soundEnabled ? this.voice.unlock() : false; }
  setVolume(value: number): void { this.voice.setVolume(value); }

  reset = (): void => {
    this.stateValue = createPegState();
    this.selected = undefined;
    this.updateHint();
    this.draw();
  };

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('click', this.onClick);
    this.voice.destroy();
  }

  private geometry(): { left: number; top: number; spacing: number; radius: number } {
    const width = this.clientWidth || 640;
    const height = this.clientHeight || 520;
    const board = Math.min(width - 54, height - 86, 430);
    const spacing = board / 7;
    return { left: (width - board) / 2 + spacing / 2, top: Math.max(24, (height - board) / 2 - 8) + spacing / 2, spacing, radius: spacing * 0.29 };
  }

  private onClick = (event: MouseEvent): void => {
    if (event.isTrusted) void this.unlockSound();
    const rect = this.canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const { left, top, spacing } = this.geometry();
    const column = Math.round((point.x - left) / spacing);
    const row = Math.round((point.y - top) / spacing);
    if (row < 0 || row > 6 || column < 0 || column > 6 || this.stateValue.board[row][column] < 0) return;
    const cell = this.stateValue.board[row][column];
    if (cell === 1) {
      this.selected = [row, column];
      this.voice.click(345);
    } else if (this.selected && playMove(this.stateValue, this.selected, [row, column])) {
      this.selected = undefined;
      this.voice.click(this.stateValue.finished ? 185 : 285);
    } else {
      this.selected = undefined;
    }
    this.updateHint();
    this.draw();
  };

  private updateHint(): void {
    const pegs = remainingPegs(this.stateValue);
    this.hint.textContent = this.stateValue.finished
      ? `结束：还剩 ${pegs} 颗`
      : `还剩 ${pegs} 颗 · 选一颗，再点跨越后的空穴`;
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
    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#f1ddb1');
    background.addColorStop(1, '#c99e55');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(81,49,27,.1)';
    for (let x = 17; x < width; x += 29) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x + 2, height); context.stroke();
    }

    const { left, top, spacing, radius } = this.geometry();
    const boardSize = spacing * 7;
    context.fillStyle = '#95582e';
    context.strokeStyle = '#4b2d1d';
    context.lineWidth = 3;
    context.shadowColor = 'rgba(55,30,18,.32)';
    context.shadowBlur = 14;
    context.shadowOffsetY = 7;
    context.beginPath();
    context.roundRect(left - spacing * 0.72, top - spacing * 0.72, boardSize + spacing * 0.44, boardSize + spacing * 0.44, 28);
    context.fill();
    context.shadowColor = 'transparent';
    context.stroke();

    const destinations = this.selected
      ? legalMoves(this.stateValue).filter((move) => move.from[0] === this.selected![0] && move.from[1] === this.selected![1])
      : [];

    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const cell = this.stateValue.board[row][column];
        if (cell < 0) continue;
        const x = left + column * spacing;
        const y = top + row * spacing;
        const isDestination = destinations.some((move) => move.to[0] === row && move.to[1] === column);
        context.fillStyle = isDestination ? '#e6c35f' : '#57331f';
        context.beginPath();
        context.arc(x, y, radius * 0.57, 0, Math.PI * 2);
        context.fill();
        if (cell === 0) continue;
        const selected = this.selected?.[0] === row && this.selected?.[1] === column;
        const peg = context.createRadialGradient(x - radius * 0.34, y - radius * 0.38, 2, x, y, radius);
        peg.addColorStop(0, selected ? '#fff0a7' : '#e66d4a');
        peg.addColorStop(0.55, selected ? '#d3a33a' : '#b63e30');
        peg.addColorStop(1, '#65251f');
        context.fillStyle = peg;
        context.strokeStyle = selected ? '#fff1a6' : '#4b231c';
        context.lineWidth = selected ? 4 : 2;
        context.shadowColor = 'rgba(41,20,13,.35)';
        context.shadowBlur = 5;
        context.shadowOffsetY = 3;
        context.beginPath();
        context.arc(x, y - radius * 0.08, radius, 0, Math.PI * 2);
        context.fill();
        context.shadowColor = 'transparent';
        context.stroke();
      }
    }
  }
}

export function definePegSolitaire(tagName = TAG_NAME): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) customElements.define(tagName, PegSolitaireElement);
}

export function mountPegSolitaire(target: Element, options: PegSolitaireOptions = {}): PegSolitaireElement {
  definePegSolitaire();
  const element = document.createElement(TAG_NAME) as PegSolitaireElement;
  element.configure(options);
  target.append(element);
  return element;
}
