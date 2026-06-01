import type { Branch } from './entities/Branch';
import type { Bucket } from './entities/Bucket';
import type { Chip } from './entities/Chip';

export interface GameState {
  machineRunning: boolean;
  arrowVisible: boolean;
  branches: Branch[];
  buckets: Bucket[];
  chips: Chip[];
}

export function createInitialState(): GameState {
  return {
    machineRunning: false,
    arrowVisible: true,
    branches: [],
    buckets: [],
    chips: [],
  };
}
