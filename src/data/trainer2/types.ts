export type BodyId = 'average' | 'small';

export type TrainerLayerCategory =
  | 'body'
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'head'
  | 'eyes'
  | 'faceAcc'       // glasses, sunglasses, mustache, beard, monocle
  | 'hair'
  | 'headwear'
  | 'hairFront'
  | 'hairBack'      // back-of-hair drawn behind body
  | 'hatBack'       // back of hat drawn behind body
  | 'hatMask'       // mask erasing hair under hat
  | 'hatBackMask';  // mask erasing hair-back under hat-back

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteOffset {
  x: number;
  y: number;
}

export interface TrainerLayerOption {
  id: string;
  label: string;
  category: TrainerLayerCategory;
  /** Vite asset import URL. */
  image: string;
  supportedBodies: BodyId[];
  /** Higher zIndex draws later. */
  zIndex: number;
  /** For spritesheets: source crop inside the image. */
  frame?: SpriteFrame;
  /** For paste/overlay on final canvas. */
  offset?: SpriteOffset;
  /** If true, hidden from UI pickers (auto-derived companion layers). */
  hidden?: boolean;
  /** Filter tags for UI ('masc', 'femme', 'any'). */
  tags?: string[];
}

export interface SkinTone {
  id: string;
  label: string;
  hex: string;
}

export interface ColorSwatch {
  id: string;
  label: string;
  hex: string;
}

export interface TrainerAppearance {
  body: BodyId;
  top: string;
  bottom: string;
  shoes: string;
  head: string;
  eyes: string;
  /** Face accessory id, or null for none. */
  faceAcc: string | null;
  hair: string;
  headwear: string | null;
  hairFront: string;
  /** Skin tone id from SKIN_TONES. */
  skinTone: string;
  /** Hair color hex (#rrggbb). */
  hairColor: string;
  /** Top (shirt) color hex. */
  topColor: string;
  /** Bottom (pants) primary color hex. */
  bottomColor: string;
  /** Bottom (pants) secondary/accent color hex. */
  bottomColor2: string;
  version: 2;
}

export interface TrainerProfileV2 {
  name: string;
  appearance: TrainerAppearance;
  version: 2;
  createdAt: number;
}
