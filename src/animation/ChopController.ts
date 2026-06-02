import { CONFIG } from '../config';
import type { Branch } from '../entities/Branch';
import type { Machine } from '../entities/Machine';

type ChopCompleteCallback = (branch: Branch) => void;
type ChopStartCallback   = (branch: Branch) => void;
type ChopStuckCallback   = (branch: Branch) => void;

interface ChopEntry {
  branch:       Branch;
  startTime:    number | null;
  baseProgress: number;   // progress snapshot when timing was last reset
  stuckRolled:  boolean;  // whether we've already rolled stuck for this entry
  chopStarted:  boolean;  // whether the start callback has fired for this entry
}

export class ChopController {
  private entries: Map<Branch, ChopEntry> = new Map();
  private onComplete: ChopCompleteCallback;
  private onChopStart: ChopStartCallback;
  private onBranchStuck: ChopStuckCallback;
  private machine: Machine;
  private rafId: number | null = null;

  constructor(
    machine: Machine,
    onComplete: ChopCompleteCallback,
    onChopStart: ChopStartCallback,
    onBranchStuck: ChopStuckCallback,
  ) {
    this.machine    = machine;
    this.onComplete = onComplete;
    this.onChopStart = onChopStart;
    this.onBranchStuck = onBranchStuck;
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
      chopStarted:  false,
    });

    if (this.machine.isRunning && !this.rafId) this.startLoop();
  }

  get activeChopCount(): number {
    let count = 0;
    this.entries.forEach(e => { if (e.chopStarted && !e.branch.stuck) count++; });
    return count;
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
          if (!entry.chopStarted) {
            entry.chopStarted = true;
            this.onChopStart(entry.branch);
          }
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
            this.onBranchStuck(entry.branch);
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

  applyChopVisual(branch: Branch, progress: number): void {
    const machineEl = branch.el.parentElement;
    if (!machineEl) return;

    const machineW = machineEl.offsetWidth;
    const machineH = machineEl.offsetHeight;
    const branchH  = branch.el.offsetHeight;
    if (machineW === 0 || machineH === 0 || branchH === 0) return;

    const rotRad = branch.rotation * Math.PI / 180;
    const sinRot = Math.sin(rotRad);
    const cosRot = Math.cos(rotRad);

    // Centre of the machine input bounding box (machine-local px)
    const b = CONFIG.machineInputBbox;
    const cx = machineW * (b.xPct + b.wPct / 2) / 100;
    const cy = machineH * (b.yPct + b.hPct / 2) / 100;

    // With transform-origin: bottom center and transform: translateX(-50%) rotate(R),
    // the element's bottom-centre is at (left, top + branchH).
    // At progress=0 the bottom-centre sits at (cx, cy), then travels down
    // along the rotated axis by d = branchH * progress.
    const d  = branchH * progress;
    const bx = cx - d * sinRot;
    const by = cy + d * cosRot;

    branch.el.style.left = `${bx}px`;
    branch.el.style.top  = `${by - branchH}px`;

    const visiblePct = (1 - progress) * 100;
    branch.el.style.setProperty('--visible-pct', `${visiblePct}%`);
  }
}
