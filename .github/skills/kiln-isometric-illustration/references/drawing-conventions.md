# Drawing conventions

## Palette

| Role | Value | Notes |
| --- | --- | --- |
| Ink | `#090909` | every outline; near-black, never `#000` |
| Paper | `#FFFFFF` | every fill; never `#FFF`-adjacent greys |
| Hairline | ink at 42% opacity | interior detail only |
| Accent | `#090909` | solid ink — one idea per drawing |
| Grid | ink at 28%, dotted | floor only |
| Shadow | ink at 7.5% | blurred, offset +8/+11 |

Dark surfaces: ink → `#FFFFFF`, paper → `#111111`, accent → `#ADADAD`. Same
drawing, different paper.

## Stroke family

```css
.iso-panel      { stroke-width: 1.25; stroke-linejoin: round; }
.iso-accentline { stroke-width: 1.08; }
.iso-hair       { stroke-width: 0.86; stroke-opacity: 0.42; }
```

There is no fourth weight. Detail comes from density, not thickness. Hairlines
carry all interface furniture; the only 1.25 outlines are the outer edges of a
form.

## Layer order

Draw in this order, always:

1. **Grid** — dotted floor, masked to fade at the edges.
2. **Shadows** — blurred ink polygons offset `translate(8 11)`.
3. **Ground forms** — platforms, sheets lying flat.
4. **Solid forms** — the block, cubes, upright panels.
5. **Furniture** — rows, pills, meters, chips inside panels.
6. **Traces** — connectors, drawn *under* panels where they pass behind.
7. **Accents** — packets, sparks, the one accent element.

Because the SVG has no depth buffer, order *is* depth. If two panels overlap,
draw the further one (larger `x + y`) first.

## The block

A solid form is the only place ink fills a face:

- top face: ink
- left face: paper
- right face: ink at 12% over paper
- corners: `2.5` screen-space radius
- one accent dot or ring may hover above it

Never outline a block with a heavier stroke than 1.25.

## Furniture

Panels are always plausible interfaces, at 2–3 levels of detail:

- **Chrome** — three dots, 7 units apart, 2.1 radius, on a hairline divider.
- **Rows** — 4–5 units tall, radii 2–2.5, widths varied by 12–30% so they don't
  look typeset. Last row 60% width.
- **Action** — exactly one pill or rect filled solid ink per panel, 10–18 units wide.
- **Texture block** — one larger rect with a dot row inside standing in for an
  image or chart.
- **Meter** — 6–9 bars, heights 0.35–0.9 of the box, drawn in a frame.
- **Chips** — evenly spaced dots at 1.5–1.6 radius.

Furniture sits 8–9 units in from the panel edge and 5–9 units apart.

## The dotted floor

Two families of dashes on the 30° axes, `stroke-dasharray: 1.6 7`, ink at 28%,
masked by a radial gradient (`cx 50% cy 58% r 56%`, opaque to 28%, transparent
at 100%). The floor never reaches the frame edge — it dissolves.

## Shadow

One blurred polygon per floating object, offset `translate(8 11)`, ink at 7.5%,
`feGaussianBlur stdDeviation="7"`. No directional shadows on hairline furniture.

## Spacing discipline

- Layer separation: 12–20 iso units of `z`.
- Panel gaps when side by side: ≥ 20 units.
- Nothing touches the frame edge; keep a 5% margin.
- Which is why the viewBox usually crops to the drawing: `viewBox="24 40 500 372"`.

## Don't

- Rotate a panel off-axis "for energy".
- Introduce a hue. The drawing is ink on paper, full stop.
- Use pure white/black, gradients inside the drawing, or drop shadows on type.
- Put a gratuitous 3D perspective on the pieces — the projection is the style.
