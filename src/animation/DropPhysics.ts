import { CONFIG } from '../config';

export class DropPhysics {
  /**
   * Animate an element falling to a random ground y-position.
   * Elements are centre-referenced (left/top = centre, transform = translate(-50%,-50%)).
   * We only change `top`; left stays where the player released it (clamped to safe zone).
   */
  dropToGround(el: HTMLElement, currentLeftPct: number): void {
    const { yMin, yMax } = this.groundBounds();
    const targetYPct = yMin + Math.random() * (yMax - yMin);

    // Clamp left to avoid elements disappearing off edges
    const safeLeftPct = Math.max(5, Math.min(currentLeftPct, 93));
    el.style.left = `${safeLeftPct}%`;

    // Force a reflow so the transition fires even if top hasn't changed yet
    el.getBoundingClientRect();

    el.style.transition = 'top 0.45s cubic-bezier(0.4, 0, 1, 1)';
    el.style.top = `${targetYPct}%`;

    el.addEventListener('transitionend', () => {
      el.style.transition = '';
    }, { once: true });
  }

  private groundBounds(): { yMin: number; yMax: number } {
    return {
      yMin: CONFIG.groundThresholdPct + 2,
      yMax: 93,
    };
  }
}
