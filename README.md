# Kiln — brand book

A working brand book for **Kiln**, built with Astro. It contains a monochrome
design system with no colour at all, a library of CSS-only base components,
the logo system, an animated isometric illustration language (with an agent
skill that draws more of it), and two interactive Three.js applications.

> The visual system is modelled on [polar.sh](https://polar.sh): a neutral
> `50→950` grey ramp, one accent, pill controls, hairline borders, Inter at a
> display optical size, and whitespace doing most of the work.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview
```

Node 20+.

## What is where

| Path | What it is |
| --- | --- |
| `src/styles/tokens.css` | The whole system: neutral ramp, type, space, radius, motion, semantic layer, light + dark themes |
| `src/styles/base.css` | Reset, typographic scale, layout primitives |
| `src/styles/components.css` | 15 base components, CSS-only |
| `src/styles/motion.css` | Reveal, float, trace, pulse and the reduced-motion contract |
| `src/styles/illustration.css` | The isometric line-art class API (`.iso-*`) |
| `src/config/brand.ts` | Name, tagline, navigation, palette + type data shown on `/foundations` |
| `src/config/assets.ts` | **The asset registry** — every image resolves through here |
| `src/lib/iso.ts`, `src/lib/iso-ui.ts` | Isometric projection maths and UI-part helpers |
| `src/components/` | Nav, footer, chapter header, demo block, logo, bento hero, three illustrations |
| `src/scripts/three/` | Shared WebGL stage plus the interactive keynote scene |
| `.github/skills/kiln-isometric-illustration/` | The illustration skill (procedure, references, generator) |
| `scripts/make-placeholders.mjs` | Regenerates the placeholder artwork in `public/brand/` |

Pages: `/` `/foundations` `/components` `/logos` `/illustration` `/motion`
`/applications` `/changelog`.

## Replacing imagery

Nothing is hardcoded. Each image slot resolves in this order:

1. **Environment variable** — e.g. `PUBLIC_LOGO_PRIMARY=https://cdn…/logo.svg`
2. **Drop-in file** — e.g. `public/brand/logos/primary.svg`
3. **Shipped placeholder** — the designed stand-ins in `public/brand/`

So the fastest path is to drop a file at the documented path and reload. The
full list of slots, with paths and aspect ratios, is in
[`.env.example`](./.env.example) and rendered live on `/logos#registry`.

```bash
cp .env.example .env      # then fill in whatever you want to override
```

Slots: 4 logo lockups, 2 hero media tiles, presentation slide, stage
backdrop, and the Open Graph card. The three.js textures read the same registry.

## The illustration skill

`.github/skills/kiln-isometric-illustration/` teaches an agent to draw in the
same hand:

- `SKILL.md` — the procedure (brief → pattern → coordinates → build → animate → validate)
- `references/projection.md` — the projection maths, frames and primitives
- `references/drawing-conventions.md` — strokes, palette, layer order, furniture
- `references/motion.md` — the six moves and their timings
- `references/composition-patterns.md` — hub, deck, flow
- `references/scene-schema.md` — JSON schema for the generator
- `scripts/iso-scene.mjs` — JSON in, standalone animated SVG out
- `assets/template.svg` — a correctly layered blank frame

```bash
# validate a bundled scene against the style rules
node .github/skills/kiln-isometric-illustration/scripts/iso-scene.mjs \
  --scene agent-mesh --check

# render one to a file
node .github/skills/kiln-isometric-illustration/scripts/iso-scene.mjs \
  --scene model-eval --out public/illustrations/model-eval.svg
```

In Copilot Chat: `@workspace /kiln-isometric-illustration draw a retrieval scene …`

## Interactive scenes

`/applications` mounts one Three.js scene lazily when it scrolls into view:

- **Keynote stage** — a 27 m LED wall (2.3:1) on a dark deck, shot from the back
  of the house: thirteen raked rows of instanced seating in silhouette, a
  ceiling grid and one truss. Nothing is lit except the wall.

It runs IBL → ACES → bloom → a film pass (vignette + grain), and scales its spill
lighting to the average luminance of the artwork, so swapping in a dark slide
genuinely lights the room less.

It supports drag-to-orbit, scroll-to-zoom, preset artwork, file upload,
drag-and-drop onto the wall, wall on/off, auto-orbit and view reset. Artwork is
centre-cropped to 2.3:1, never stretched. If WebGL is unavailable the scene
falls back to the static image.

## Conventions

- **Element first.** A bare `<button>`, `<input>`, `<select>`, `<textarea>`,
  `<progress>`, `<details>` or `<table>` is already on system. A class is only
  used to pick a variant (`.primary`, `.sm`, `.card-accent`, `.badge-live`), and
  there is no BEM. Links opt in with `.button`, so a link can never accidentally
  look like a button.
- **State comes from the platform.** `:user-invalid`, `:checked`, `:disabled`,
  `:open`, `:focus-visible`, `[aria-selected]`, `[aria-invalid]` and `:has()` on
  the field wrapper. No `is-active`, no `has-error`, no class toggling for
  things the element already knows.
- **Text that is only decoration is generated.** Tooltips are
  `.tooltip[data-tooltip="…"]` and drawn with `attr()`; nothing is duplicated in
  the markup. The attribute carries the *content*, not the styling.
- **Never draw a control state with `::after` on an `<input>`.** Safari does not
  render pseudo-elements on replaced elements, so the checkbox tick, the radio
  dot and the switch knob are background images and gradients instead. The
  switch slides by animating `background-position`.
- **Native disclosure animates itself.** `details::details-content` transitions
  `block-size` from `0` to `auto`, enabled by `interpolate-size: allow-keywords`
  on `:root` and `@starting-style` for the first frame. No script, and browsers
  without it simply snap open.
- **Tokens only.** Components reference the semantic layer (`--surface-*`,
  `--text-*`, `--line-*`), never a raw hex or a primitive.
- **Themes are variable swaps.** `[data-theme="dark"]` on `<html>` re-points the
  semantic layer; `.theme-subtle` and `.theme-dark` do the same for individual
  sections. Markup never changes. The nav toggle persists to `localStorage` and
  falls back to `prefers-color-scheme`.
- **No colour, with one reservation.** The palette contains zero hue — not in
  the UI, not in the illustrations, not in the 3D scenes. Emphasis is fill,
  weight and border style, and the "accent" is solid ink, which inverts with
  the theme. The single exception is `--invalid-line` / `--invalid-text` /
  `--invalid-surface`, which may only ever be applied to a form field the user
  got wrong. It is always a pair — red border *and* red label, hint and error
  line — so the state survives greyscale.
- **Motion is CSS.** No animation libraries; everything stops under
  `prefers-reduced-motion`.
- **Borders before shadows.** Depth comes from hairline borders and surface
  steps, not elevation.
