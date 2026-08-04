// Face configuration: eye shapes, eyebrows, smiles, glasses, facial hair.

export interface OptionItem {
  id: string;
  label: string;
}

export const EYE_SHAPES: OptionItem[] = [
  { id: 'round',    label: 'Round' },
  { id: 'almond',   label: 'Almond' },
  { id: 'wide',     label: 'Wide' },
  { id: 'narrow',   label: 'Narrow' },
  { id: 'sparkle',  label: 'Sparkle' },
  { id: 'sleepy',   label: 'Sleepy' },
  { id: 'determined', label: 'Determined' },
  { id: 'happy',    label: 'Happy' },
  { id: 'shy',      label: 'Shy' },
  { id: 'star',     label: 'Star' },
];

export const EYEBROW_SHAPES: OptionItem[] = [
  { id: 'normal',  label: 'Normal' },
  { id: 'raised',  label: 'Raised' },
  { id: 'angled',  label: 'Angled' },
  { id: 'thick',   label: 'Thick' },
  { id: 'thin',    label: 'Thin' },
  { id: 'curved',  label: 'Curved' },
  { id: 'flat',    label: 'Flat' },
  { id: 'high',    label: 'High' },
  { id: 'worried', label: 'Worried' },
  { id: 'bold',    label: 'Bold' },
];

export const SMILE_SHAPES: OptionItem[] = [
  { id: 'smile',    label: 'Smile' },
  { id: 'grin',     label: 'Grin' },
  { id: 'smirk',    label: 'Smirk' },
  { id: 'open',     label: 'Open' },
  { id: 'small',    label: 'Small' },
  { id: 'confident',label: 'Confident' },
];

export const GLASSES_STYLES: OptionItem[] = [
  { id: 'none',     label: 'None' },
  { id: 'round',    label: 'Round' },
  { id: 'rectangle',label: 'Rectangle' },
  { id: 'square',   label: 'Square' },
  { id: 'thick',    label: 'Thick' },
];

export const FACIAL_HAIR_STYLES: OptionItem[] = [
  { id: 'none',      label: 'None' },
  { id: 'mustache',   label: 'Mustache' },
  { id: 'goatee',     label: 'Goatee' },
  { id: 'shortBeard', label: 'Short Beard' },
  { id: 'fullBeard',  label: 'Full Beard' },
  { id: 'stubble',    label: 'Stubble' },
];

export const BODY_TYPES: OptionItem[] = [
  { id: 'slim',     label: 'Slim' },
  { id: 'average',  label: 'Average' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'stocky',   label: 'Stocky' },
];
