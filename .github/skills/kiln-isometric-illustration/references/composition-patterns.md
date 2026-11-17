# Composition patterns

Three arrangements cover almost every concept. Pick one before touching
coordinates.

## 1. Hub — one conductor, many helpers

Use for: orchestration, routing, agents, a platform in the middle of things.

```
                 ┌ window (back, high)
                 │
   sheet ──── [BLOCK] ──── panel (result, low right)
                 │
              sheet (front-left)
```

- A block on a platform at the origin, 38–44 units tall.
- Three or four satellites at `z` 14–96, spread across at least 200 units of
  screen width.
- One trace per satellite, all leaving the top of the block.
- Satellites alternate between *upright panels* and *sheets lying on the floor*
  so the composition has height as well as spread.

Reference: `agent-mesh`.

## 2. Deck — layered data

Use for: embeddings, search, memory, datasets, anything with depth.

- 3–5 sheets stacked with 12–16 units of `z` and 8–10 units of x/y offset, so
  each edge peeks. Never centre them exactly.
- Put the "content" only on the top sheet: a lattice of 12–18 nodes, edges
  between neighbours, 3 nodes accented.
- One lens or callout floating 20–30 units above the top sheet.
- One upright result panel off to the side, connected by a single trace.

Reference: `vector-search`.

## 3. Flow — before → process → after

Use for: pipelines, inference, deployment, throughput.

- Inputs on the left as a fan of 3 small upright plates, 26 units apart on `y`,
  rising slightly in `z`.
- The block in the centre, on a platform, with a core and steam.
- Output on the right as one taller upright panel.
- Two traces in, one trace out. Packets on all three.

Reference: `inference-pipeline`.

## Adapting a pattern

1. Keep the anchor (block, deck, or row of inputs) at the origin.
2. Place satellites on a rough circle of radius 100–140 in the `x/y` plane, then
   lift each independently in `z`. Iso spread comes from `(x − y)`; height comes
   from `z`.
3. Order satellites so no two share an outline edge; overlapping by 10–20% is
   good, more is muddy.
4. Reserve the accent for **one** satellite's action. Everything else is
   hairline.

## Inventing a new one

Only if the three above really don't fit. Rules that still apply:

- One hero form at the origin.
- At most five secondary forms.
- All secondary forms connect to the hero by a trace.
- One accent.
- The silhouette must be readable as a thumbnail: if you can't describe the
  shape in five words, simplify.

## Anti-patterns

| Symptom | Cause | Fix |
| --- | --- | --- |
| Drawing looks flat | everything at one `z` | lift satellites 20–60 units |
| Looks cluttered | > 6 forms | delete the weakest one |
| Looks like a diagram, not an illustration | no interface furniture | add rows, pills, chips |
| Looks decorative | accent on two+ ideas | keep one, demote the rest to hairline |
| Reads as a pile | satellites share one `y` | vary `x` and `y` independently |
