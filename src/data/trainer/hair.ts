// Hairstyle configuration. Each id maps to a sprite-drawing function in the
// CharacterSprite component. Labels are shown in the creator UI.

export interface HairStyleOption {
  id: string;
  label: string;
}

export const HAIR_STYLES: HairStyleOption[] = [
  { id: 'short',       label: 'Short' },
  { id: 'messy',       label: 'Messy' },
  { id: 'sidePart',    label: 'Side Part' },
  { id: 'long',        label: 'Long' },
  { id: 'ponytail',    label: 'Ponytail' },
  { id: 'bun',         label: 'Bun' },
  { id: 'afro',        label: 'Afro' },
  { id: 'curly',       label: 'Curly' },
  { id: 'dreadlocks',  label: 'Dreadlocks' },
  { id: 'buzzCut',     label: 'Buzz Cut' },
  { id: 'undercut',    label: 'Undercut' },
  { id: 'bald',        label: 'Bald' },
  { id: 'mohawk',      label: 'Mohawk' },
  { id: 'bob',         label: 'Bob' },
  { id: 'pigtails',    label: 'Pigtails' },
  { id: 'wavy',        label: 'Wavy' },
  { id: 'topKnot',     label: 'Top Knot' },
  { id: 'shavedSides', label: 'Shaved Sides' },
  { id: 'cornrows',    label: 'Cornrows' },
  { id: 'page',        label: 'Page' },
];
