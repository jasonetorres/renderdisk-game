// Tops / upper-body clothing. Conference-casual developer attire.
// Each top has a base color (from CLOTHING_COLORS) and an optional accent color.

import type { OptionItem } from './face';

export interface TopOption extends OptionItem {
  /** Whether this top has a hood drawn up */
  hooded?: boolean;
  /** Whether a collar is visible */
  collar?: boolean;
}

export const TOPS: TopOption[] = [
  { id: 'conferenceTee', label: 'Conference Tee' },
  { id: 'graphicTee',    label: 'Graphic Tee' },
  { id: 'zipHoodie',      label: 'Zip Hoodie',      hooded: false },
  { id: 'pulloverHoodie', label: 'Pullover Hoodie', hooded: true },
  { id: 'devHoodie',      label: 'Dev Hoodie',      hooded: true },
  { id: 'polo',           label: 'Polo',            collar: true },
  { id: 'henley',         label: 'Henley' },
  { id: 'buttonUp',       label: 'Button-Up',       collar: true },
  { id: 'flannel',        label: 'Flannel',         collar: true },
  { id: 'windbreaker',    label: 'Windbreaker' },
  { id: 'lightJacket',    label: 'Light Jacket' },
  { id: 'overshirt',      label: 'Overshirt',       collar: true },
];
