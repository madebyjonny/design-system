/**
 * KILN — ISOMETRIC GEOMETRY
 *
 * One projection for the whole illustration system: true isometric, 30° axes,
 * y-up in 3D and y-down on screen.
 *
 * Used at build time by the illustration components; the same maths ships with
 * the illustration skill (.github/skills/kiln-isometric-illustration).
 */

export type Pt = [number, number];
export type Pt3 = [number, number, number];

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

export const round = (n: number): number => Math.round(n * 100) / 100;

/** 3D → 2D. x runs down-right, y runs down-left, z runs up. */
export function project([x, y, z]: Pt3): Pt {
  return [(x - y) * COS30, (x + y) * SIN30 - z];
}

export type Projector = (p: Pt3) => Pt;

export function makeProjector({ scale = 1, ox = 0, oy = 0 }: { scale?: number; ox?: number; oy?: number } = {}): Projector {
  return (p: Pt3) => {
    const [sx, sy] = project(p);
    return [round(ox + sx * scale), round(oy + sy * scale)];
  };
}

/* ------------------------------------------------------------- primitives */

export function poly(points: Pt[], closed = true): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ') + (closed ? ' Z' : '');
}

function towards(from: Pt, to: Pt, distance: number): Pt {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const d = Math.min(distance, len / 2);
  return [round(from[0] + (dx / len) * d), round(from[1] + (dy / len) * d)];
}

/** Polygon with quadratic-rounded corners — the backbone of every panel. */
export function roundedPoly(points: Pt[], radius: number): string {
  const n = points.length;
  const corners = points.map((p, i) => ({
    p,
    a: towards(p, points[(i - 1 + n) % n], radius),
    b: towards(p, points[(i + 1) % n], radius),
  }));

  let d = `M${corners[0].b[0]} ${corners[0].b[1]}`;
  for (let i = 1; i <= n; i++) {
    const c = corners[i % n];
    d += ` L${c.a[0]} ${c.a[1]} Q${c.p[0]} ${c.p[1]} ${c.b[0]} ${c.b[1]}`;
  }
  return `${d} Z`;
}

/** Four corners of a horizontal iso rectangle: top → right → bottom → left. */
export function plane(proj: Projector, x: number, y: number, w: number, d: number, z: number): Pt[] {
  return [proj([x, y, z]), proj([x + w, y, z]), proj([x + w, y + d, z]), proj([x, y + d, z])];
}

export interface Slab {
  top: string;
  left: string;
  right: string;
  corners: Pt[];
}

/** A thin sheet lying flat in iso space: rounded top face + its two visible edges. */
export function slab(
  proj: Projector,
  { x, y, w, d, z = 0, t = 6, r = 8 }: { x: number; y: number; w: number; d: number; z?: number; t?: number; r?: number },
): Slab {
  const [A, B, C, D] = plane(proj, x, y, w, d, z);
  const down = (p: Pt): Pt => [p[0], round(p[1] + t)];

  return {
    top: roundedPoly([A, B, C, D], r),
    left: poly([D, C, down(C), down(D)]),
    right: poly([C, B, down(B), down(C)]),
    corners: [A, B, C, D],
  };
}

/** A flat upright card: face + its right-hand edge. */
export function upright(
  proj: Projector,
  { x, y, z, w, h, t = 5, r = 8 }: { x: number; y: number; z: number; w: number; h: number; t?: number; r?: number },
): { face: string; edge: string } {
  const bl = proj([x, y, z]);
  const br = proj([x + w, y, z]);
  const tr = proj([x + w, y, z + h]);
  const tl = proj([x, y, z + h]);
  const shift = (p: Pt): Pt => [round(p[0] + t * 0.62), round(p[1] - t * 0.36)];

  return {
    face: roundedPoly([bl, br, tr, tl], r),
    edge: poly([br, shift(br), shift(tr), tr]),
  };
}

/** Smooth connector between two screen points, bowed off-axis. */
export function link(a: Pt, b: Pt, bow = 0.28): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const nx = -dy * bow;
  const ny = dx * bow;
  const c1: Pt = [round(a[0] + dx * 0.32 + nx), round(a[1] + dy * 0.32 + ny)];
  const c2: Pt = [round(a[0] + dx * 0.72 + nx * 0.55), round(a[1] + dy * 0.72 + ny * 0.55)];
  return `M${a[0]} ${a[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}`;
}

/** Dotted iso floor — two families of dashes on the 30° axes. */
export function dottedGrid(proj: Projector, { extent = 150, step = 26, z = 0 }: { extent?: number; step?: number; z?: number } = {}): string {
  const lines: string[] = [];
  for (let v = -extent; v <= extent; v += step) {
    const a = proj([-extent, v, z]);
    const b = proj([extent, v, z]);
    lines.push(`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`);
    const c = proj([v, -extent, z]);
    const d = proj([v, extent, z]);
    lines.push(`M${c[0]} ${c[1]} L${d[0]} ${d[1]}`);
  }
  return lines.join(' ');
}
