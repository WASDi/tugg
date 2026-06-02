export const CONFIG = {
  sizeFactor: 1.4,
  branchCount: 16,
  stuckChance: 0.30,
  stuckMinProgress: 0.20,
  stuckMaxProgress: 0.80,

  branchSizes: {
    small:  { widthVh: 3,  heightVh: 5  },
    medium: { widthVh: 3,  heightVh: 10 },
    large:  { widthVh: 4,  heightVh: 30 },
  },

  chopDuration: {
    small:  750,
    medium: 2000,
    large:  6000,
  },

  groundThresholdPct: 75,
  machineInputBbox: { xPct: 30, yPct: -10, wPct: 100, hPct: 40 },

  bucketCapacity: 8,
  chipInBucket: {
    firstYPct: 50,
    lastYPct:  10,
  },

  /**
   * HUD sizing: width as a fraction of viewport width.
   * Height = width / aspectRatio.
   * The HUD is pinned top-right with a small margin.
   */
  hud: {
    widthVh: 10,
    aspectRatio: 247 / 394, // width/height of hud.jpg
    marginVh: 1,           // gap from right and top edges, in vh
  },

  machineRotationRange: 20,

  pileAreaPct: { xMin: 2, xMax: 28, yMin: 68, yMax: 88 },
} as const;

export type BranchSize = 'small' | 'medium' | 'large';
export const BRANCH_SIZES: BranchSize[] = ['small', 'medium', 'large'];
