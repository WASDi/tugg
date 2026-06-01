import { CONFIG } from '../config';
import { Z } from '../animation/ZIndexManager';
import type { Chip } from './Chip';

const BUCKET_W_VW = 14;
const BUCKET_H_VW = 15;

export class Bucket {
  readonly el: HTMLElement;
  private readonly chips: Chip[] = [];
  private readonly back:  HTMLImageElement;
  private readonly front: HTMLImageElement;

  constructor(gameRoot: HTMLElement, leftPct: number, topPct: number) {
    this.el    = this.buildWrapper();
    this.back  = this.buildLayer('/assets/images/bucket_back.png',  Z.bucketBack);
    this.front = this.buildLayer('/assets/images/bucket_front.png', Z.bucketFront);

    gameRoot.appendChild(this.back);
    gameRoot.appendChild(this.front);
    gameRoot.appendChild(this.el);

    this.setPosition(leftPct, topPct);
  }

  get isFull(): boolean {
    return this.chips.length >= CONFIG.bucketCapacity;
  }

  get chipCount(): number {
    return this.chips.length;
  }

  getBoundingRect(): DOMRect {
    return this.el.getBoundingClientRect();
  }

  addChip(chip: Chip): void {
    if (this.isFull) return;

    const { firstYPct, lastYPct } = CONFIG.chipInBucket;
    const count    = this.chips.length;
    const capacity = CONFIG.bucketCapacity;

    const t    = capacity > 1 ? count / (capacity - 1) : 0;
    const yPct = firstYPct + (lastYPct - firstYPct) * t;
    const xPct = 20 + Math.random() * 60;

    chip.placeInBucket(this.el, xPct, yPct);
    this.chips.push(chip);
  }

  /** Set centre position as percentage of the game root. */
  setPosition(leftPct: number, topPct: number): void {
    this.el.style.left    = `${leftPct}%`;
    this.el.style.top     = `${topPct}%`;
    this.back.style.left  = this.el.style.left;
    this.back.style.top   = this.el.style.top;
    this.front.style.left = this.el.style.left;
    this.front.style.top  = this.el.style.top;
  }

  /** Set centre position in pixels (used during live dragging). */
  setPositionPx(leftPx: number, topPx: number): void {
    this.el.style.left    = `${leftPx}px`;
    this.el.style.top     = `${topPx}px`;
    this.back.style.left  = this.el.style.left;
    this.back.style.top   = this.el.style.top;
    this.front.style.left = this.el.style.left;
    this.front.style.top  = this.el.style.top;
  }

  private buildWrapper(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('bucket');
    Object.assign(wrapper.style, {
      position:        'absolute',
      width:           `${BUCKET_W_VW}vw`,
      height:          `${BUCKET_H_VW}vw`,
      cursor:          'grab',
      touchAction:     'none',
      transformOrigin: 'center center',
      transform:       'translate(-50%, -50%)',
      zIndex:          String(Z.chipInBucket),
    });
    return wrapper;
  }

  private buildLayer(src: string, z: number): HTMLImageElement {
    const img = document.createElement('img');
    img.src       = src;
    img.draggable = false;
    Object.assign(img.style, {
      position:        'absolute',
      width:           `${BUCKET_W_VW}vw`,
      height:          `${BUCKET_H_VW}vw`,
      transform:       'translate(-50%, -50%)',
      transformOrigin: 'center center',
      zIndex:          String(z),
      pointerEvents:   'none',
    });
    return img;
  }
}
