import { CONFIG, BRANCH_SIZES, type BranchSize } from './config';
import { createInitialState, type GameState } from './GameState';
import { DOMManager } from './managers/DOMManager';
import { AudioManager } from './managers/AudioManager';
import { InputManager } from './managers/InputManager';
import { HUD } from './entities/HUD';
import { Machine } from './entities/Machine';
import { Branch } from './entities/Branch';
import { Bucket } from './entities/Bucket';
import { Chip } from './entities/Chip';
import { ChopController } from './animation/ChopController';
import { DropPhysics } from './animation/DropPhysics';
import { pxToPct, pointInRect, type Point } from './coords';

export class Game {
  private readonly state:   GameState;
  private readonly dom:     DOMManager;
  private readonly audio:   AudioManager;
  private readonly input:   InputManager;
  private readonly hud:     HUD;
  private readonly machine: Machine;
  private readonly chop:    ChopController;
  private readonly drop:    DropPhysics;

  constructor() {
    this.state = createInitialState();
    this.dom   = new DOMManager('game');
    this.audio = new AudioManager();
    this.drop  = new DropPhysics();

    this.machine = new Machine(this.dom.gameRoot);

    this.chop = new ChopController(
      this.machine,
      (branch) => this.onBranchChopped(branch),
      (branch) => this.onChopStart(branch),
      (branch) => this.onBranchStuck(branch),
    );

    this.input = new InputManager({
      onBranchDragStart: (b)       => this.onBranchDragStart(b),
      onBranchDragEnd:   (b, x, y) => this.onBranchDragEnd(b, x, y),
      onBucketDragEnd:   (bk, x, y)=> this.onBucketDragEnd(bk, x, y),
      onChipDragStart:   (c)       => this.onChipDragStart(c),
      onChipDragEnd:     (c, x, y) => this.onChipDragEnd(c, x, y),
    });

    this.hud = new HUD(this.dom.gameRoot);
    this.hud.onClick((zone) => {
      if (zone === 'start') this.startMachine();
      else                  this.stopMachine();
    });

    this.spawnBranches();
    this.spawnBuckets();
    this.listenForResize();
    this.showDebugOverlays();
  }

  // ── machine control ────────────────────────────────────────────────────────

  startMachine(): void {
    if (this.state.machineRunning) return;
    this.state.machineRunning = true;
    this.machine.start();
    this.audio.play('machine_start');

    if (this.state.arrowVisible) {
      this.state.arrowVisible = false;
      this.hud.hideArrow();
    }

    this.chop.resumeAll();
  }

  stopMachine(): void {
    if (!this.state.machineRunning) return;
    this.state.machineRunning = false;
    this.machine.stop();
    this.audio.play('machine_stop');
    this.chop.pauseAll();
  }

  // ── spawn ──────────────────────────────────────────────────────────────────

  private spawnBranches(): void {
    const { xMin, xMax, yMin, yMax } = CONFIG.pileAreaPct;

    for (let i = 0; i < CONFIG.branchCount; i++) {
      const imageIndex = (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3;
      const size       = BRANCH_SIZES[Math.floor(Math.random() * 3)] as BranchSize;
      const rotation   = (Math.random() * 2 - 1) * 60;
      const branch     = new Branch(imageIndex, size, rotation);

      const leftPct = xMin + Math.random() * (xMax - xMin);
      const topPct  = yMin + Math.random() * (yMax - yMin);
      branch.setPosition(leftPct, topPct);

      this.dom.appendToRoot(branch.el);
      this.input.enableBranch(branch);
      this.state.branches.push(branch);
    }
  }

  private spawnBuckets(): void {
    const positions = [
      { l: 74, t: 78 },
      { l: 86, t: 80 },
    ];
    for (const pos of positions) {
      const bucket = new Bucket(this.dom.gameRoot, pos.l, pos.t);
      this.input.enableBucket(bucket);
      this.state.buckets.push(bucket);
    }
  }

  // ── drag handlers ──────────────────────────────────────────────────────────

  private onBranchDragStart(branch: Branch): void {
    if (branch.state === 'in-machine') {
      // Pull branch out of machine: stop chopping, reparent to game root
      this.chop.removeBranch(branch);
      branch.setStuck(false);
      branch.chopProgress = 0;

      // Move element back to game root preserving screen position
      const rect  = branch.el.getBoundingClientRect();
      const gRect = this.dom.gameRoot.getBoundingClientRect();
      branch.el.classList.remove('branch--in-machine');
      branch.el.style.removeProperty('clip-path');
      branch.el.style.removeProperty('--visible-pct');
      branch.el.style.removeProperty('top');

      // Reparent before setting position so percentages are against game root
      this.dom.gameRoot.appendChild(branch.el);

      branch.setPosition(
        ((rect.left + rect.width  / 2 - gRect.left) / gRect.width)  * 100,
        ((rect.top  + rect.height / 2 - gRect.top)  / gRect.height) * 100,
      );
      branch.state = 'dragging';
    } else {
      branch.state = 'dragging';
    }
  }

  private onBranchDragEnd(branch: Branch, pxX: number, pxY: number): void {
    if (this.isInMachineInput(pxX, pxY)) {
      this.attachBranchToMachine(branch);
    } else {
      // Commit screen position to left/top, clear drag offset
      branch.commitDragPosition();
      const pct = pxToPct({ x: pxX, y: pxY });
      if (pct.y < CONFIG.groundThresholdPct) {
        this.drop.dropToGround(branch.el, pct.x);
      }
      branch.state = 'ground';
    }
  }

  private onBucketDragEnd(bucket: Bucket, pxX: number, pxY: number): void {
    const pct = pxToPct({ x: pxX, y: pxY });
    bucket.setPosition(pct.x, pct.y);
  }

  private onChipDragStart(chip: Chip): void {
    if (chip.state === 'in-bucket') {
      // Reparent to game root, preserving screen position
      const rect  = chip.el.getBoundingClientRect();
      const gRect = this.dom.gameRoot.getBoundingClientRect();
      this.dom.gameRoot.appendChild(chip.el);
      const leftPct = ((rect.left + rect.width  / 2 - gRect.left) / gRect.width)  * 100;
      const topPct  = ((rect.top  + rect.height / 2 - gRect.top)  / gRect.height) * 100;
      chip.el.style.left      = `${leftPct}%`;
      chip.el.style.top       = `${topPct}%`;
      chip.el.style.transform = 'translate(-50%, -50%)';
      chip.el.style.zIndex    = String(7); // chipGround
      chip.el.style.width     = '8vw';
      chip.dragX = 0;
      chip.dragY = 0;
      chip.state = 'ground';
    }
  }

  private onChipDragEnd(chip: Chip, pxX: number, pxY: number): void {
    const targetBucket = this.bucketAtPoint({ x: pxX, y: pxY });
    if (targetBucket && !targetBucket.isFull) {
      // Reparent into bucket; placeInBucket handles position
      targetBucket.addChip(chip);
    } else {
      chip.commitDragPosition();
      const pct = pxToPct({ x: pxX, y: pxY });
      if (pct.y < CONFIG.groundThresholdPct) {
        this.drop.dropToGround(chip.el, pct.x);
      }
      chip.state = 'ground';
    }
  }

  // ── machine feeding ────────────────────────────────────────────────────────

  private attachBranchToMachine(branch: Branch): void {
    // Clean up any existing in-machine state
    branch.el.classList.remove('branch--in-machine');
    branch.el.style.removeProperty('clip-path');
    branch.el.style.removeProperty('--visible-pct');
    branch.el.parentElement?.removeChild(branch.el);

    this.machine.el.appendChild(branch.el);

    branch.state = 'in-machine';
    branch.chopProgress = 0;
    branch.setStuck(false);
    branch.dragX = 0;
    branch.dragY = 0;

    branch.el.style.left      = '50%';
    branch.el.style.transform = `rotate(0deg)`; // will be replaced by transitionToMachineRotation

    this.chop.applyChopVisual(branch, 0);

    branch.transitionToMachineRotation();
    branch.el.classList.add('branch--in-machine');

    this.chop.addBranch(branch);
  }

  private onBranchChopped(branch: Branch): void {
    branch.state = 'chopped';

    // Remove from state list
    const idx = this.state.branches.indexOf(branch);
    if (idx !== -1) this.state.branches.splice(idx, 1);

    branch.el.parentElement?.removeChild(branch.el);

    this.spawnChip();
  }

  private onChopStart(branch: Branch): void {
    this.audio.play(`chop_${branch.size}` as Parameters<AudioManager['play']>[0]);
  }

  private onBranchStuck(_branch: Branch): void {
    this.audio.play('machine_run');
  }

  private spawnChip(): void {
    const chip = new Chip();
    this.state.chips.push(chip);
    this.dom.appendToRoot(chip.el);
    this.input.enableChip(chip);

    const machineRect = this.machine.el.getBoundingClientRect();
    const spawnPxX    = machineRect.left + machineRect.width  / 2;
    const spawnPxY    = machineRect.bottom;

    // Check if a bucket is directly below the machine output
    const belowBucket = this.bucketAtPoint({ x: spawnPxX, y: spawnPxY + 60 });

    if (belowBucket && !belowBucket.isFull) {
      belowBucket.addChip(chip);
    } else {
      const pct = pxToPct({ x: spawnPxX, y: spawnPxY });
      chip.spawnAtGround(pct.x, Math.min(pct.y + 5, 92));
    }
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private isInMachineInput(pxX: number, pxY: number): boolean {
    const b = CONFIG.machineInputBbox;
    return pointInRect({ x: pxX, y: pxY }, {
      x: (b.xPct / 100) * window.innerWidth,
      y: (b.yPct / 100) * window.innerHeight,
      w: (b.wPct / 100) * window.innerWidth,
      h: (b.hPct / 100) * window.innerHeight,
    });
  }

  private bucketAtPoint(pt: Point): Bucket | null {
    for (const bucket of this.state.buckets) {
      const r = bucket.getBoundingRect();
      if (pointInRect(pt, { x: r.left, y: r.top, w: r.width, h: r.height })) {
        return bucket;
      }
    }
    return null;
  }

  private listenForResize(): void {
    window.addEventListener('resize', () => {
      this.hud.applySize();
    });
  }

  private showDebugOverlays(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug')?.toLowerCase() !== 'true') return;

    const b = CONFIG.machineInputBbox;
    const box = document.createElement('div');
    box.className = 'debug-bbox';
    box.style.left   = `${b.xPct}%`;
    box.style.top    = `${b.yPct}%`;
    box.style.width  = `${b.wPct}%`;
    box.style.height = `${b.hPct}%`;

    const label = document.createElement('span');
    label.className = 'debug-bbox__label';
    label.textContent = 'machine input bbox';
    box.appendChild(label);

    this.dom.gameRoot.appendChild(box);

    const catchPoint = document.createElement('div');
    catchPoint.className = 'debug-catchpoint';
    this.machine.el.appendChild(catchPoint);

    const catchLabel = document.createElement('span');
    catchLabel.className = 'debug-catchpoint__label';
    catchLabel.textContent = 'chip catch test point';
    catchPoint.appendChild(catchLabel);

    this.startEntityBboxLoop();
  }

  private startEntityBboxLoop(): void {
    const gameRoot = this.dom.gameRoot;
    const overlays = new Map<HTMLElement, HTMLDivElement>();
    const types: Array<{ selector: string; type: 'branch' | 'chip' | 'bucket' }> = [
      { selector: '.branch', type: 'branch' },
      { selector: '.chip',   type: 'chip' },
      { selector: '.bucket', type: 'bucket' },
    ];

    const tick = () => {
      const seen = new Set<HTMLElement>();
      const gRect = gameRoot.getBoundingClientRect();

      for (const { selector, type } of types) {
        gameRoot.querySelectorAll(selector).forEach((el) => {
          const hel = el as HTMLElement;
          seen.add(hel);

          let overlay = overlays.get(hel);
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = `debug-bbox debug-bbox--${type}`;
            const label = document.createElement('span');
            label.className = 'debug-bbox__label';
            label.textContent = type;
            overlay.appendChild(label);
            gameRoot.appendChild(overlay);
            overlays.set(hel, overlay);
          }

          const r = hel.getBoundingClientRect();
          overlay.style.left   = `${r.left - gRect.left}px`;
          overlay.style.top    = `${r.top  - gRect.top}px`;
          overlay.style.width  = `${r.width}px`;
          overlay.style.height = `${r.height}px`;
        });
      }

      for (const [hel, overlay] of overlays) {
        if (!seen.has(hel)) {
          overlay.remove();
          overlays.delete(hel);
        }
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
}
