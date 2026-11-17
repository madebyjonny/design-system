---
name: kiln-isometric-illustration
description: 'Draw Kiln-style isometric line-art illustrations as animatable SVG. Use when asked to create, reproduce, or extend Kiln brand illustrations; to draw isometric diagrams of AI/product concepts (agents, pipelines, embeddings, evaluation); to build floating UI panels in isometric projection; or to generate a new scene from JSON with scripts/iso-scene.mjs.'
argument-hint: 'Describe the concept, e.g. "model evaluation dashboard with three candidate cards"'
---

# Kiln isometric illustration

Produce illustrations that look hand-drawn by the same person every time: true
isometric projection, one stroke family, one solid ink accent, and motion that
explains rather than decorates. Output is always **inline SVG with CSS-only
animation** — no canvas, no raster, no JavaScript.

## When to use

- Creating a new illustration for the Kiln brand book or any Kiln surface.
- Reproducing the house style in another project or at another size.
- Turning a product/AI concept into a diagram ("agents", "retrieval",
  "evaluation", "inference", "orchestration").
- Extending the three reference scenes: `agent-mesh`, `vector-search`,
  `inference-pipeline`.

## Non-negotiables

| Rule | Value |
| --- | --- |
| Projection | true isometric, 30° axes — never fake it with skew |
| Strokes | 1.25 outline · 1.08 accent · 0.86 hairline at 42% opacity |
| Colour | ink `#090909` on paper `#FFFFFF`, one accent `#090909` |
| Accent budget | ≤ 5% coverage, no two accent-bearing ideas competing |
| Motion | CSS classes only, all of them stop under `prefers-reduced-motion` |

If a shape can't be projected with the basis in
[projection.md](./references/projection.md), it doesn't belong in the drawing.

## Procedure

1. **Brief in one sentence.** What system is being explained? Name the objects,
   not the vibe. "Three candidate models scored by one evaluator" beats
   "something about AI".
2. **Pick a pattern** from [composition-patterns.md](./references/composition-patterns.md):
   *hub* (one conductor, many helpers), *deck* (layered data), *flow*
   (before → process → after). Only invent a new arrangement if none fit.
3. **Sketch coordinates in iso units.** Floor at `z = 0`, origin near the centre
   of the frame. Layers separate by 12–20 units of `z`, never by shadow.
4. **Build the scene.** Two ways, both valid:
   - *Vector* (default): inline SVG paths computed from the projection helpers
     in [projection.md](./references/projection.md).
   - *Headless*: write a JSON scene and run the generator —
     `node scripts/iso-scene.mjs --scene my-scene --out art/my-scene.svg`.
     Schema: [scene-schema.md](./references/scene-schema.md).
5. **Add interface furniture** inside the panels — chrome dots, rows, pills,
   meters, chips. A blank rectangle is not a UI. Conventions:
   [drawing-conventions.md](./references/drawing-conventions.md).
6. **Animate** with the six moves in [motion.md](./references/motion.md). One
   move per idea: float for suspension, trace for connection, packet for
   transport, node for endpoints, drift for lenses, steam for computation.
7. **Validate before delivering** — run the checklist below, and
   `node scripts/iso-scene.mjs --scene <name> --check` when using the generator.

## Generator

```bash
# render a bundled scene to stdout
node scripts/iso-scene.mjs --scene agent-mesh

# render to a file and enforce the style rules
node scripts/iso-scene.mjs --scene model-eval --out art/model-eval.svg --check

# validate only (exit 1 on violations)
node scripts/iso-scene.mjs --scene model-eval --check
```

Bundled scenes: `scripts/scenes/agent-mesh.json`, `scripts/scenes/model-eval.json`.
The generator reuses the host project's `src/styles/illustration.css` when
present, so generated files animate identically to the hand-built components.

## Validation checklist

- [ ] Every path derives from `x = (x−y)·cos30`, `y = (x+y)·sin30 − z`.
- [ ] Stroke widths are only 1.25 / 1.08 / 0.86 — no in-between values.
- [ ] Exactly one accent element (solid ink); a reader can point at it in one second.
- [ ] Panels are separated by iso offset or `z`, never by drop shadow alone.
- [ ] Interface content exists in every panel that claims to be a UI.
- [ ] Motion uses only `.iso-float`, `.iso-trace`, `.iso-packet`, `.iso-node`,
      `.iso-lens`, `.iso-steam`, `.iso-core`.
- [ ] Animation is CSS in the SVG (or the host stylesheet), nothing scripted.
- [ ] The drawing still reads with **all motion off**.
- [ ] `<title>` and `aria-label` describe the scene, not the medium.
- [ ] Filename and title are lowercase kebab-case.

## References

- [projection.md](./references/projection.md) — the maths, coordinate frames,
  primitives, and a worked example.
- [drawing-conventions.md](./references/drawing-conventions.md) — strokes,
  palette, layer order, furniture, shadows, the dotted floor.
- [motion.md](./references/motion.md) — the six moves with CSS and timings.
- [composition-patterns.md](./references/composition-patterns.md) — hub, deck,
  flow, and how to adapt them.
- [scene-schema.md](./references/scene-schema.md) — JSON schema for the
  generator.
- [template.svg](./assets/template.svg) — a correctly layered blank frame.
