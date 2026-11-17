/**
 * KILN — ASSET REGISTRY
 *
 * Every image on this site resolves through this file so that dropping a file
 * in the right place (or setting an env var) is all it takes to replace art.
 *
 * Resolution order for each slot:
 *   1. env var        — set it in .env, .env.local, or the shell (wins everywhere)
 *   2. drop-in file   — first existing file from the slot's candidate list in /public
 *   3. placeholder    — a generated stand-in shipped with the brand book
 *
 * Re-run (or just reload in dev) after adding a file: the registry is read at
 * build time, so the new URL is baked into the markup on the next request.
 */
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

export type AssetSource = 'env' | 'file' | 'placeholder';

export interface ResolvedAsset {
  /** URL ready for src / background-image / THREE.TextureLoader */
  url: string;
  /** Where the value came from — shown in the brand book's asset panel */
  source: AssetSource;
  /** Env var that overrides this slot */
  envKey: string;
  /** First drop-in path that would be picked up */
  dropIn: string;
  /** Human label + intent, used by the asset panel */
  label: string;
  ratio: string;
}

interface AssetSlot {
  label: string;
  envKey: string;
  dropIn: string;
  placeholder: string;
  ratio: string;
}

/* -------------------------------------------------------------------------- */
/*  .env parsing — no dependencies, works in dev and in CI                     */
/* -------------------------------------------------------------------------- */

function parseEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const ENV: Record<string, string | undefined> = {
  ...parseEnvFile(path.resolve(process.cwd(), '.env')),
  ...parseEnvFile(path.resolve(process.cwd(), '.env.local')),
  ...process.env,
};

/* -------------------------------------------------------------------------- */
/*  Slots                                                                     */
/* -------------------------------------------------------------------------- */

const SLOTS = {
  /* Logos — see /logos for the full lockup system */
  'logo.primary': {
    label: 'Primary lockup',
    envKey: 'PUBLIC_LOGO_PRIMARY',
    dropIn: 'brand/logos/primary.{svg,png,webp}',
    placeholder: '/brand/logos/placeholder-primary.svg',
    ratio: '3.2 : 1',
  },
  'logo.wordmark': {
    label: 'Wordmark',
    envKey: 'PUBLIC_LOGO_WORDMARK',
    dropIn: 'brand/logos/wordmark.{svg,png,webp}',
    placeholder: '/brand/logos/placeholder-wordmark.svg',
    ratio: '3.6 : 1',
  },
  'logo.mark': {
    label: 'Monogram / app icon',
    envKey: 'PUBLIC_LOGO_MARK',
    dropIn: 'brand/logos/mark.{svg,png,webp}',
    placeholder: '/brand/logos/placeholder-mark.svg',
    ratio: '1 : 1',
  },
  'logo.mono': {
    label: 'Mono lockup',
    envKey: 'PUBLIC_LOGO_MONO',
    dropIn: 'brand/logos/mono.{svg,png,webp}',
    placeholder: '/brand/logos/placeholder-mono.svg',
    ratio: '3.2 : 1',
  },

  /* Hero bento tiles */
  'hero.media.primary': {
    label: 'Hero tile — primary media',
    envKey: 'PUBLIC_HERO_MEDIA_PRIMARY',
    dropIn: 'brand/hero/media-primary.{jpg,jpeg,png,webp,avif,svg}',
    placeholder: '/brand/hero/placeholder-media-primary.svg',
    ratio: '4 : 5',
  },
  'hero.media.secondary': {
    label: 'Hero tile — secondary media',
    envKey: 'PUBLIC_HERO_MEDIA_SECONDARY',
    dropIn: 'brand/hero/media-secondary.{jpg,jpeg,png,webp,avif,svg}',
    placeholder: '/brand/hero/placeholder-media-secondary.svg',
    ratio: '16 : 9',
  },

  /* Real-world applications — these feed the THREE.js textures */
  'application.presentation': {
    label: 'Presentation slide',
    envKey: 'PUBLIC_PRESENTATION_IMAGE',
    dropIn: 'brand/applications/presentation.{jpg,jpeg,png,webp,avif,svg}',
    placeholder: '/brand/applications/placeholder-presentation.svg',
    ratio: '2.3 : 1',
  },
  'application.stage': {
    label: 'Stage backdrop',
    envKey: 'PUBLIC_STAGE_IMAGE',
    dropIn: 'brand/applications/stage.{jpg,jpeg,png,webp,avif,svg}',
    placeholder: '/brand/applications/placeholder-stage.svg',
    ratio: '2 : 1',
  },

  /* Social */
  'social.og': {
    label: 'Open Graph card',
    envKey: 'PUBLIC_OG_IMAGE',
    dropIn: 'brand/social/og.{jpg,jpeg,png,webp,avif,svg}',
    placeholder: '/brand/social/placeholder-og.svg',
    ratio: '1.91 : 1',
  },
} satisfies Record<string, AssetSlot>;

export type AssetKey = keyof typeof SLOTS;

const extensions = ['svg', 'png', 'webp', 'jpg', 'jpeg', 'avif'];

function candidatesFor(slot: AssetSlot): string[] {
  // Expand "{svg,png,webp}" style drop-in hints into real relative paths.
  const match = slot.dropIn.match(/^(.*)\.\{([^}]+)\}$/);
  const bases = match ? match[2].split(',').map((ext) => `${match[1]}.${ext}`) : [slot.dropIn];
  return bases.flatMap((base) => {
    const ext = path.extname(base).slice(1).toLowerCase();
    if (extensions.includes(ext)) return [base];
    return extensions.map((e) => `${base}.${e}`);
  });
}

function resolve(key: AssetKey): ResolvedAsset {
  const slot = SLOTS[key];
  const candidates = candidatesFor(slot);

  const envValue = ENV[slot.envKey];
  if (envValue) {
    return { url: envValue, source: 'env', envKey: slot.envKey, dropIn: candidates[0], label: slot.label, ratio: slot.ratio };
  }

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(PUBLIC_DIR, candidate))) {
      return { url: `/${candidate}`, source: 'file', envKey: slot.envKey, dropIn: candidate, label: slot.label, ratio: slot.ratio };
    }
  }

  return {
    url: slot.placeholder,
    source: 'placeholder',
    envKey: slot.envKey,
    dropIn: candidates[0],
    label: slot.label,
    ratio: slot.ratio,
  };
}

export const assets = Object.fromEntries(
  (Object.keys(SLOTS) as AssetKey[]).map((key) => [key, resolve(key)]),
) as Record<AssetKey, ResolvedAsset>;

/** Every slot, for the asset panel on /logos. */
export const assetManifest = (Object.keys(SLOTS) as AssetKey[]).map((key) => ({
  key,
  ...assets[key],
}));

/** Shorthand for `assets[key].url`. */
export function asset(key: AssetKey): string {
  return assets[key].url;
}

/** True when art is still the shipped placeholder. */
export function isPlaceholder(key: AssetKey): boolean {
  return assets[key].source === 'placeholder';
}
