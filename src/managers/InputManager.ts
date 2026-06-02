import interact from 'interactjs';

import type { Branch } from '../entities/Branch';
import type { Bucket } from '../entities/Bucket';
import type { Chip } from '../entities/Chip';

export interface DragCallbacks {
  onBranchDragEnd:   (branch: Branch, x: number, y: number) => void;
  onBranchDragStart: (branch: Branch) => void;
  onBucketDragEnd:   (bucket: Bucket, x: number, y: number) => void;
  onChipDragEnd:     (chip: Chip,     x: number, y: number) => void;
  onChipDragStart:   (chip: Chip) => void;
}

type IE = { dx: number; dy: number; clientX: number; clientY: number };

export class InputManager {
  private callbacks: DragCallbacks;

  constructor(callbacks: DragCallbacks) {
    this.callbacks = callbacks;
  }

  enableBranch(branch: Branch): void {
    interact(branch.el).draggable({
      listeners: {
        start: () => {
          this.callbacks.onBranchDragStart(branch);
        },
        move: (e: IE) => {
          // Accumulate pixel offset, combine with rotation in Branch.applyDragTransform
          branch.dragX = (branch.dragX ?? 0) + e.dx;
          branch.dragY = (branch.dragY ?? 0) + e.dy;
          branch.applyDragTransform();
        },
        end: (e: IE) => {
          this.callbacks.onBranchDragEnd(
            branch,
            e.clientX,
            e.clientY,
          );
        },
      },
    });
  }

  enableBucket(bucket: Bucket): void {
    interact(bucket.el).draggable({
      listeners: {
        move: (e: IE) => {
          bucket.dragX = (bucket.dragX ?? 0) + e.dx;
          bucket.dragY = (bucket.dragY ?? 0) + e.dy;
          bucket.applyDragTransform();
        },
        end: () => {
          this.callbacks.onBucketDragEnd(bucket, 0, 0);
        },
      },
    });
  }

  disableChip(chip: Chip): void {
    interact(chip.el).unset();
  }

  enableChip(chip: Chip): void {
    interact(chip.el).draggable({
      listeners: {
        start: () => {
          this.callbacks.onChipDragStart(chip);
        },
        move: (e: IE) => {
          chip.dragX = (chip.dragX ?? 0) + e.dx;
          chip.dragY = (chip.dragY ?? 0) + e.dy;
          chip.applyDragTransform();
        },
        end: () => {
          const r = chip.el.getBoundingClientRect();
          this.callbacks.onChipDragEnd(
            chip,
            r.left + r.width  / 2,
            r.top  + r.height / 2,
          );
        },
      },
    });
  }
}
