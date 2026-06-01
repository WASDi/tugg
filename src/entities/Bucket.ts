import { CONFIG } from '../config';
import { Z } from '../animation/ZIndexManager';
import type { Chip } from './Chip';

export class Bucket {
  readonly el: HTMLElement;
  private readonly chips: Chip[] = [];

  constructor(gameRoot: HTMLElement, leftPct: number, topPct: number) {
    this.el = this.buildBucket();
    this.setPosition(leftPct, topPct);
    gameRoot.appendChild(this.el);
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
    this.el.style.left = `${leftPct}%`;
    this.el.style.top  = `${topPct}%`;
  }

  /** Set centre position in pixels (used during live dragging). */
  setPositionPx(leftPx: number, topPx: number): void {
    this.el.style.left = `${leftPx}px`;
    this.el.style.top  = `${topPx}px`;
  }

  private buildBucket(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('bucket');
    Object.assign(wrapper.style, {
      position:        'absolute',
      width:           '10vw',
      height:          '14vw',
      cursor:          'grab',
      touchAction:     'none',
      transformOrigin: 'center center',
      transform:       'translate(-50%, -50%)',
    });

    const back = document.createElement('img');
    back.src   = '/assets/images/bucket_back.png';
    back.draggable = false;
    Object.assign(back.style, {
      position:      'absolute',
      inset:         '0',
      width:         '100%',
      height:        '100%',
      zIndex:        String(Z.bucketBack),
      pointerEvents: 'none',
    });

    const front = document.createElement('img');
    front.src   = '/assets/images/bucket_front.png';
    front.draggable = false;
    Object.assign(front.style, {
      position:      'absolute',
      inset:         '0',
      width:         '100%',
      height:        '100%',
      zIndex:        String(Z.bucketFront),
      pointerEvents: 'none',
    });

    wrapper.appendChild(back);
    wrapper.appendChild(front);
    return wrapper;
  }
}
