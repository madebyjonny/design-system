# Projection

One projection for every Kiln drawing. If a shape cannot be produced with it, the
shape is wrong.

## Basis

True isometric: the three world axes project to screen directions 120° apart.

```
screen.x = (x − y) · cos30°      cos30° ≈ 0.8660
screen.y = (x + y) · sin30° − z  sin30°  ≈ 0.5000
```

`x` runs down-right, `y` runs down-left, `z` runs up. Screen `y` grows downward,
so subtracting `z` lifts the point.

```js
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);
const project = ([x, y, z]) => [(x - y) * COS30, (x + y) * SIN30 - z];
```

Scale and centre with a projector so scene coordinates stay readable:

```js
const makeProjector = ({ scale = 1, ox = 0, oy = 0 } = {}) => ([x, y, z]) => {
  const [sx, sy] = project([x, y, z]);
  return [ox + sx * scale, oy + sy * scale];
};
```

Reference camera: `{ scale: 1.3, ox: 260, oy: 298 }` in a `0 0 520 400` viewBox.

## Axis sanity table

For `scale = 1`, origin at (0,0):

| Point | Screen |
| --- | --- |
| `[0, 0, 0]` | `[0, 0]` |
| `[100, 0, 0]` | `[86.6, 50]` |
| `[0, 100, 0]` | `[-86.6, 50]` |
| `[0, 0, 100]` | `[0, -100]` |
| `[100, 100, 0]` | `[0, 100]` |

## Frames — drawing *inside* a panel

Interface furniture must lie in the panel's own plane, otherwise the perspective
breaks. A frame turns `(u, v)` into iso space:

```js
// vertical card: u runs along x, v runs up (chrome bar is at v = h)
const vframe = (P, [x, y, z]) => (u, v) => P([x + u, y, z + v]);

// sheet on the floor: u runs along x, v runs along y
const fframe = (P, [x, y, z]) => (u, v) => P([x + u, y + v, z]);
```

Everything is then drawn with two primitives:

```js
const rect = (f, u, v, w, h, r = 3) =>
  roundedPoly([f(u, v), f(u + w, v), f(u + w, v + h), f(u, v + h)], r);

const rule = (f, u1, v1, u2, v2) =>
  `M${f(u1, v1)[0]} ${f(u1, v1)[1]} L${f(u2, v2)[0]} ${f(u2, v2)[1]}`;
```

Because `rect` rounds corners in **screen space**, a rounded rect in iso space
keeps an even radius on every edge — the trick that makes the panels read as
moulded rather than folded.

## Primitives

```js
// four corners of an iso rectangle, sorted top → right → bottom → left
const plane = (P, x, y, w, d, z) =>
  [P([x, y, z]), P([x + w, y, z]), P([x + w, y + d, z]), P([x, y + d, z])];

// a thin sheet: rounded top face + the two visible edges
function slab(P, { at: [x, y, z], size: [w, d], height = 6, r = 8 }) {
  const [A, B, C, D] = plane(P, x, y, w, d, z);
  const down = (p) => [p[0], p[1] + height];
  return {
    top:   roundedPoly([A, B, C, D], r),
    left:  poly([D, C, down(C), down(D)]),
    right: poly([C, B, down(B), down(C)]),
  };
}

// a standing card: face + right-hand edge
function upright(P, { at: [x, y, z], size: [w, h], thickness = 5, r = 7 }) { ... }

// a connector, bowed off-axis so it never looks like a wire
function link(a, b, bow = 0.24) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const nx = -dy * bow, ny = dx * bow;
  return `M${a} C${a + 0.32d + n} ${a + 0.72d + 0.55n} ${b}`;
}
```

`poly` builds a polygon path from screen points. `roundedPoly` uses a quadratic
per corner: inset each vertex by `r` along both edges, then `Q` through the
vertex.

## Worked example

A 72×72 platform 9 units thick, centred at the origin, sitting on the floor:

```js
const P = makeProjector({ scale: 1.3, ox: 266, oy: 296 });
const s = slab(P, { at: [-36, -36, 0], size: [72, 72], height: 9, r: 9 });
// s.top   → rounded diamond, the visible surface
// s.left  → left face
// s.right → right face
// draw order: shadow, left, right, top
```

## Rules

1. Never rotate a shape with a CSS/SVG transform to "make it iso" — project it.
2. Never use `skew()` or `matrix()` for anything structural.
3. Circles are the one exception: small UI dots (< 4 px) and lenses may be drawn
   as true circles in screen space; they read as circles at these sizes.
4. Keep the floor at `z = 0`. Objects sit on it or float above it; only the
   "computation" block may sit on a platform.
