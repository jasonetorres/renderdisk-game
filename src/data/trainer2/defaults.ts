import type { TrainerAppearance, BodyId } from './types';

export const DEFAULTS_BY_BODY: Record<BodyId, Omit<TrainerAppearance, 'body'>> = {
  average: {
    top: 'top-av-vest',
    bottom: 'bottom-av-slacks',
    shoes: 'shoes-av-sneakers',
    head: 'head-oval',
    eyes: 'eyes-soft',
    faceAcc: null,
    hair: 'hair-crew-cut',
    headwear: null,
    hairFront: 'hair-front-crew-cut',
    skinTone: 'skin-3',
    hairColor: '#3d1f0e',
    topColor: '#1848c0',
    bottomColor: '#163068',
    bottomColor2: '#0a1040',
    version: 2,
  },
  small: {
    top: 'top-sm-vest',
    bottom: 'bottom-sm-slacks',
    shoes: 'shoes-sm-sneakers',
    head: 'head-oval',
    eyes: 'eyes-soft',
    faceAcc: null,
    hair: 'hair-crew-cut',
    headwear: null,
    hairFront: 'hair-front-crew-cut',
    skinTone: 'skin-3',
    hairColor: '#3d1f0e',
    topColor: '#1848c0',
    bottomColor: '#163068',
    bottomColor2: '#0a1040',
    version: 2,
  },
};

export function makeDefaultAppearance(body: BodyId): TrainerAppearance {
  return { body, ...DEFAULTS_BY_BODY[body] };
}
