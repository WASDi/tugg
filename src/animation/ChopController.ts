import { CONFIG } from '../config';
import type { Branch } from '../entities/Branch';
import type { Machine } from '../entities/Machine';

type ChopCompleteCallback = (branch: Branch) => void;

interface ChopEntry {
  branch:       Branch;
  startTime:    number | null;
  baseProgress: number;   // progress snapshot when timing was last reset
  stuckRolled:  boolean;  // whether we've already rolled stuck for this entry
}

export class ChopController {
  private entries: Map<Branch, ChopEntry> = new Map();
  private onComplete: ChopCompleteCallback;
  private machine: Machine;
  private rafId: number | null = null;

  constructor(machine: Machine, onComplete: ChopCompleteCallback) {
    this.machine    = machine;
    this.onComplete = onComplete;
  }

  /**
   * Register a new branch entering the machine from scratch.
   * Always resets progress to 0.
   */
  addBranch(branch: Branch): void {
    branch.chopProgress = 0;
    branch.setStuck(false);

    this.entries.set(branch, {
      branch,
      startTime:    null,
      baseProgress: 0,
      stuckRolled:  false,
    });

    if (this.machine.isRunning && !this.rafId) this.startLoop();
  }

  /**
   * Remove a branch (player picked it back up).
   */
  removeBranch(branch: Branch): void {
    this.entries.delete(branch);
    // Loop will exit naturally on next tick if empty
  }

  /**
   * Snapshot all progress so resumeAll can continue from the same point.
   * Called when machine stops.
   */
  pauseAll(): void {
    this.entries.forEach(entry => {
      entry.baseProgress = entry.branch.chopProgress;
      entry.startTime    = null;
    });
    // Don't cancel rAF here — it will self-stop because machine.isRunning = false
  }

  /**
   * Resume chopping from where each branch left off.
   * Called when machine starts.
   */
  resumeAll(): void {
    this.entries.forEach(entry => {
      entry.startTime = null; // will be set on next tick
    });
    if (this.entries.size > 0 && !this.rafId) this.startLoop();
  }

  private startLoop(): void {
    const tick = (now: number) => {
      if (!this.machine.isRunning) {
        this.rafId = null;
        return;
      }

      // Collect completions separately to avoid modifying map while iterating
      const completed: Branch[] = [];

      this.entries.forEach((entry) => {
        if (entry.branch.stuck) return;

        if (entry.startTime === null) {
          entry.startTime = now;
        }

        const elapsed      = now - entry.startTime;
        const duration     = CONFIG.chopDuration[entry.branch.size];
        const progress     = Math.min(entry.baseProgress + elapsed / duration, 1);

        entry.branch.chopProgress = progress;
        this.applyChopVisual(entry.branch, progress);

        // Roll for stuck exactly once, when we first enter the window
        if (
          !entry.stuckRolled &&
          progress >= CONFIG.stuckMinProgress &&
          progress <= CONFIG.stuckMaxProgress
        ) {
          entry.stuckRolled = true;
          if (Math.random() < CONFIG.stuckChance) {
            entry.branch.setStuck(true);
          }
        }

        if (progress >= 1) {
          completed.push(entry.branch);
        }
      });

      for (const branch of completed) {
        this.entries.delete(branch);
        this.onComplete(branch);
      }

      if (this.entries.size > 0) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  /**
   * Move branch downward; update clip-path via CSS custom property.
   *
   * Coordinate space: branch is a child of the machine div.
   * The feed hole sits at FEED_HOLE_PCT% from the top of the machine.
   * At progress=0 the branch bottom is at the feed hole.
   * At progress=1 the branch top is at the feed hole (fully consumed).
   */
  private applyChopVisual(branch: Branch, progress: number): void {
    const machineEl = branch.el.parentElement;
    if (!machineEl) return;

    const machineH = machineEl.offsetHeight;
    const branchH  = branch.el.offsetHeight;
    if (machineH === 0 || branchH === 0) return;

    const feedHolePx = CONFIG.feedHolePct / 100 * machineH;

    // top of branch in machine-local px:
    // progress=0 → bottom of branch at feed hole → top = feedHole - branchH
    // progress=1 → top of branch at feed hole    → top = feedHole
    const topPx = feedHolePx - branchH + branchH * progress;
    branch.el.style.top = `${topPx}px`;

    // Visible portion = everything above the feed hole
    const visiblePx  = Math.max(feedHolePx - topPx, 0);
    const visiblePct = (visiblePx / branchH) * 100;
    branch.el.style.setProperty('--visible-pct', `${visiblePct}%`);
  }
}
