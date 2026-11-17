/**
 * Generates the placeholder art that ships with the brand book.
 * Designed stand-ins: they read as brand while still announcing "image slot".
 * Run with: node scripts/make-placeholders.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const SANS = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Geist Mono', ui-monospace, Menlo, monospace";

const INK = '#090909';
const GREY5 = '#6f6f6f';
const GREY3 = '#adadad';
const GREY2 = '#d9d9d9';
const PAPER = '#ffffff';
const SIGNAL = '#090909';

const out = (p, svg) => {
  mkdirSync(p.split('/').slice(0, -1).join('/'), { recursive: true });
  writeFileSync(p, svg.trim() + '\n');
  console.log('wrote', p);
};

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function caption(w, h, text, color = GREY3) {
  return `
  <g>
    <line x1="20" y1="${h - 34}" x2="${w - 20}" y2="${h - 34}" stroke="${color}" stroke-width="1" stroke-dasharray="2 6" opacity="0.6"/>
    <text x="20" y="${h - 16}" font-family="${MONO}" font-size="9" letter-spacing="1.4" fill="${color}">${text.toUpperCase()}</text>
  </g>`;
}

/* ---------------------------------------------------------------- hero 4:5 -- */
{
  const w = 800, h = 1000;
  const rand = rng(11);
  let arcs = '';
  for (let i = 1; i <= 7; i++) {
    arcs += `<circle cx="400" cy="470" r="${90 + i * 58}" fill="none" stroke="${INK}" stroke-width="1" opacity="${(0.1 + i * 0.02).toFixed(2)}"/>`;
  }
  let specks = '';
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = 120 + rand() * 340;
    specks += `<circle cx="${(400 + Math.cos(a) * r).toFixed(0)}" cy="${(470 + Math.sin(a) * r * 0.82).toFixed(0)}" r="${(rand() * 1.8 + 0.6).toFixed(1)}" fill="${INK}" opacity="${(0.1 + rand() * 0.25).toFixed(2)}"/>`;
  }
  out(
    'public/brand/hero/placeholder-media-primary.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Placeholder: hero media, 4 by 5">
  <rect width="${w}" height="${h}" fill="#141414"/>
  <g>
    ${arcs.replace(INK, '#8f8f8f')}
    ${specks.replace(INK, '#ffffff')}
    <circle cx="400" cy="470" r="46" fill="${SIGNAL}"/>
  </g>
  <text x="400" y="946" text-anchor="middle" font-family="${MONO}" font-size="13" letter-spacing="2.6" fill="#6f6f6f">IMAGE SLOT · 4 : 5</text>
</svg>`
  );
}

/* --------------------------------------------------------------- hero 16:9 -- */
{
  const w = 960, h = 540;
  const rand = rng(21);
  let bars = '';
  for (let i = 0; i < 26; i++) {
    const x = 40 + i * 35;
    const bh = 40 + rand() * 300;
    const hot = i === 17;
    bars += `<rect x="${x}" y="${(h - 110 - bh).toFixed(0)}" width="14" height="${bh.toFixed(0)}" rx="4" fill="${hot ? SIGNAL : INK}" opacity="${hot ? 1 : (0.12 + rand() * 0.32).toFixed(2)}"/>`;
  }
  out(
    'public/brand/hero/placeholder-media-secondary.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Placeholder: hero media, 16 by 9">
  <rect width="${w}" height="${h}" fill="#f5f5f5"/>
  ${bars}
  <line x1="40" y1="${h - 110}" x2="${w - 40}" y2="${h - 110}" stroke="${INK}" stroke-opacity="0.14"/>
  <text x="40" y="76" font-family="${MONO}" font-size="11" letter-spacing="2.2" fill="${GREY5}">THROUGHPUT</text>
</svg>`
  );
}

/* --------------------------------------------------------- presentation ---- */
{
  const w = 1380, h = 600;
  out(
    'public/brand/applications/placeholder-presentation.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Placeholder: presentation slide">
  <rect width="${w}" height="${h}" fill="${PAPER}"/>
  <g font-family="${SANS}" font-weight="600" fill="${INK}" letter-spacing="-5">
    <text x="96" y="286" font-size="112">Your models,</text>
    <text x="96" y="392" font-size="112">in motion<span fill="${SIGNAL}">.</span></text>
  </g>
  <text x="100" y="458" font-family="${SANS}" font-size="26" fill="${GREY5}">Kiln · keynote opening slide</text>
  <rect x="96" y="120" width="88" height="6" fill="${INK}"/>
  <g transform="translate(880 190)">
    <rect width="400" height="220" rx="18" fill="#f2f2f2" stroke="${GREY2}"/>
    <rect x="30" y="34" width="150" height="13" rx="6.5" fill="${INK}" opacity="0.85"/>
    <rect x="30" y="66" width="250" height="10" rx="5" fill="${INK}" opacity="0.22"/>
    <rect x="30" y="90" width="200" height="10" rx="5" fill="${INK}" opacity="0.22"/>
    <rect x="30" y="140" width="110" height="36" rx="18" fill="${SIGNAL}"/>
    <circle cx="322" cy="158" r="28" fill="${INK}"/>
  </g>
  ${caption(w, h, 'image slot · presentation 2.3:1', GREY3)}
</svg>`
  );
}

/* --------------------------------------------------------------- stage ----- */
{
  const w = 1600, h = 800;
  out(
    'public/brand/applications/placeholder-stage.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Placeholder: stage backdrop">
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <g transform="translate(800 380) scale(2.6)" stroke="${PAPER}" stroke-width="3" fill="none" stroke-linejoin="round">
    <path d="M0 0 L-62 -36 L0 -72 L62 -36 Z" fill="${PAPER}"/>
    <path d="M-62 -36 L-62 36 L0 72 L62 36 L62 -36 M0 0 L0 72" opacity="0.55"/>
  </g>
  <text x="800" y="716" text-anchor="middle" font-family="${SANS}" font-size="64" font-weight="600" fill="${PAPER}" letter-spacing="-2">kiln</text>
  ${caption(w, h, 'image slot · stage backdrop 2:1', GREY5)}
</svg>`
  );
}

/* --------------------------------------------------------------- social ---- */
{
  const w = 1200, h = 630;
  out(
    'public/brand/social/placeholder-og.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Placeholder: open graph card">
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <text x="64" y="300" font-family="${SANS}" font-size="92" font-weight="600" fill="${PAPER}" letter-spacing="-4">The Kiln brand book</text>
  <text x="68" y="366" font-family="${SANS}" font-size="26" fill="${GREY3}">Monochrome system · one signal colour</text>
  <circle cx="${w - 90}" cy="90" r="46" fill="${SIGNAL}"/>
  <text x="68" y="556" font-family="${MONO}" font-size="16" letter-spacing="2.6" fill="${GREY5}">BRAND.KILN.AI</text>
</svg>`
  );
}

/* ---------------------------------------------------------- logo slots ---- */
{
  const slot = (name, ratio, w, h, inner) =>
    out(
      `public/brand/logos/placeholder-${name}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Logo placeholder: ${name}">
  <rect width="${w}" height="${h}" rx="10" fill="${PAPER}"/>
  <rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="9.5" fill="none" stroke="${SIGNAL}" stroke-opacity="0.4" stroke-dasharray="4 6"/>
  ${inner}
  <text x="${w / 2}" y="${h - 14}" text-anchor="middle" font-family="${MONO}" font-size="9" letter-spacing="1.8" fill="${GREY3}">LOGO SLOT · ${ratio}</text>
</svg>`
    );

  const mark = (cx, cy, s, color = INK, accent = SIGNAL) =>
    `<g transform="translate(${cx} ${cy}) scale(${s})" stroke="${color}" stroke-width="2.4" fill="none" stroke-linejoin="round" stroke-linecap="round">
      <path d="M0 -24 L-21 -13 L0 -2 L21 -13 Z" fill="${accent}" stroke="${accent}"/>
      <path d="M-21 -13 L-21 13 L0 24 L21 13 L21 -13"/>
      <path d="M0 -2 L0 24" opacity="0.45"/>
    </g>`;

  slot('primary', '3.2:1', 480, 150, `${mark(120, 72, 0.95)}<text x="190" y="90" font-family="${SANS}" font-weight="600" font-size="52" letter-spacing="-2" fill="${INK}">kiln</text>`);
  slot('wordmark', '3.6:1', 480, 132, `<text x="40" y="82" font-family="${SANS}" font-weight="600" font-size="58" letter-spacing="-2.4" fill="${INK}">kiln</text>`);
  slot('mark', '1:1', 160, 168, `${mark(80, 70, 1.05)}`);
  slot('mono', '3.2:1', 480, 150, `${mark(120, 72, 0.95, INK, INK)}<text x="190" y="90" font-family="${SANS}" font-weight="600" font-size="52" letter-spacing="-2" fill="${INK}">kiln</text>`);
}
