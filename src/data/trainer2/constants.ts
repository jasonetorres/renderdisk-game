import type { BodyId } from './types';

// Body/clothing sheet format (23×4) of 48×48.
export const BODY_FRAME = {
  width: 48,
  height: 48,
  cols: 23,
  rows: 4,
  idle: { col: 0, row: 0 },
} as const;

// Head stack sheet format (5×1) of 32×32.
export const HEAD_FRAME = {
  width: 32,
  height: 32,
  cols: 5,
  rows: 1,
  southCol: 0,
} as const;

export const HEAD_PASTE_OFFSET: Record<BodyId, { x: number; y: number }> = {
  average: { x: 8, y: 9 },
  small: { x: 8, y: 10 },
} as const;

