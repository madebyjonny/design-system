#!/usr/bin/env node
/**
 * Kiln isometric illustration generator.
 *
 * Deterministic: a JSON scene in, a standalone animated SVG out. No
 * dependencies, no network, no random ids — regenerate and diff cleanly.
 *
 *   node iso-scene.mjs --scene agent-mesh
 *   node iso-scene.mjs --scene ./my-scene.json --out out/hero.svg
 *   node iso-scene.mjs --scene agent-mesh --check
 *
 * Scene schema: see references/scene-schema.md
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(HERE, '..');
const PROJECT_CSS = resolve(HERE, '../../../src/styles/illustration.css');

/* ------------------------------------------------------------------ maths */

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);
const r2 = (n) => Math.round(n * 100) / 100;

const project = ([x, y, z]) => [(x - y) * COS30, (x + y) * SIN30 - z];

function makeProjector({ scale = 1, ox = 0, oy = 0 } = {}) {
  return ([x, y, z]) => {
    const [sx, sy] = project([x, y, z]);
    return [r2(ox + sx * scale), r2(oy + sy * scale)];
  };
}

const poly = (pts, closed = true) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ') + (closed ? ' Z' : '');

function towards(from, to, d) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.min(d, len / 2);
  return [r2(from[0] + (dx / len) * k), r2(from[1] + (dy / len) * k)];
}

function roundedPoly(points, radius) {
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

const plane = (P, x, y, w, d, z) => [P([x, y, z]), P([x + w, y, z]), P([x + w, y + d, z]), P([x, y + d, z])];

function slab(P, { at: [x, y, z], size: [w, d], height = 6, r = 8 }) {
  const [A, B, C, D] = plane(P, x, y, w, d, z);
  const down = (p) => [p[0], r2(p[1] + height)];
  return {
    top: roundedPoly([A, B, C, D], r),
    left: poly([D, C, down(C), down(D)]),
    right: poly([C, B, down(B), down(C)]),
  };
}

function upright(P, { at: [x, y, z], size: [w, h], thickness = 5, r = 7 }) {
  const bl = P([x, y, z]);
  const br = P([x + w, y, z]);
  const tr = P([x + w, y, z + h]);
  const tl = P([x, y, z + h]);
  const shift = (p) => [r2(p[0] + thickness * 0.62), r2(p[1] - thickness * 0.36)];
  return { face: roundedPoly([bl, br, tr, tl], r), edge: poly([br, shift(br), shift(tr), tr]) };
}

function link(a, b, bow = 0.24) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const nx = -dy * bow;
  const ny = dx * bow;
  const c1 = [r2(a[0] + dx * 0.32 + nx), r2(a[1] + dy * 0.32 + ny)];
  const c2 = [r2(a[0] + dx * 0.72 + nx * 0.55), r2(a[1] + dy * 0.72 + ny * 0.55)];
  return `M${a[0]} ${a[1]} C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}`;
}

function dottedGrid(P, { extent = 150, step = 26, z = 0 }) {
  const out = [];
  for (let v = -extent; v <= extent; v += step) {
    const a = P([-extent, v, z]);
    const b = P([extent, v, z]);
    out.push(`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`);
    const c = P([v, -extent, z]);
    const d = P([v, extent, z]);
    out.push(`M${c[0]} ${c[1]} L${d[0]} ${d[1]}`);
  }
  return out.join(' ');
}

/* ------------------------------------------------------------------ frames */

const vframe = (P, [x, y, z]) => (u, v) => P([x + u, y, z + v]);
const fframe = (P, [x, y, z]) => (u, v) => P([x + u, y + v, z]);

const rect = (f, u, v, w, h, r = 3) => roundedPoly([f(u, v), f(u + w, v), f(u + w, v + h), f(u, v + h)], r);
const rule = (f, u1, v1, u2, v2) => `M${f(u1, v1)[0]} ${f(u1, v1)[1]} L${f(u2, v2)[0]} ${f(u2, v2)[1]}`;
const dot = (f, u, v, r = 2) => {
  const p = f(u, v);
  return `<circle cx="${p[0]}" cy="${p[1]}" r="${r}"/>`;
};
const dotRow = (f, u, v, count, gap, r = 1.4) =>
  Array.from({ length: count }, (_, i) => dot(f, u + i * gap, v, r)).join('');
const pill = (f, u, v, w, h) => rect(f, u, v, w, h, Math.min(w, h) / 2);

function meter(f, u, v, w, h, bars = 7) {
  const gap = w / bars;
  let out = '';
  for (let i = 0; i < bars; i++) {
    const bh = h * (0.34 + ((i * 37) % 10) / 14);
    out += poly([
      f(u + i * gap, v + h - bh),
      f(u + i * gap + gap * 0.6, v + h - bh),
      f(u + i * gap + gap * 0.6, v + h),
      f(u + i * gap, v + h),
    ]);
  }
  return out;
}

function spark(cx, cy, r) {
  const k = r * 0.26;
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`;
}

/* -------------------------------------------------------------- node kinds */

const CONTENT = {
  /** Browser-ish window: chrome bar, rows, one accent action. */
  window(f, w, h, i) {
    return `
      <path class="iso-panel" d="${rect(f, 0, 0, w, h, 7)}"/>
      <path class="iso-hair" d="${rule(f, 0, h - 12, w, h - 12)}"/>
      ${dotRow(f, 9, h - 6.5, 3, 7, 2.1)}
      <path class="iso-hair" d="${rect(f, 9, h - 32, 34, 18, 3)}"/>
      ${dotRow(f, 14, h - 23, 4, 6, 1.4)}
      <path class="iso-hair" d="${rect(f, 50, h - 30, w - 60, 5, 2.5)}"/>
      <path class="iso-hair" d="${rect(f, 50, h - 40, w - 78, 5, 2.5)}"/>
      <path class="iso-hair" d="${rect(f, 9, 32, w - 18, 4, 2)}"/>
      <path class="iso-hair" d="${rect(f, 9, 23, w - 40, 4, 2)}"/>
      ${i === 0 ? `<path class="iso-accent" d="${pill(f, 9, 8, 32, 10)}"/>` : ''}`;
  },
  /** Result panel: one highlighted row, then quiet rows. */
  result(f, w, h) {
    return `
      <path class="iso-panel" d="${rect(f, 0, 0, w, h, 7)}"/>
      <path class="iso-hair" d="${rule(f, 0, h - 12, w, h - 12)}"/>
      ${dotRow(f, 9, h - 6.5, 3, 7, 2.1)}
      <path class="iso-accentline" d="${rect(f, 9, h - 40, w - 18, 22, 4)}"/>
      <path class="iso-hair" d="${rect(f, 9, 28, w - 34, 4, 2)}"/>
      <path class="iso-hair" d="${rect(f, 9, 19, w - 52, 4, 2)}"/>
      ${dotRow(f, 9, 10, 5, 7, 1.6)}`;
  },
  /** Card lying flat: texture block, text bars, a meter. */
  card(f, w, d) {
    return `
      <path class="iso-panel" d="${rect(f, 0, 0, w, d, 7)}"/>
      ${dotRow(f, 8, 8, 6, 5.5, 1.5)}
      <path class="iso-hair" d="${rect(f, 8, 17, w - 16, d * 0.4, 4)}"/>
      ${dotRow(f, 13, 22, 5, 5, 1.3)}
      <path class="iso-hair" d="${rect(f, 8, d - 18, w - 40, 4.5, 2.2)}"/>
      <path class="iso-hair" d="${rect(f, 8, d - 27, w - 62, 4.5, 2.2)}"/>
      <path class="iso-hair" d="${rect(f, w - 26, d - 26, 18, 14, 4)}"/>
      ${meter(f, w - 24, d - 24, 14, 10)}`;
  },
  /** Empty plate with a spark — for "output" or "generated" objects. */
  sparkplate(f, w, h) {
    return `
      <path class="iso-panel" d="${rect(f, 0, 0, w, h, 7)}"/>
      <path class="iso-accentline" d="${rect(f, 9, h - 44, 34, 30, 5)}"/>
      <path class="iso-hair" d="${rect(f, 52, h - 26, w - 64, 4.4, 2.2)}"/>
      <path class="iso-hair" d="${rect(f, 52, h - 35, w - 76, 4.4, 2.2)}"/>
      <path class="iso-hair" d="${rect(f, 9, 26, w - 18, 4, 2)}"/>
      <path class="iso-hair" d="${rect(f, 9, 17, w - 34, 4, 2)}"/>
      ${dotRow(f, 9, 8, 6, 7, 1.5)}`;
  },
  /** Bare plate. */
  blank(f, w, h) {
    return `<path class="iso-panel" d="${rect(f, 0, 0, w, h, 7)}"/>`;
  },
};

/* ------------------------------------------------------------------ render */

function render(scene) {
  const {
    title = 'Kiln illustration',
    description = '',
    viewBox = [0, 0, 520, 400],
    camera = {},
    grid = { extent: 152, step: 26 },
    nodes = [],
    accent = '#090909',
    ink = '#090909',
    paper = '#ffffff',
    id = 'kiln-scene',
  } = scene;

  const P = makeProjector({ scale: 1.3, ox: 258, oy: 300, ...camera });
  const idx = (type) => nodes.filter((n) => n.type === type).length;

  const out = [];
  out.push(`<g class="iso-grid" mask="url(#${id}-fade)"><path d="${dottedGrid(P, grid)}"/></g>`);

  /* ground shadows first so nothing overlaps them incorrectly */
  const shadows = [];
  const forms = [];
  const furniture = [];
  const accents = [];

  for (const node of nodes) {
    switch (node.type) {
      case 'platform': {
        const s = slab(P, { at: node.at, size: node.size, height: node.height ?? 9, r: node.radius ?? 9 });
        shadows.push(`<path class="iso-shadow" transform="translate(9 13)" style="filter:url(#${id}-soft)" d="${roundedPoly(plane(P, ...node.at.slice(0, 2), ...node.size, node.at[2]), 9)}"/>`);
        forms.push(`<path class="iso-panel" d="${s.top}"/>`);
        break;
      }
      case 'block': {
        const [x, y, z] = node.at;
        const [w, d] = node.size;
        const h = node.height ?? 40;
        const top = plane(P, x, y, w, d, z + h);
        const bot = plane(P, x, y, w, d, z);
        const right = poly([bot[1], bot[2], top[2], top[1]]);
        const left = poly([bot[2], bot[3], top[3], top[2]]);
        forms.push(
          `<path class="iso-cube-left" d="${left}"/><path class="iso-cube-right" d="${right}"/><path class="iso-cube-top" d="${roundedPoly(top, 2.5)}"/>`,
        );
        if (node.core) {
          const c = P([x + w / 2, y + d / 2, z + h * 0.42]);
          accents.push(`<circle class="iso-core" cx="${c[0]}" cy="${c[1]}" r="${node.core}"/>`);
          accents.push(`<circle class="iso-core-ring" cx="${c[0]}" cy="${c[1]}" r="${node.core * 1.9}"/>`);
        }
        break;
      }
      case 'panel': {
        const f = vframe(P, node.at);
        const [w, h] = node.size;
        const kind = node.kind ?? 'window';
        const content = (CONTENT[kind] ?? CONTENT.window)(f, w, h, idx('panel'));
        furniture.push(`
          <g class="iso-float" style="--float-delay:${node.delay ?? 0.4}s;--float-duration:${node.duration ?? 8}s">
            <path class="iso-shadow" transform="translate(8 11)" style="filter:url(#${id}-soft)" d="${rect(f, 0, 0, w, h, 7)}"/>
            ${content}
          </g>`);
        break;
      }
      case 'sheet': {
        const f = fframe(P, node.at);
        const [w, d] = node.size;
        const s = slab(P, { at: node.at, size: node.size, height: 5, r: 8 });
        const kind = node.kind ?? 'card';
        furniture.push(`
          <g class="iso-float" style="--float-delay:${node.delay ?? 1}s;--float-duration:${node.duration ?? 9}s">
            <path class="iso-shadow" transform="translate(7 10)" style="filter:url(#${id}-soft)" d="${s.top}"/>
            ${(CONTENT[kind] ?? CONTENT.card)(f, w, d)}
          </g>`);
        break;
      }
      case 'trace': {
        const a = P(node.from);
        const b = P(node.to);
        const path = link(a, b, node.bow ?? 0.22);
        const i = idx('trace');
        furniture.push(`<path class="iso-trace" style="--i:${i}" d="${path}"/>`);
        accents.push(`<circle class="iso-node" style="--i:${i}" cx="${b[0]}" cy="${b[1]}" r="3"/>`);
        if (node.packet !== false) {
          accents.push(`<circle class="iso-packet" style="--i:${i};offset-path:path('${path}')" r="2.3"/>`);
        }
        break;
      }
      case 'spark': {
        const p = P(node.at);
        accents.push(`<path class="iso-solid" d="${spark(p[0], p[1], node.size ?? 8)}"/>`);
        break;
      }
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  out.push(...shadows, ...forms, ...furniture, `<g class="iso-accents">${accents.join('')}</g>`);

  const css = loadCss();
  const [vx, vy, vw, vh] = viewBox;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="${viewBox.join(' ')}" role="img" aria-label="${description || title}" data-motion="illustration" fill="none">
  <title>${title}</title>
  <defs>
    <radialGradient id="${id}-fade" cx="50%" cy="58%" r="56%">
      <stop offset="28%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="${id}-fade"><rect x="${vx - 40}" y="${vy - 40}" width="${vw + 80}" height="${vh + 80}" fill="url(#${id}-fade)"/></mask>
    <filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
    <style>
${css}
    </style>
  </defs>
  ${out.join('\n  ')}
</svg>
`;
}

function loadCss() {
  const tokens = `--iso-line:${'#090909'};--iso-paper:#fff;--iso-accent:#090909;--illustration-stroke:1.25;--ease-in-out:cubic-bezier(.65,0,.35,1);--ease-out:cubic-bezier(.22,1,.36,1);--ease-spring:cubic-bezier(.34,1.56,.64,1);
@keyframes kiln-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,var(--float-distance,-8px),0)}}
@keyframes kiln-breathe{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.85;transform:scale(1.06)}}
@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-iteration-count:1!important}}`;

  if (existsSync(PROJECT_CSS)) {
    return `svg{${tokens}}\n${readFileSync(PROJECT_CSS, 'utf8')}`;
  }
  return `svg{${tokens}}\n${MINIMAL_CSS}`;
}

const MINIMAL_CSS = `
.iso-panel{fill:var(--iso-paper);stroke:var(--iso-line);stroke-width:1.25;stroke-linejoin:round}
.iso-panel--plain{stroke-opacity:.55}
.iso-hair,.iso-accentline{fill:none;stroke:var(--iso-line);stroke-width:1.08;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:.42}
.iso-accentline{stroke:var(--iso-accent);stroke-opacity:1}
.iso-accent{fill:var(--iso-accent);stroke:none}
.iso-solid{fill:var(--iso-line)}
.iso-cube-left{fill:var(--iso-paper);stroke:var(--iso-line);stroke-width:1.13;stroke-linejoin:round}
.iso-cube-right{fill:#f2f2f2;stroke:var(--iso-line);stroke-width:1.13;stroke-linejoin:round}
.iso-cube-top{fill:var(--iso-line);stroke:var(--iso-line);stroke-width:1.13;stroke-linejoin:round}
.iso-grid path{fill:none;stroke:var(--iso-line);stroke-opacity:.28;stroke-width:1;stroke-dasharray:1.6 7;stroke-linecap:round}
.iso-shadow{fill:var(--iso-line);fill-opacity:.075}
.iso-float{animation:kiln-float var(--float-duration,8s) var(--ease-in-out) var(--float-delay,0s) infinite}
.iso-trace{fill:none;stroke:var(--iso-line);stroke-width:1.3;stroke-dasharray:2.5 4.5;stroke-linecap:round;opacity:.6;animation:iso-march 1.9s linear infinite;animation-delay:calc(var(--i,0) * -.55s)}
@keyframes iso-march{to{stroke-dashoffset:-14}}
.iso-node{fill:var(--iso-paper);stroke:var(--iso-line);stroke-width:1.2;animation:iso-node-pulse 3.2s var(--ease-in-out) infinite}
@keyframes iso-node-pulse{0%,100%{r:2.6;fill:var(--iso-paper)}50%{r:3.6;fill:var(--iso-accent)}}
.iso-packet{fill:var(--iso-accent);offset-rotate:0deg;animation:iso-packet 3.4s var(--ease-in-out) infinite;animation-delay:calc(var(--i,0) * -1.1s)}
@keyframes iso-packet{0%{offset-distance:0%;opacity:0}15%{opacity:1}85%{opacity:1}100%{offset-distance:100%;opacity:0}}
.iso-core{fill:var(--iso-accent);animation:kiln-breathe 3.2s var(--ease-in-out) infinite}
.iso-core-ring{fill:none;stroke:var(--iso-accent);stroke-width:1.2;stroke-opacity:.5;transform-box:fill-box;transform-origin:center;animation:core-ring 3.6s var(--ease-in-out) infinite}
@keyframes core-ring{0%,100%{transform:scale(.85);stroke-opacity:.45}50%{transform:scale(1.25);stroke-opacity:0}}
`;

/* -------------------------------------------------------------- validation */

const MOTION_CLASSES = new Set(['iso-float', 'iso-trace', 'iso-packet', 'iso-node', 'iso-core', 'iso-core-ring', 'iso-lens', 'iso-steam']);

function validate(scene) {
  const issues = [];
  const nodes = scene.nodes ?? [];
  if (!nodes.length) issues.push('scene has no nodes');

  const accents = nodes.filter((n) => n.type === 'trace' || n.type === 'spark' || n.core).length;
  const budget = Math.max(3, Math.ceil(nodes.length * 0.4));
  if (accents > budget) issues.push(`accent budget exceeded: ${accents} accent-bearing nodes (max ${budget})`);

  const [vx, vy, vw, vh] = scene.viewBox ?? [0, 0, 520, 400];
  const P = makeProjector({ scale: 1.3, ox: 258, oy: 300, ...(scene.camera ?? {}) });
  for (const [i, node] of nodes.entries()) {
    if (node.at) {
      const [x, y, z] = node.at;
      if (![x, y, z].every(Number.isFinite)) issues.push(`node ${i} (${node.type}): "at" must be three finite numbers`);
      const [sx, sy] = P(node.at);
      const pad = 0.28 * Math.max(vw, vh);
      if (sx < vx - pad || sx > vx + vw + pad || sy < vy - pad || sy > vy + vh + pad) {
        issues.push(`node ${i} (${node.type}): projects to (${sx}, ${sy}), outside the frame`);
      }
    }
    if (['panel', 'sheet', 'platform', 'block'].includes(node.type)) {
      if (!Array.isArray(node.size) || node.size.length !== 2 || !node.size.every(Number.isFinite)) {
        issues.push(`node ${i} (${node.type}): "size" must be [width, height]`);
      }
    }
    for (const key of ['className', 'class']) {
      if (node[key]) issues.push(`node ${i}: use built-in motion classes only (${[...MOTION_CLASSES].join(', ')})`);
    }
  }
  return issues;
}

/* --------------------------------------------------------------------- cli */

function parseArgs(argv) {
  const args = { out: null, check: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--scene') args.scene = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--check') args.check = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function resolveScene(id) {
  if (!id) return null;
  if (existsSync(id)) return id;
  const candidate = join(HERE, 'scenes', `${id}.json`);
  return existsSync(candidate) ? candidate : null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.scene) {
    console.log(`Usage: node iso-scene.mjs --scene <name|path> [--out file.svg] [--check]

Scenes live in ./scenes/*.json. Without --out the SVG is written to stdout.
--check validates the scene and exits 1 when the style rules are broken.`);
    process.exit(args.help ? 0 : 1);
  }

  const scenePath = resolveScene(args.scene);
  if (!scenePath) {
    console.error(`Scene not found: ${args.scene}`);
    process.exit(1);
  }

  const scene = JSON.parse(readFileSync(scenePath, 'utf8'));
  const issues = validate(scene);

  if (issues.length) {
    console.error(`✗ ${scenePath}`);
    issues.forEach((issue) => console.error(`  - ${issue}`));
    if (args.check) process.exit(1);
  }

  const svg = render(scene);

  if (args.out) {
    mkdirSync(dirname(resolve(args.out)), { recursive: true });
    writeFileSync(resolve(args.out), svg);
    console.error(`✓ ${args.out} (${(svg.length / 1024).toFixed(1)} kB)`);
  } else {
    process.stdout.write(svg);
  }

  if (args.check && !issues.length) console.error(`✓ ${scenePath} passes style checks`);
}

main();
