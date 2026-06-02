import { CONFIG } from '../config';
import { Z } from '../animation/ZIndexManager';
import { vh } from '../coords';

export type HUDClickZone = 'start' | 'stop';

export class HUD {
  readonly el: HTMLElement;
  private readonly prompt: HTMLElement;
  private onClickCallback: ((zone: HUDClickZone) => void) | null = null;

  constructor(gameRoot: HTMLElement) {
    this.el = this.buildHUD();
    this.prompt = this.buildPrompt();
    this.el.appendChild(this.prompt);
    gameRoot.appendChild(this.el);
    this.applySize();
    this.attachPointerEvents();
  }

  // ── sizing ────────────────────────────────────────────────────────────────

  /**
   * Width  = CONFIG.hud.widthVh  vh
   * Height = width / CONFIG.hud.aspectRatio  (= 2× width for a 2:1 tall panel)
   * Pinned top-right with CONFIG.hud.marginVh gap on both axes.
   *
   * Call applySize() again whenever the viewport resizes.
   */
  applySize(): void {
    const { widthVh, aspectRatio, marginVh } = CONFIG.hud;
    const s = CONFIG.sizeFactor;
    const widthPx  = vh(widthVh * s);
    const heightPx = widthPx / aspectRatio;
    const marginPx = vh(marginVh * s);

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

  hidePrompt(): void {
    this.prompt.style.display = 'none';
  }

  // ── private construction ──────────────────────────────────────────────────

  private buildHUD(): HTMLElement {
    const el = document.createElement('div');
    el.classList.add('hud');
    Object.assign(el.style, {
      position:        'fixed',   // fixed so it ignores game scroll
      zIndex:          String(Z.hud),
      backgroundImage: 'url(./assets/images/hud.jpg)',
      backgroundSize:  '100% 100%',
      cursor:          'pointer',
      userSelect:      'none',
    });
    return el;
  }

  private buildPrompt(): HTMLElement {
    const circle = document.createElement('div');
    circle.classList.add('hud-prompt');
    Object.assign(circle.style, {
      position:   'absolute',
      left:       '50%',
      top:        '38%',
      transform:  'translate(-50%, -50%)',
      zIndex:     String(Z.arrow),
      pointerEvents: 'none',
    });
    return circle;
  }

  private flashHalf(upper: boolean): void {
    const flash = document.createElement('div');
    flash.className = 'hud-flash';
    Object.assign(flash.style, {
      position: 'absolute',
      left:     '0',
      width:    '100%',
      height:   '50%',
      top:      upper ? '0' : '50%',
      zIndex:   String(Z.arrow + 1),
      pointerEvents: 'none',
    });
    this.el.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove(), { once: true });
  }

  private attachPointerEvents(): void {
    // Firefox mobile does not reliably allow the first audio playback from
    // pointerdown, but it does from click on the tapped control.
    this.el.addEventListener('click', (e: MouseEvent) => {
      const rect   = this.el.getBoundingClientRect();
      const relY   = e.clientY - rect.top;
      const midY   = rect.height / 2;
      const upper  = relY < midY;
      this.flashHalf(upper);
      this.onClickCallback?.(upper ? 'start' : 'stop');
    });
  }
}
