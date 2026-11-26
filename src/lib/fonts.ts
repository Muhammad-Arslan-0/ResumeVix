export interface FontOption {
  name: string;
  category: 'sans' | 'serif' | 'mono';
  googleParam: string;
}

export const CURATED_FONTS: FontOption[] = [
  { name: 'Inter', category: 'sans', googleParam: 'Inter:wght@400;500;600;700' },
  { name: 'Plus Jakarta Sans', category: 'sans', googleParam: 'Plus+Jakarta+Sans:wght@400;500;600;700' },
  { name: 'IBM Plex Sans', category: 'sans', googleParam: 'IBM+Plex+Sans:wght@400;500;600;700' },
  { name: 'DM Sans', category: 'sans', googleParam: 'DM+Sans:wght@400;500;700' },
  { name: 'Source Sans 3', category: 'sans', googleParam: 'Source+Sans+3:wght@400;600;700' },
  { name: 'Space Grotesk', category: 'sans', googleParam: 'Space+Grotesk:wght@400;500;700' },
  { name: 'Merriweather', category: 'serif', googleParam: 'Merriweather:wght@400;700' },
  { name: 'Lora', category: 'serif', googleParam: 'Lora:wght@400;600;700' },
  { name: 'Source Serif 4', category: 'serif', googleParam: 'Source+Serif+4:wght@400;600;700' },
  { name: 'Crimson Pro', category: 'serif', googleParam: 'Crimson+Pro:wght@400;600;700' },
  { name: 'Playfair Display', category: 'serif', googleParam: 'Playfair+Display:wght@600;700' },
  { name: 'JetBrains Mono', category: 'mono', googleParam: 'JetBrains+Mono:wght@400;600' },
];

export const ACCENT_PALETTES = [
  { name: 'Deep Teal', hex: '#0f766e' },
  { name: 'Midnight Slate', hex: '#0f172a' },
  { name: 'Royal Navy', hex: '#1e3a8a' },
  { name: 'Cobalt Blue', hex: '#2563eb' },
  { name: 'Academic Burgundy', hex: '#7c2d12' },
  { name: 'Forest Emerald', hex: '#065f46' },
  { name: 'Studio Violet', hex: '#7c3aed' },
  { name: 'Editorial Rose', hex: '#be185d' },
  { name: 'Charcoal', hex: '#18181b' },
];

export function buildGoogleFontsHref(fonts: string[]): string {
  const unique = Array.from(new Set(fonts.filter(Boolean)));
  const params = unique
    .map((f) => CURATED_FONTS.find((cf) => cf.name === f)?.googleParam)
    .filter(Boolean) as string[];
  if (params.length === 0) return '';
  return `https://fonts.googleapis.com/css2?${params.map((p) => `family=${p}`).join('&')}&display=swap`;
}
