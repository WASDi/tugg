import { CONFIG } from '../config';
import { Z } from '../animation/ZIndexManager';

export type ChipState = 'ground' | 'in-bucket' | 'falling';

export class Chip {
  readonly el: HTMLElement;
  state: ChipState = 'falling';

  dragX: number = 0;
  dragY: number = 0;

  constructor() {
    this.el = this.buildChip();
  }

  // ── positioning ────────────────────────────────────────────────────────────

  applyDragTransform(): void {
    this.el.style.transform =
      `translate(calc(-50% + ${this.dragX}px), calc(-50% + ${this.dragY}px))`;
  }

  commitDragPosition(): void {
    const rect   = this.el.getBoundingClientRect();
    const parent = this.el.parentElement;
    if (!parent) return;
    const pRect  = parent.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2 - pRect.left;
    const cy = rect.top  + rect.height / 2 - pRect.top;
    this.el.style.left = `${(cx / pRect.width)  * 100}%`;
    this.el.style.top  = `${(cy / pRect.height) * 100}%`;
    this.dragX = 0;
    this.dragY = 0;
    this.el.style.transform = 'translate(-50%, -50%)';
  }

  /** Spawn below the machine and fall to ground position. */
  spawnAtGround(leftPct: number, topPct: number): void {
    this.state = 'ground';
    // Start slightly above final position, fall in
    this.el.style.left      = `${leftPct}%`;
    this.el.style.top       = `${topPct - 3}%`;
    this.el.style.transform = 'translate(-50%, -50%)';
    this.el.style.zIndex    = String(Z.chipGround);
    this.el.style.opacity   = '0';

    requestAnimationFrame(() => {
      this.el.style.transition = 'top 0.35s ease-in, opacity 0.2s ease';
      this.el.style.top        = `${topPct}%`;
      this.el.style.opacity    = '1';
      setTimeout(() => { this.el.style.transition = ''; }, 380);
    });
  }

  /** Move chip into a bucket element at the given local-% coordinates. */
  placeInBucket(bucketEl: HTMLElement, xPct: number, yPct: number): void {
    this.state = 'in-bucket';

    if (this.el.parentElement !== bucketEl) {
      bucketEl.appendChild(this.el);
    }

    this.dragX = 0;
    this.dragY = 0;

    Object.assign(this.el.style, {
      position:  'absolute',
      left:      `${xPct}%`,
      top:       `${yPct}%`,
      transform: 'translate(-50%, -50%)',
      zIndex:    String(Z.chipInBucket),
      cursor:    'grab',
      touchAction: 'none',
      opacity:   '1',
    });
  }

  // ── private ────────────────────────────────────────────────────────────────

  private buildChip(): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('chip');
    const s = CONFIG.sizeFactor;
    Object.assign(div.style, {
      position:        'absolute',
      width:           `${8 * s}vh`,
      height:          `${5 * s}vh`,
      backgroundImage: 'url(./assets/images/chips.png)',
      backgroundSize:  '100% 100%',
      zIndex:          String(Z.chipGround),
      cursor:          'grab',
      touchAction:     'none',
      transformOrigin: 'center center',
      willChange:      'transform',
    });
    return div;
  }
}
