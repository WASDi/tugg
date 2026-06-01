# AGENTS.md — Branch Shredder

Browser game: drag branches into a shredder, collect wood chips in buckets.
TypeScript + Vite + interact.js. No canvas — pure DOM/CSS.

## Commands

```
npm run dev      # dev server with HMR at localhost:5173
npm run build    # type-check + minified dist/
```

Always run `npx tsc --noEmit` before finishing. Zero errors required.

## File map

```
src/
  main.ts              Entry: new Game() on DOMContentLoaded
  config.ts            ALL magic numbers — edit here, nowhere else
  coords.ts            pctToPx / pxToPct / pointInRect / vw() utilities
  GameState.ts         Plain mutable object: { machineRunning, arrowVisible, branches[], buckets[], chips[] }

  Game.ts              Orchestrator. Owns all instances. All cross-entity logic lives here.
                       No entity talks to another entity directly.

  entities/
    Branch.ts          Owns <div>. Fields: size, imageIndex, rotation, chopProgress, stuck, state,
                       dragX/dragY. Methods: setPosition, applyBaseTransform, applyMachineTransform,
                       applyDragTransform, commitDragPosition, transitionToMachineRotation, setStuck
    Machine.ts         leg <img> (direct child of #game, z=1) + wrapper <div> (z=3, holds body).
                       start()/stop() toggle .machine--running on both so the leg vibrates in
                       sync with the body. Exports MACHINE_X_PCT, MACHINE_W_PCT, MACHINE_ASPECT
                       (no external consumers — machine input bbox uses CONFIG.machineInputBbox).
    Bucket.ts          back + front <img> (direct children of #game, z=2/z=5) + wrapper <div>
                       (z=4, holds chips). The layers are siblings of the wrapper so their
                       z-indices work in gamespace; setPosition* repositions them to overlay
                       the wrapper. addChip() interpolates y-pos. setPosition(pct) /
                       setPositionPx(px) for ground vs live-drag.
    Chip.ts            Wood chip. spawnAtGround() animates fall-in. placeInBucket() reparents into bucket.
    HUD.ts             Fixed top-right panel. applySize() called on resize (vw-based, 2:1 aspect ratio).
                       onClick(cb) fires 'start'|'stop' based on which vertical half is clicked.

  managers/
    AudioManager.ts    Single HTMLAudioElement. play(name) stops current, plays new.
                       onended → loop machine_run, unless last sound was 'machine_stop'.
    DOMManager.ts      Thin createElement/appendToRoot helpers.
    InputManager.ts    interact.js drag setup. Fires DragCallbacks into Game. Never contains game logic.
                       enableBranch/enableBucket/enableChip. Callbacks: onBranchDragStart/End,
                       onBucketDragEnd, onChipDragStart/End.

  animation/
    ChopController.ts  rAF loop. addBranch() resets progress to 0. pauseAll()/resumeAll() snapshot
                       progress for machine stop/start. Per-entry stuckRolled + chopStarted flags
                       (not shared Sets). applyChopVisual() sets branch top px + --visible-pct
                       CSS var each tick. Callbacks: onChopStart (first tick per branch),
                       onBranchStuck (when stuck is set), onComplete (progress 1). chopStarted
                       survives pauseAll so the start sound does not replay on stop/start.
    DropPhysics.ts     Animates element top% to random ground position via CSS transition.
    ZIndexManager.ts   Static Z constants: machineLeg=1, bucketBack=2, machineBody=3,
                       chipInBucket=4, bucketFront=5, branchGround=6, chipGround=7, hud=10, arrow=11.

  styles/
    base.css           Reset, #game viewport, background image.
    entities.css       .branch, .bucket, .chip, .hud, .hud-arrow classes.
    machine.css        .machine__layer, .machine--running, .branch--in-machine (clip-path mask),
                       .machine--running .branch--stuck (vibration scoped to running), .debug-bbox
                       / .debug-catchpoint overlays and their --branch/--chip/--bucket variants.
    animations.css     @keyframes: machine-vibrate, branch-stuck-vibrate, arrow-bounce.

public/assets/
  images/   background, machine_body, machine_leg, branch1-3, bucket_back, bucket_front, chips, hud  (PNG)
  sounds/   machine_start, machine_stop, machine_run, chop_small, chop_medium, chop_large  (OGG)
```

## Coordinate system

Game space: (0,0) top-left → (100,100) bottom-right, in percent.
All entity positions stored as centre-point %. CSS `left`/`top` are set as `%`.
All elements use `transform: translate(-50%, -50%)` so left/top reference their centre.
Exception: branches inside the machine use `translateX(-50%)` only (top is controlled by ChopController in px).
`coords.ts` converts between game-% and page-px.

## Drag model (interact.js)

During drag: accumulate `dragX`/`dragY` px deltas on the entity, call `applyDragTransform()`.
On drag end: `commitDragPosition()` converts current screen rect → left/top % on the parent, resets drag accumulators.
Buckets use direct `setPositionPx()` during move (no transform accumulation) so their bounding rect stays accurate for hit-testing.
The branch drop test (machine input bbox) uses the pointer's release location from the interact.js dragend event, not the branch centre.

## Chop flow

1. Branch dropped on machine input bbox → `Game.attachBranchToMachine()` → reparented into `.machine` div, `branch.el.classList.add('branch--in-machine')`, `ChopController.addBranch()` (always, even when machine is stopped — the entry sits idle until resumeAll fires).
2. ChopController rAF tick: advance `chopProgress` 0→1, set `branch.el.style.top` px, set `--visible-pct` CSS var.
3. `clip-path: inset(0 0 calc(100% - var(--visible-pct)) 0)` hides the consumed portion.
4. At progress 1: `onBranchChopped()` → remove element, `Game.spawnChip()`. The chop sound plays on chop start (ChopController's first tick per branch, via `onChopStart`); when a branch gets stuck, the chop sound is replaced by the looping `machine_run` (via `onBranchStuck`).
5. Branch picked back up: `onBranchDragStart()` → `chop.removeBranch()`, reparent to game root, reset progress.

## Key invariants

- All game logic in `Game.ts`. Entities are dumb data+DOM holders.
- `config.ts` is the only file with literal numbers.
- `ChopController.addBranch()` always resets progress to 0. Do not call it to resume — use `resumeAll()`.
- Chips in buckets are DOM children of `.bucket`. On drag start, `onChipDragStart` reparents to `#game` first.
- HUD uses `position: fixed` (not absolute) so it ignores game div scroll.
- Sounds: only one `<Audio>` element. `machine_run` loops automatically after any non-stop sound ends.

## Debug mode

Open with `?debug=true` to overlay debug visuals (added in `Game.showDebugOverlays()` / `startEntityBboxLoop()`):

- **Cyan dashed bbox** — the machine input drop zone (`CONFIG.machineInputBbox`).
- **Magenta dot** — the chip-catch test point (60px below the machine's bottom-centre; child of the machine so it vibrates with it).
- **Yellow bbox per branch**, **green bbox per chip**, **orange bbox per bucket** — every matching element is mirrored each frame from `getBoundingClientRect()` onto a `pointer-events: none` overlay. Boxes for removed elements are pruned.
