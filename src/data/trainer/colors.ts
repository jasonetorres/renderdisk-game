// Color palettes for the trainer creator.
// All customization options reference colors from these ramps so the
// entire palette can be re-tinted from one place.

export interface ColorOption {
  id: string;
  label: string;
  hex: string;
}

// ── Skin tones (12 inclusive tones) ──────────────────────────────────────────
export const SKIN_TONES: ColorOption[] = [
  { id: 'porcelain', label: 'Porcelain', hex: '#f7e0d0' },
  { id: 'ivory',     label: 'Ivory',     hex: '#f0d0b8' },
  { id: 'fair',      label: 'Fair',      hex: '#e8c4a0' },
  { id: 'light',     label: 'Light',     hex: '#ddb088' },
  { id: 'medium',    label: 'Medium',    hex: '#c9956a' },
  { id: 'tan',       label: 'Tan',       hex: '#b88055' },
  { id: 'olive',     label: 'Olive',     hex: '#a87048' },
  { id: 'brown',     label: 'Brown',     hex: '#8a5a35' },
  { id: 'deep',      label: 'Deep',      hex: '#6f4528' },
  { id: 'espresso',  label: 'Espresso',  hex: '#553522' },
  { id: 'mahogany',  label: 'Mahogany',  hex: '#3f2818' },
  { id: 'ebony',     label: 'Ebony',     hex: '#2a1a10' },
];

// ── Hair colors (13) ─────────────────────────────────────────────────────────
export const HAIR_COLORS: ColorOption[] = [
  { id: 'black',      label: 'Black',      hex: '#1a1a1a' },
  { id: 'brown',      label: 'Brown',      hex: '#5c3a1e' },
  { id: 'darkBrown', label: 'Dark Brown',  hex: '#3a2410' },
  { id: 'blonde',     label: 'Blonde',      hex: '#d4a843' },
  { id: 'white',      label: 'White',       hex: '#e8e8e8' },
  { id: 'gray',       label: 'Gray',        hex: '#9a9a9a' },
  { id: 'red',        label: 'Red',          hex: '#a83232' },
  { id: 'pink',       label: 'Pink',        hex: '#e878a8' },
  { id: 'blue',       label: 'Blue',        hex: '#3b6ec5' },
  { id: 'green',      label: 'Green',       hex: '#4a9a5a' },
  { id: 'purple',     label: 'Purple',      hex: '#8a5ab5' },
  { id: 'orange',     label: 'Orange',      hex: '#d47a2a' },
  { id: 'silver',     label: 'Silver',      hex: '#c0c8d0' },
];

// ── Floppy disk shell colors (8) ────────────────────────────────────────────
export const FLOPPY_COLORS: ColorOption[] = [
  { id: 'black',       label: 'Black',       hex: '#1a1a2e' },
  { id: 'blue',        label: 'Blue',        hex: '#2a4a8a' },
  { id: 'green',       label: 'Green',       hex: '#2a7a4a' },
  { id: 'purple',      label: 'Purple',      hex: '#5a3a8a' },
  { id: 'orange',      label: 'Orange',      hex: '#c85a1a' },
  { id: 'red',         label: 'Red',          hex: '#a82828' },
  { id: 'transparent', label: 'Clear',        hex: '#a0c8d8' },
  { id: 'white',       label: 'White',       hex: '#e8e8e8' },
];

// ── Clothing color ramps (reused by tops, pants, shoes) ──────────────────────
export const CLOTHING_COLORS: ColorOption[] = [
  { id: 'forest',  label: 'Forest',  hex: '#3a7a4a' },
  { id: 'ember',   label: 'Ember',   hex: '#c85a1a' },
  { id: 'ocean',   label: 'Ocean',   hex: '#3b6ec5' },
  { id: 'gold',    label: 'Gold',    hex: '#c8960a' },
  { id: 'violet',  label: 'Violet',  hex: '#7b4fa6' },
  { id: 'rust',    label: 'Rust',    hex: '#a8453a' },
  { id: 'slate',   label: 'Slate',   hex: '#4a5a6a' },
  { id: 'cream',   label: 'Cream',   hex: '#d8c8a8' },
  { id: 'charcoal',label: 'Charcoal',hex: '#2a2a3a' },
  { id: 'rose',    label: 'Rose',    hex: '#c85a7a' },
  { id: 'teal',    label: 'Teal',    hex: '#2a8a8a' },
  { id: 'olive',   label: 'Olive',   hex: '#6a7a3a' },
];

export function getColor(list: ColorOption[], id: string): ColorOption {
  return list.find((c) => c.id === id) ?? list[0];
}
