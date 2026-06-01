export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Convert game-space percentage coords (0–100) to CSS pixel values. */
export function pctToPx(pct: Point): Point {
  return {
    x: (pct.x / 100) * window.innerWidth,
    y: (pct.y / 100) * window.innerHeight,
  };
}

/** Convert CSS pixel coords to game-space percentage coords (0–100). */
export function pxToPct(px: Point): Point {
  return {
    x: (px.x / window.innerWidth) * 100,
    y: (px.y / window.innerHeight) * 100,
  };
}

/** Convert a percentage rect to a pixel rect. */
export function pctRectToPx(rect: Rect): Rect {
  return {
    x: (rect.x / 100) * window.innerWidth,
    y: (rect.y / 100) * window.innerHeight,
    w: (rect.w / 100) * window.innerWidth,
    h: (rect.h / 100) * window.innerHeight,
  };
}

/** Check whether a pixel point falls inside a pixel rect. */
export function pointInRect(pt: Point, rect: Rect): boolean {
  return (
    pt.x >= rect.x &&
    pt.x <= rect.x + rect.w &&
    pt.y >= rect.y &&
    pt.y <= rect.y + rect.h
  );
}

/** Compute 1vw in pixels (= viewport width / 100). */
export function vw(n: number): number {
  return (window.innerWidth / 100) * n;
}
