# Scene schema

`scripts/iso-scene.mjs` turns a JSON scene into a standalone animated SVG.

```bash
node scripts/iso-scene.mjs --scene scenes/my-concept.json --out art/my-concept.svg --check
```

## Top level

| Key | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | string | `kiln-scene` | SVG id prefix; keep it unique per page |
| `title` | string | — | `<title>` inside the SVG |
| `description` | string | `title` | `aria-label` |
| `viewBox` | `[x, y, w, h]` | `[0,0,520,400]` | crop tight around the drawing |
| `camera` | object | `{scale:1.3, ox:258, oy:300}` | see projection.md |
| `grid` | `{extent, step}` | `{extent:152, step:26}` | dotted floor |
| `nodes` | array | — | draw order is depth order |

## Nodes

Every node takes `at: [x, y, z]` in iso units unless noted.

### `platform`
A slab under the hero form.

```json
{ "type": "platform", "at": [-36, -36, 0], "size": [72, 72], "height": 9 }
```

### `block`
The solid form. Ink top face, paper sides.

```json
{ "type": "block", "at": [-19, -19, 9], "size": [38, 38], "height": 40, "core": 6 }
```

`core` (optional, number) adds a breathing accent dot and ring 42% up the block.

### `panel`
An upright card: `size: [width, height]`. v runs up, so the chrome bar is at
`v = height`.

```json
{ "type": "panel", "at": [46, -44, 92], "size": [104, 74], "kind": "window", "delay": 0, "duration": 8 }
```

`kind`: `window` · `result` · `sparkplate` · `blank`.

### `sheet`
A card lying on the floor: `size: [width, depth]`.

```json
{ "type": "sheet", "at": [-126, -34, 30], "size": [96, 62], "kind": "card" }
```

`kind`: `card` · `blank`.

### `trace`
A connector from one 3D point to another, with an endpoint node and a packet.

```json
{ "type": "trace", "from": [0, 0, 55], "to": [46, -44, 96], "bow": 0.22, "packet": true }
```

`bow` bends the curve (negative flips the side). `packet: false` disables the
travelling dot.

### `spark`
The four-point glyph, drawn flat in screen space at the projected point.

```json
{ "type": "spark", "at": [118, 30, 103], "size": 8 }
```

## Validation

`--check` fails when:

- the scene has no nodes
- accent-bearing nodes exceed `max(3, 40% of nodes)`
- a node is missing three finite numbers in `at`
- a panel/sheet/platform/block has no `[width, height]`
- a node projects outside the viewBox by more than 28% of its longest side

## Examples

`scripts/scenes/agent-mesh.json` (hub), `scripts/scenes/model-eval.json` (deck +
badge). Copy one, rename it, change the nodes.
