export const CONFIG = {
  branchCount: 20,
  stuckChance: 0.30,
  stuckMinProgress: 0.20,
  stuckMaxProgress: 0.80,

  branchSizes: {
    small:  { widthVw: 3,  heightVw: 8  },
    medium: { widthVw: 4,  heightVw: 12 },
    large:  { widthVw: 5,  heightVw: 18 },
  },

  chopDuration: {
    small:  4000,
    medium: 7000,
    large:  12000,
  },

  groundThresholdPct: 75,
  machineInputBbox: { xPct: 42, yPct: 18, wPct: 16, hPct: 10 },

  bucketCapacity: 10,
  chipInBucket: {
    firstYPct: 78,
    lastYPct:  18,
  },

  /**
   * HUD sizing: width as a fraction of viewport width.
   * Height is always 2× the computed width (2:1 aspect ratio, tall).
   * The HUD is pinned top-right with a small margin.
   */
  hud: {
    widthVw: 8,       // 8vw wide
    aspectRatio: 0.5, // width/height = 0.5, so height = width / 0.5 = 2×width
    marginVw: 1,      // gap from right and top edges, in vw
  },

  machineRotationRange: 20,

  /**
   * Y position of the branch feeding hole as a percentage of machine height.
   * Branches are visible above this line; hidden below it.
   */
  feedHolePct: 12,

  pileAreaPct: { xMin: 2, xMax: 28, yMin: 68, yMax: 88 },
} as const;

export type BranchSize = 'small' | 'medium' | 'large';
export const BRANCH_SIZES: BranchSize[] = ['small', 'medium', 'large'];
