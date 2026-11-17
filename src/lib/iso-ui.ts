/**
 * KILN — ISOMETRIC UI PARTS
 *
 * Tiny helpers for drawing interface furniture *inside* an iso plane, so a
 * browser window or a settings card keeps its perspective. Used by the three
 * reference illustrations and documented in the illustration skill.
 */
import { roundedPoly, poly, type Pt, type Projector } from './iso';

/** A 2D coordinate frame mapped into 3D iso space: (u, v) → screen. */
export type Frame = (u: number, v: number) => Pt;

/** A card standing up along the x-axis: u runs along x, v runs up. */
export const verticalFrame =
  (proj: Projector, [x, y, z]: [number, number, number]): Frame =>
  (u, v) =>
    proj([x + u, y, z + v]);

/** A card lying flat on the floor: u runs along x, v runs along y. */
export const floorFrame =
  (proj: Projector, [x, y, z]: [number, number, number]): Frame =>
  (u, v) =>
    proj([x + u, y + v, z]);

/** Rounded rectangle inside a frame. */
export function rect(f: Frame, u: number, v: number, w: number, h: number, r = 3): string {
  return roundedPoly([f(u, v), f(u + w, v), f(u + w, v + h), f(u, v + h)], r);
}

/** Straight rule inside a frame. */
export function rule(f: Frame, u1: number, v1: number, u2: number, v2: number): string {
  const a = f(u1, v1);
  const b = f(u2, v2);
  return `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;
}

/** Small dot inside a frame (screen radius, not projected). */
export function dot(f: Frame, u: number, v: number, r = 2): string {
  const p = f(u, v);
  return `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" />`;
}

/** Evenly spaced dots — the "loading / vector / chip" texture. */
export function dotRow(f: Frame, u: number, v: number, count: number, gap: number, r = 1.4): string {
  return Array.from({ length: count }, (_, i) => dot(f, u + i * gap, v, r)).join('');
}

/** Three overlapping circles: window chrome. */
export function chromeDots(f: Frame, u: number, v: number, r = 2.4, gap = 8): string {
  return dotRow(f, u, v, 3, gap, r);
}

/** A short pill — buttons, tags, toggles. */
export function pill(f: Frame, u: number, v: number, w: number, h: number): string {
  return rect(f, u, v, w, h, Math.min(w, h) / 2);
}

/** Jagged sparkline inside a frame. */
export function sparkline(f: Frame, u: number, v: number, w: number, h: number, points = 9): string {
  const heights = [0.35, 0.62, 0.28, 0.78, 0.5, 0.9, 0.44, 0.7, 0.58, 0.86, 0.4];
  const step = w / (points - 1);
  const pts: Pt[] = Array.from({ length: points }, (_, i) => f(u + i * step, v + h - heights[i % heights.length] * h));
  return poly(pts, false);
}

/** Three-bar meter. */
export function meter(f: Frame, u: number, v: number, w: number, h: number, bars = 7): string {
  const gap = w / bars;
  return Array.from({ length: bars }, (_, i) => {
    const bh = h * (0.35 + ((i * 37) % 10) / 14);
    return poly([f(u + i * gap, v + h - bh), f(u + i * gap + gap * 0.6, v + h - bh), f(u + i * gap + gap * 0.6, v + h), f(u + i * gap, v + h)]);
  }).join('');
}

/** Four-point "spark" — the AI glyph used across the system. */
export function spark(cx: number, cy: number, r: number): string {
  const k = r * 0.26;
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`;
}

/** A circle drawn in screen space at a frame coordinate (UI dots, magnifiers). */
export function circleAt(f: Frame, u: number, v: number, r: number, className = ''): string {
  const p = f(u, v);
  return `<circle${className ? ` class="${className}"` : ''} cx="${p[0]}" cy="${p[1]}" r="${r}" />`;
}
