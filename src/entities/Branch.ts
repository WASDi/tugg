import { CONFIG, type BranchSize } from '../config';
import { Z } from '../animation/ZIndexManager';

export type BranchState = 'ground' | 'dragging' | 'in-machine' | 'chopped';

export class Branch {
  readonly el: HTMLElement;
  readonly size: BranchSize;
  readonly imageIndex: 1 | 2 | 3;

  /** Current base rotation in degrees (ground random, or machine ±20°). */
  rotation: number;

  chopProgress: number = 0;
  stuck: boolean = false;
  state: BranchState = 'ground';

  /**
   * Accumulated drag offset in px, relative to element's current left/top.
   * Reset to 0 when we commit the position to left/top after drag ends.
   */
  dragX: number = 0;
  dragY: number = 0;

  constructor(imageIndex: 1 | 2 | 3, size: BranchSize, rotation: number) {
    this.imageIndex = imageIndex;
    this.size       = size;
    this.rotation   = rotation;
    this.el         = this.buildElement();
    this.applyBaseTransform();
  }

  // ── positioning ────────────────────────────────────────────────────────────

  /** Set position as percentage of the parent (game root). */
  setPosition(leftPct: number, topPct: number): void {
    this.el.style.left = `${leftPct}%`;
    this.el.style.top  = `${topPct}%`;
    this.dragX = 0;
    this.dragY = 0;
    this.applyBaseTransform();
  }

  /** Set position in pixels (used when reparenting into machine). */
  setPositionPx(leftPx: number, topPx: number): void {
    this.el.style.left = `${leftPx}px`;
    this.el.style.top  = `${topPx}px`;
    this.dragX = 0;
    this.dragY = 0;
    this.applyBaseTransform();
  }

  // ── transforms ─────────────────────────────────────────────────────────────

  /** Base transform = rotation only. Applied when not dragging. */
  applyBaseTransform(): void {
    this.el.style.transform = `translate(-50%, -50%) rotate(${this.rotation}deg)`;
  }

  /**
   * In-machine transform: only translateX(-50%) to centre horizontally.
   * top is controlled by ChopController directly.
   */
  applyMachineTransform(): void {
    this.el.style.transform = `translateX(-50%) rotate(${this.rotation}deg)`;
  }

  /**
   * During a drag, combine the accumulated pixel offset with the rotation.
   * Using translate-then-rotate keeps the drag delta in screen space.
   */
  applyDragTransform(): void {
    this.el.style.transform =
      `translate(calc(-50% + ${this.dragX}px), calc(-50% + ${this.dragY}px)) rotate(${this.rotation}deg)`;
  }

  /**
   * Commit the current drag position back to left/top percent and clear drag accumulators.
   * Call this after dragend when NOT going into the machine.
   */
  commitDragPosition(): void {
    const rect   = this.el.getBoundingClientRect();
    const parent = this.el.parentElement;
    if (!parent) return;
    const pRect  = parent.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2 - pRect.left;
    const cy = rect.top  + rect.height / 2 - pRect.top;
    const leftPct = (cx / pRect.width)  * 100;
    const topPct  = (cy / pRect.height) * 100;
    this.el.style.left = `${leftPct}%`;
    this.el.style.top  = `${topPct}%`;
    this.dragX = 0;
    this.dragY = 0;
    this.applyBaseTransform();
  }

  transitionToMachineRotation(): void {
    const range    = CONFIG.machineRotationRange;
    this.rotation  = (Math.random() * 2 - 1) * range;
    this.dragX     = 0;
    this.dragY     = 0;
    this.el.style.transition = 'transform 0.3s ease';
    this.applyMachineTransform();
    setTimeout(() => { this.el.style.transition = ''; }, 320);
  }

  // ── stuck state ────────────────────────────────────────────────────────────

  setStuck(stuck: boolean): void {
    this.stuck = stuck;
    this.el.classList.toggle('branch--stuck', stuck);
    if (stuck) {
      this.el.style.setProperty('--branch-rot', `${this.rotation}deg`);
    }
  }

  // ── private ────────────────────────────────────────────────────────────────

  private buildElement(): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('branch', `branch--${this.size}`);

    const { widthVw, heightVw } = CONFIG.branchSizes[this.size];
    Object.assign(div.style, {
      position:        'absolute',
      width:           `${widthVw}vw`,
      height:          `${heightVw}vw`,
      backgroundImage: `url(/assets/images/branch${this.imageIndex}.png)`,
      backgroundSize:  '100% 100%',
      zIndex:          String(Z.branchGround),
      cursor:          'grab',
      touchAction:     'none',
      // Centre-referenced: left/top point to the branch centre
      transformOrigin: 'center center',
      willChange:      'transform',
    });

    return div;
  }
}
