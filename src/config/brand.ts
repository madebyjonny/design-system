export const brand = {
  name: 'Kiln',
  legalName: 'Kiln Systems, Inc.',
  tagline: 'Fire for ideas.',
  positioning:
    'Kiln is the design and motion system for products that think. Warm, physical, and legible at any scale.',
  description:
    'The Kiln brand book: design tokens, CSS components, logo system, illustration language, motion principles, and real-world applications.',
  version: '1.0.0',
  year: new Date().getFullYear(),
} as const;

export const nav = [
  { label: 'Overview', href: '/' },
  { label: 'Foundations', href: '/foundations' },
  { label: 'Components', href: '/components' },
  { label: 'Logos', href: '/logos' },
  { label: 'Illustration', href: '/illustration' },
  { label: 'Motion', href: '/motion' },
  { label: 'In the world', href: '/applications' },
] as const;

export interface PaletteToken {
  name: string;
  token: string;
  hex: string;
  role: string;
  onDark?: boolean;
}

export const palette: { group: string; note: string; tokens: PaletteToken[] }[] = [
  {
    group: 'Neutral',
    note: 'The entire system. Twelve greys carry every surface and every piece of type: ink 1000 is text, paper 100 is the page, and every surface between is a step on the same ramp. Hue appears in exactly one place — a form field that is wrong.',
    tokens: [
      { name: 'Ink 1000', token: '--kiln-ink-1000', hex: '#090909', role: 'Primary text, the accent' },
      { name: 'Ink 900', token: '--kiln-ink-900', hex: '#111111', role: 'Dark sections' },
      { name: 'Ink 800', token: '--kiln-ink-800', hex: '#181818', role: 'Dark tiles' },
      { name: 'Slate 600', token: '--kiln-slate-600', hex: '#292929', role: 'Dark borders, wells' },
      { name: 'Grey 500', token: '--kiln-grey-500', hex: '#6F6F6F', role: 'Secondary + tertiary text' },
      { name: 'Grey 400', token: '--kiln-grey-400', hex: '#7D7D7D', role: 'Disabled, strong borders' },
      { name: 'Grey 300', token: '--kiln-grey-300', hex: '#ADADAD', role: 'Disabled, strong borders' },
      { name: 'Grey 200', token: '--kiln-grey-200', hex: '#D9D9D9', role: 'Control borders' },
      { name: 'Grey 100', token: '--kiln-grey-100', hex: '#EBEBEB', role: 'Dividers, card borders' },
      { name: 'Grey 75', token: '--kiln-grey-75', hex: '#F2F2F2', role: 'Sunken wells' },
      { name: 'Paper 50', token: '--kiln-paper-50', hex: '#FAFAFA', role: 'Subtle band, tile' },
      { name: 'Paper 100', token: '--kiln-paper-100', hex: '#FFFFFF', role: 'Page, cards' },
    ],
  },
];

export const typeScale = [
  { name: 'Display', token: '--text-display', size: 'clamp(3.25rem → 9rem)', use: 'Hero statements only' },
  { name: '6XL', token: '--text-6xl', size: 'clamp(3rem → 6rem)', use: 'Section openers' },
  { name: '5XL', token: '--text-5xl', size: 'clamp(2.5rem → 4.5rem)', use: 'Page titles' },
  { name: '4XL', token: '--text-4xl', size: 'clamp(2.125rem → 3.25rem)', use: 'Section headings' },
  { name: '3XL', token: '--text-3xl', size: 'clamp(1.75rem → 2.375rem)', use: 'Pull quotes, stats' },
  { name: '2XL', token: '--text-2xl', size: 'clamp(1.5rem → 1.875rem)', use: 'Card headlines' },
  { name: 'XL', token: '--text-xl', size: '1.3125rem', use: 'Subheads' },
  { name: 'LG', token: '--text-lg', size: '1.125rem', use: 'Lede paragraphs' },
  { name: 'MD', token: '--text-md', size: '1rem', use: 'Interface body' },
  { name: 'Base', token: '--text-base', size: '0.875rem', use: 'Dense UI, buttons' },
  { name: 'SM', token: '--text-sm', size: '0.8125rem', use: 'Captions, labels' },
  { name: '2XS', token: '--text-2xs', size: '0.6875rem', use: 'Eyebrows (mono, +0.14em)' },
];
