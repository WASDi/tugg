import { CONFIG } from '../config';
import { Z } from '../animation/ZIndexManager';
import { vw } from '../coords';

export type HUDClickZone = 'start' | 'stop';

export class HUD {
  readonly el: HTMLElement;
  private readonly arrow: HTMLElement;
  private onClickCallback: ((zone: HUDClickZone) => void) | null = null;

  constructor(gameRoot: HTMLElement) {
    this.el = this.buildHUD();
    this.arrow = this.buildArrow();
    this.el.appendChild(this.arrow);
    gameRoot.appendChild(this.el);
    this.applySize();
    this.attachPointerEvents();
  }

  // ── sizing ────────────────────────────────────────────────────────────────

  /**
   * Width  = CONFIG.hud.widthVw  vw
   * Height = width / CONFIG.hud.aspectRatio  (= 2× width for a 2:1 tall panel)
   * Pinned top-right with CONFIG.hud.marginVw gap on both axes.
   *
   * Call applySize() again whenever the viewport resizes.
   */
  applySize(): void {
    const { widthVw, aspectRatio, marginVw } = CONFIG.hud;
    const widthPx  = vw(widthVw);
    const heightPx = widthPx / aspectRatio;   // aspectRatio = w/h, so h = w/r
    const marginPx = vw(marginVw);

    Object.assign(this.el.style, {
      width:  `${widthPx}px`,
      height: `${heightPx}px`,
      top:    `${marginPx}px`,
      right:  `${marginPx}px`,
    });
  }

  // ── public API ────────────────────────────────────────────────────────────

  onClick(cb: (zone: HUDClickZone) => void): void {
    this.onClickCallback = cb;
  }

  hideArrow(): void {
    this.arrow.style.display = 'none';
  }

  // ── private construction ──────────────────────────────────────────────────

  private buildHUD(): HTMLElement {
    const el = document.createElement('div');
    el.classList.add('hud');
    Object.assign(el.style, {
      position:        'fixed',   // fixed so it ignores game scroll
      zIndex:          String(Z.hud),
      backgroundImage: 'url(/assets/images/hud.png)',
      backgroundSize:  '100% 100%',
      cursor:          'pointer',
      userSelect:      'none',
    });
    return el;
  }

  private buildArrow(): HTMLElement {
    const arrow = document.createElement('div');
    arrow.classList.add('hud-arrow');
    // Positioned in the upper half of the HUD, centred horizontally.
    // CSS animation handles the bouncing; see animations.css.
    Object.assign(arrow.style, {
      position:   'absolute',
      left:       '50%',
      top:        '15%',       // sits in upper-half zone
      transform:  'translateX(-50%)',
      zIndex:     String(Z.arrow),
      pointerEvents: 'none',
    });
    return arrow;
  }

  private attachPointerEvents(): void {
    this.el.addEventListener('pointerdown', (e: PointerEvent) => {
      // Determine which half was clicked relative to the HUD element.
      const rect   = this.el.getBoundingClientRect();
      const relY   = e.clientY - rect.top;
      const midY   = rect.height / 2;
      const zone: HUDClickZone = relY < midY ? 'start' : 'stop';
      this.onClickCallback?.(zone);
    });
  }
}
