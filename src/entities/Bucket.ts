import { CONFIG } from '../config';
import { Z } from '../animation/ZIndexManager';
import type { Chip } from './Chip';

const BUCKET_W_VH = 14;
const BUCKET_H_VH = 15;

export class Bucket {
  readonly el: HTMLElement;
  private readonly chips: Chip[] = [];
  private readonly back:  HTMLImageElement;
  private readonly front: HTMLImageElement;

  constructor(gameRoot: HTMLElement, leftPct: number, topPct: number) {
    this.el    = this.buildWrapper();
    this.back  = this.buildLayer('./assets/images/bucket_back.png',  Z.bucketBack);
    this.front = this.buildLayer('./assets/images/bucket_front.png', Z.bucketFront);

    gameRoot.appendChild(this.back);
    gameRoot.appendChild(this.front);
    gameRoot.appendChild(this.el);

    this.setPosition(leftPct, topPct);
  }

  dragX: number = 0;
  dragY: number = 0;

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
    const xPct = 30 + Math.random() * 40;

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
    this.dragX = 0;
    this.dragY = 0;
    const bt = 'translate(-50%, -50%)';
    this.el.style.transform   = bt;
    this.back.style.transform  = bt;
    this.front.style.transform = bt;
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

  /** Apply drag transform to wrapper + back + front (keeps all layers in sync). */
  applyDragTransform(): void {
    const t = `translate(calc(-50% + ${this.dragX}px), calc(-50% + ${this.dragY}px))`;
    this.el.style.transform   = t;
    this.back.style.transform  = t;
    this.front.style.transform = t;
  }

  /** Commit current visual position to left/top %, then reset transforms and drag accumulators. */
  commitDragPosition(): void {
    const rect   = this.el.getBoundingClientRect();
    const parent = this.el.parentElement;
    if (!parent) return;
    const pRect   = parent.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2 - pRect.left;
    const cy = rect.top  + rect.height / 2 - pRect.top;
    const leftPct = (cx / pRect.width)  * 100;
    const topPct  = (cy / pRect.height) * 100;
    this.setPosition(leftPct, topPct);
  }

  private buildWrapper(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('bucket');
    Object.assign(wrapper.style, {
      position:        'absolute',
      width:           `${BUCKET_W_VH * CONFIG.sizeFactor}vh`,
      height:          `${BUCKET_H_VH * CONFIG.sizeFactor}vh`,
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
      width:           `${BUCKET_W_VH * CONFIG.sizeFactor}vh`,
      height:          `${BUCKET_H_VH * CONFIG.sizeFactor}vh`,
      transform:       'translate(-50%, -50%)',
      transformOrigin: 'center center',
      zIndex:          String(z),
      pointerEvents:   'none',
    });
    return img;
  }
}
