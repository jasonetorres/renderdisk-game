import type { SkinTone, ColorSwatch, TrainerLayerOption } from './types';
import { BODY_FRAME, HEAD_FRAME, HEAD_PASTE_OFFSET } from './constants';

// ── Glob imports (Vite resolves at build time) ──────────────────────────────
const bodyGlob        = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/body/*.png',         { eager: true });
const avTopGlob       = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/av-top/*.png',       { eager: true });
const smTopGlob       = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/sm-top/*.png',       { eager: true });
const avBottomGlob    = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/av-bottom/*.png',    { eager: true });
const smBottomGlob    = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/sm-bottom/*.png',    { eager: true });
const avShoesGlob     = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/av-shoes/*.png',     { eager: true });
const smShoesGlob     = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/sm-shoes/*.png',     { eager: true });
const headGlob        = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/head/*.png',          { eager: true });
const eyesGlob        = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/eyes/*.png',          { eager: true });
const hairGlob        = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/hair/*.png',          { eager: true });
const hairBackGlob    = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/hair-back/*.png',     { eager: true });
const hairFrontGlob   = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/hair-front/*.png',    { eager: true });
const hatGlob         = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/hat/*.png',           { eager: true });
const hatBackGlob     = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/hat-back/*.png',      { eager: true });
const hatMaskGlob     = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/hat-mask/*.png',      { eager: true });
const hatBackMaskGlob = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/hat-back-mask/*.png', { eager: true });
const faceAccGlob     = import.meta.glob<{ default: string }>('@/assets/trainers/sheets/face-acc/*.png',      { eager: true });

/** Lookup a PNG URL from a glob map by filename stem (no extension). */
function g(glob: Record<string, { default: string }>, stem: string): string {
  const entry = Object.entries(glob).find(([k]) => k.endsWith(`/${stem}.png`));
  return entry ? entry[1].default : '';
}

// ── Frame constants ─────────────────────────────────────────────────────────
const F48 = {
  x: BODY_FRAME.idle.col * BODY_FRAME.width,
  y: BODY_FRAME.idle.row * BODY_FRAME.height,
  width: BODY_FRAME.width,
  height: BODY_FRAME.height,
} as const;

const F32 = {
  x: HEAD_FRAME.southCol * HEAD_FRAME.width,
  y: 0,
  width: HEAD_FRAME.width,
  height: HEAD_FRAME.height,
} as const;

// ── Body ────────────────────────────────────────────────────────────────────
const bodyOptions: TrainerLayerOption[] = [
  { id: 'body-average', label: 'Average', category: 'body', image: g(bodyGlob, 'average-body'), supportedBodies: ['average'], zIndex: 0, frame: F48 },
  { id: 'body-small',   label: 'Small',   category: 'body', image: g(bodyGlob, 'small-body'),   supportedBodies: ['small'],   zIndex: 0, frame: F48 },
];

// ── Tops ────────────────────────────────────────────────────────────────────
const TOP_STYLES: { slug: string; label: string; tags?: string[] }[] = [
  { slug: 'vest',    label: 'Vest',    tags: ['any']   },
  { slug: 'blouse',  label: 'Blouse',  tags: ['femme'] },
  { slug: 'tee',     label: 'Tee',     tags: ['any']   },
  { slug: 'hoodie',  label: 'Hoodie',  tags: ['any']   },
  { slug: 'jacket',  label: 'Jacket',  tags: ['any']   },
  { slug: 'sweater', label: 'Sweater', tags: ['any']   },
];

const topOptions: TrainerLayerOption[] = TOP_STYLES.flatMap(({ slug, label, tags }) => [
  { id: `top-av-${slug}`, label, category: 'top' as const, image: g(avTopGlob, slug), supportedBodies: ['average'] as const, zIndex: 10, frame: F48, tags },
  { id: `top-sm-${slug}`, label, category: 'top' as const, image: g(smTopGlob, slug), supportedBodies: ['small']   as const, zIndex: 10, frame: F48, tags },
]);

// ── Bottoms ──────────────────────────────────────────────────────────────────
const BOTTOM_STYLES: { slug: string; label: string; tags?: string[] }[] = [
  { slug: 'slacks',  label: 'Slacks',  tags: ['any']   },
  { slug: 'shorts',  label: 'Shorts',  tags: ['any']   },
  { slug: 'jeans',   label: 'Jeans',   tags: ['any']   },
  { slug: 'joggers', label: 'Joggers', tags: ['any']   },
  { slug: 'skirt',   label: 'Skirt',   tags: ['femme'] },
];

const bottomOptions: TrainerLayerOption[] = BOTTOM_STYLES.flatMap(({ slug, label, tags }) => [
  { id: `bottom-av-${slug}`, label, category: 'bottom' as const, image: g(avBottomGlob, slug), supportedBodies: ['average'] as const, zIndex: 20, frame: F48, tags },
  { id: `bottom-sm-${slug}`, label, category: 'bottom' as const, image: g(smBottomGlob, slug), supportedBodies: ['small']   as const, zIndex: 20, frame: F48, tags },
]);

// ── Shoes ────────────────────────────────────────────────────────────────────
const SHOE_STYLES: { slug: string; label: string }[] = [
  { slug: 'simple',   label: 'Simple'   },
  { slug: 'boots',    label: 'Boots'    },
  { slug: 'sneakers', label: 'Sneakers' },
  { slug: 'sandals',  label: 'Sandals'  },
];

const shoeOptions: TrainerLayerOption[] = SHOE_STYLES.flatMap(({ slug, label }) => [
  { id: `shoes-av-${slug}`, label, category: 'shoes' as const, image: g(avShoesGlob, slug), supportedBodies: ['average'] as const, zIndex: 30, frame: F48 },
  { id: `shoes-sm-${slug}`, label, category: 'shoes' as const, image: g(smShoesGlob, slug), supportedBodies: ['small']   as const, zIndex: 30, frame: F48 },
]);

// ── Head shapes ──────────────────────────────────────────────────────────────
const headOptions: TrainerLayerOption[] = [
  { id: 'head-oval',   label: 'Oval',       category: 'head', image: g(headGlob, 'oval'),   supportedBodies: ['average', 'small'], zIndex: 100, frame: F32, offset: { ...HEAD_PASTE_OFFSET.average } },
  { id: 'head-round',  label: 'Round',      category: 'head', image: g(headGlob, 'round'),  supportedBodies: ['average', 'small'], zIndex: 100, frame: F32, offset: { ...HEAD_PASTE_OFFSET.average } },
  { id: 'head-square', label: 'Square Jaw', category: 'head', image: g(headGlob, 'square'), supportedBodies: ['average', 'small'], zIndex: 100, frame: F32, offset: { ...HEAD_PASTE_OFFSET.average } },
];

// ── Eyes ─────────────────────────────────────────────────────────────────────
const EYES_STYLES: { slug: string; label: string }[] = [
  { slug: 'determined', label: 'Determined' },
  { slug: 'soft',       label: 'Soft'       },
  { slug: 'narrow',     label: 'Narrow'     },
  { slug: 'hooded',     label: 'Hooded'     },
  { slug: 'menacing',   label: 'Menacing'   },
  { slug: 'feminine',   label: 'Feminine'   },
  { slug: 'vacant',     label: 'Vacant'     },
  { slug: 'cranky',     label: 'Cranky'     },
  { slug: 'tired',      label: 'Tired'      },
  { slug: 'lashes',     label: 'Lashes'     },
];

const eyesOptions: TrainerLayerOption[] = EYES_STYLES.map(({ slug, label }) => ({
  id: `eyes-${slug}`, label, category: 'eyes' as const,
  image: g(eyesGlob, slug),
  supportedBodies: ['average', 'small'] as const, zIndex: 110, frame: F32,
}));

// ── Face Accessories ─────────────────────────────────────────────────────────
const FACE_ACC_STYLES: { slug: string; label: string; tags?: string[] }[] = [
  { slug: 'glasses',    label: 'Glasses',    tags: ['any']  },
  { slug: 'sunglasses', label: 'Sunglasses', tags: ['any']  },
  { slug: 'mustache',   label: 'Mustache',   tags: ['masc'] },
  { slug: 'beard',      label: 'Beard',      tags: ['masc'] },
  { slug: 'monocle',    label: 'Monocle',    tags: ['any']  },
];

const faceAccOptions: TrainerLayerOption[] = [
  { id: 'face-acc-none', label: 'None', category: 'faceAcc', image: '', supportedBodies: ['average', 'small'], zIndex: 115, hidden: true },
  ...FACE_ACC_STYLES.map(({ slug, label, tags }) => ({
    id: `face-acc-${slug}`, label, category: 'faceAcc' as const,
    image: g(faceAccGlob, slug),
    supportedBodies: ['average', 'small'] as const, zIndex: 115, frame: F32, tags,
  })),
];

// ── Hair (main + back + front) ────────────────────────────────────────────────
const HAIR_STYLES: { slug: string; label: string; tags?: string[] }[] = [
  { slug: 'dragon-master',   label: 'Dragon Master',   tags: ['any']  },
  { slug: 'chic',            label: 'Chic',            tags: ['any']  },
  { slug: 'porcupine',       label: 'Porcupine',       tags: ['any']  },
  { slug: 'nest',            label: 'Nest',            tags: ['any']  },
  { slug: 'high-ponytail',   label: 'High Ponytail',   tags: ['femme']},
  { slug: 'mane',            label: 'Mane',            tags: ['any']  },
  { slug: 'silver-fox',      label: 'Silver Fox',      tags: ['masc'] },
  { slug: 'magnate',         label: 'Magnate',         tags: ['masc'] },
  { slug: 'receding',        label: 'Receding',        tags: ['masc'] },
  { slug: 'cowlick',         label: 'Cowlick',         tags: ['any']  },
  { slug: 'heli-pad',        label: 'Heli-Pad',        tags: ['masc'] },
  { slug: 'professional',    label: 'Professional',    tags: ['any']  },
  { slug: 'mop',             label: 'Mop',             tags: ['any']  },
  { slug: 'pigtails',        label: 'Pigtails',        tags: ['femme']},
  { slug: 'crew-cut',        label: 'Crew Cut',        tags: ['masc'] },
  { slug: 'flared-curtains', label: 'Flared Curtains', tags: ['any']  },
  { slug: 'dainty',          label: 'Dainty',          tags: ['femme']},
  { slug: 'geezer',          label: 'Geezer',          tags: ['masc'] },
  { slug: 'serene',          label: 'Serene',          tags: ['femme']},
  { slug: 'outta-my-face',   label: 'Outta My Face',   tags: ['any']  },
  { slug: 'rocker',          label: 'Rocker',          tags: ['any']  },
  { slug: 'disheveled',      label: 'Disheveled',      tags: ['any']  },
  { slug: 'pixie',           label: 'Pixie',           tags: ['femme']},
  { slug: 'closer',          label: 'Closer',          tags: ['any']  },
  { slug: 'bangs',           label: 'Bangs',           tags: ['femme']},
  { slug: 'pageant-queen',   label: 'Pageant Queen',   tags: ['femme']},
  { slug: 'pippi',           label: 'Pippi',           tags: ['femme']},
  { slug: 'prodigy',         label: 'Prodigy',         tags: ['any']  },
  { slug: 'framed',          label: 'Framed',          tags: ['any']  },
  { slug: 'afro',            label: 'Afro',            tags: ['any']  },
  { slug: 'raven',           label: 'Raven',           tags: ['femme']},
  { slug: 'waves',           label: 'Waves',           tags: ['any']  },
];

const hairOptions: TrainerLayerOption[] = HAIR_STYLES.flatMap(({ slug, label, tags }) => [
  { id: `hair-${slug}`,       label,                  category: 'hair'      as const, image: g(hairGlob,      slug), supportedBodies: ['average', 'small'] as const, zIndex: 120, frame: F32, tags },
  { id: `hair-back-${slug}`,  label: `${label} Back`,  category: 'hairBack'  as const, image: g(hairBackGlob,  slug), supportedBodies: ['average', 'small'] as const, zIndex: -10, frame: F32, hidden: true },
  { id: `hair-front-${slug}`, label: `${label} Front`, category: 'hairFront' as const, image: g(hairFrontGlob, slug), supportedBodies: ['average', 'small'] as const, zIndex: 140, frame: F32, hidden: true },
]);

// ── Headwear + companion layers ───────────────────────────────────────────────
const HAT_STYLES: { slug: string; label: string }[] = [
  { slug: 'fitted-front', label: 'Fitted (Front)' },
  { slug: 'fitted-back',  label: 'Fitted (Back)'  },
  { slug: 'fedora',       label: 'Fedora'          },
  { slug: 'durag',        label: 'Durag'           },
  { slug: 'crown',        label: 'Crown'           },
];

const hatOptions: TrainerLayerOption[] = [
  { id: 'headwear-none', label: 'None', category: 'headwear', image: '', supportedBodies: ['average', 'small'], zIndex: 130, hidden: true },
  ...HAT_STYLES.flatMap(({ slug, label }) => [
    { id: `headwear-${slug}`,      label,                   category: 'headwear'    as const, image: g(hatGlob,         slug), supportedBodies: ['average', 'small'] as const, zIndex: 130, frame: F32 },
    { id: `hat-back-${slug}`,      label: `${label} Back`,  category: 'hatBack'     as const, image: g(hatBackGlob,     slug), supportedBodies: ['average', 'small'] as const, zIndex: -5,  frame: F32, hidden: true },
    { id: `hat-mask-${slug}`,      label: `${label} Mask`,  category: 'hatMask'     as const, image: g(hatMaskGlob,     slug), supportedBodies: ['average', 'small'] as const, zIndex: 0,   frame: F32, hidden: true },
    { id: `hat-back-mask-${slug}`, label: `${label} BMask`, category: 'hatBackMask' as const, image: g(hatBackMaskGlob, slug), supportedBodies: ['average', 'small'] as const, zIndex: 0,   frame: F32, hidden: true },
  ]),
];

// ── Hair colors ──────────────────────────────────────────────────────────────
// Note: hair sprites use a blue-purple placeholder ramp — recolor is palette-swapped in trainerSprite.ts
export const HAIR_COLORS: ColorSwatch[] = [
  { id: 'hair-black',    label: 'Black',      hex: '#1a0e06' }, // warm near-black
  { id: 'hair-dbrown',   label: 'Dark Brown', hex: '#3d1f0e' },
  { id: 'hair-brown',    label: 'Brown',      hex: '#7a4020' },
  { id: 'hair-auburn',   label: 'Auburn',     hex: '#8b2e08' },
  { id: 'hair-ginger',   label: 'Ginger',     hex: '#c05020' },
  { id: 'hair-sandy',    label: 'Sandy',      hex: '#c09030' },
  { id: 'hair-blonde',   label: 'Blonde',     hex: '#d8b030' },
  { id: 'hair-platinum', label: 'Platinum',   hex: '#e8d888' },
  { id: 'hair-silver',   label: 'Silver',     hex: '#8898a8' },
  { id: 'hair-blue',     label: 'Blue',       hex: '#1030c0' },
  { id: 'hair-purple',   label: 'Purple',     hex: '#6010b0' },
  { id: 'hair-teal',     label: 'Teal',       hex: '#087878' },
  { id: 'hair-pink',     label: 'Pink',       hex: '#c01860' },
  { id: 'hair-green',    label: 'Green',      hex: '#186840' },
];

// ── Shirt colors ─────────────────────────────────────────────────────────────
export const SHIRT_COLORS: ColorSwatch[] = [
  { id: 'shirt-red',    label: 'Red',    hex: '#c02020' },
  { id: 'shirt-orange', label: 'Orange', hex: '#c86020' },
  { id: 'shirt-yellow', label: 'Yellow', hex: '#b8a010' },
  { id: 'shirt-green',  label: 'Green',  hex: '#207020' },
  { id: 'shirt-teal',   label: 'Teal',   hex: '#0c6868' },
  { id: 'shirt-blue',   label: 'Blue',   hex: '#1848c0' },
  { id: 'shirt-navy',   label: 'Navy',   hex: '#102068' },
  { id: 'shirt-purple', label: 'Purple', hex: '#5010a0' },
  { id: 'shirt-pink',   label: 'Pink',   hex: '#b81858' },
  { id: 'shirt-white',  label: 'White',  hex: '#d8d8d8' },
  { id: 'shirt-gray',   label: 'Gray',   hex: '#686868' },
  { id: 'shirt-black',  label: 'Black',  hex: '#282828' },
];

// ── Pant colors ───────────────────────────────────────────────────────────────
export const PANT_COLORS: ColorSwatch[] = [
  { id: 'pant-black',   label: 'Black',   hex: '#1e1e1e' },
  { id: 'pant-charcoal',label: 'Charcoal',hex: '#363636' },
  { id: 'pant-navy',    label: 'Navy',    hex: '#102060' },
  { id: 'pant-dblue',   label: 'Dark Blue',hex: '#163068' },
  { id: 'pant-brown',   label: 'Brown',   hex: '#5a3010' },
  { id: 'pant-khaki',   label: 'Khaki',   hex: '#8a7240' },
  { id: 'pant-gray',    label: 'Gray',    hex: '#5a5a60' },
  { id: 'pant-olive',   label: 'Olive',   hex: '#505030' },
  { id: 'pant-green',   label: 'Green',   hex: '#205030' },
  { id: 'pant-red',     label: 'Red',     hex: '#8a1818' },
  { id: 'pant-white',   label: 'White',   hex: '#d0d0d0' },
  { id: 'pant-tan',     label: 'Tan',     hex: '#a89060' },
];

// ── Skin tones ───────────────────────────────────────────────────────────────
export const SKIN_TONES: SkinTone[] = [
  { id: 'skin-1', label: 'Fair',         hex: '#f8d0b8' },
  { id: 'skin-2', label: 'Light',        hex: '#f8e0b8' },
  { id: 'skin-3', label: 'Medium Light', hex: '#c89060' },
  { id: 'skin-4', label: 'Medium',       hex: '#a88050' },
  { id: 'skin-5', label: 'Medium Dark',  hex: '#986860' },
  { id: 'skin-6', label: 'Dark',         hex: '#986840' },
  { id: 'skin-7', label: 'Deep',         hex: '#58402e' },
];

// ── Combined export ──────────────────────────────────────────────────────────
export const TRAINER_OPTIONS: TrainerLayerOption[] = [
  ...bodyOptions,
  ...topOptions,
  ...bottomOptions,
  ...shoeOptions,
  ...headOptions,
  ...faceAccOptions,
  ...eyesOptions,
  ...hairOptions,
  ...hatOptions,
];

export function getOptionsByCategory(category: TrainerLayerOption['category']) {
  return TRAINER_OPTIONS.filter((o) => o.category === category && !o.hidden);
}

export function getTopsForBody(body: 'average' | 'small') {
  return getOptionsByCategory('top').filter((o) => o.supportedBodies.includes(body));
}
export function getBottomsForBody(body: 'average' | 'small') {
  return getOptionsByCategory('bottom').filter((o) => o.supportedBodies.includes(body));
}
export function getShoesForBody(body: 'average' | 'small') {
  return getOptionsByCategory('shoes').filter((o) => o.supportedBodies.includes(body));
}
