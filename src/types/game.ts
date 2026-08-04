// Type definitions for every creature in RenderDisk.
// These are the immutable species templates — captured instances are
// derived from these and stored in the player's save file.

export type Element =
  | 'Nature'
  | 'Fire'
  | 'Water'
  | 'Wind'
  | 'Earth'
  | 'Steel'
  | 'Tech'
  | 'Arcane';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Boss' | 'Legendary';

export interface Ability {
  name: string;
  element: Element;
  power: number;
  accuracy: number;
  description: string;
}

export interface MonsterSpecies {
  id: string;            // RD-01 .. RD-20, RD-03/04/09/14 (bosses), RD-000 (final)
  name: string;
  element: Element;
  rarity: Rarity;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseSpecialAttack: number;
  baseSpecialDefense: number;
  abilities: string[];           // ability names
  signatureMove: string;
  description: string;
  sprite: string;                // emoji glyph used as placeholder pixel sprite
  spriteImage?: string;          // single creature image path (no card frame)
  cardImage?: string;            // card art image path (bosses/final boss)
  diskId: string;                 // the QR disk identifier
}

// A captured monster instance owned by the player.
export interface MonsterInstance {
  speciesId: string;
  nickname?: string;
  level: number;
  experience: number;
  currentHp: number;
  capturedAt: number;            // epoch ms
}

// Trainer sprites are now curated pixel-art layers composed from supplied PNG sheets.
// This replaces the old procedural CharacterSprite appearance system.
export type TrainerBodyId = 'average' | 'small';

export interface CharacterAppearance {
  body: TrainerBodyId;
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
  skinTone: string;
  hairColor: string;
  topColor: string;
  bottomColor: string;
  bottomColor2: string;
  version: 2;
}

export interface TrainerProfile {
  name: string;
  appearance: CharacterAppearance;
  version: 2;
  createdAt: number;
}

export type BadgeId = 'forest' | 'mountain' | 'ruins' | 'digital';

export type GymId = 'roxy' | 'danny' | 'francesco' | 'april';

export interface GymProgress {
  playerWins: number;
  bossDefeated: boolean;
}

export interface BattleRecord {
  id: string;
  date: number;
  opponent: string;
  result: 'win' | 'loss';
  monsterUsed: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number | null;
}

export interface GameState {
  version: number;
  trainer: TrainerProfile | null;
  // Map of speciesId -> instance. Presence means captured.
  collection: Record<string, MonsterInstance>;
  badges: BadgeId[];
  bossesDefeated: string[];     // species ids of defeated bosses
  creatorDefeated: boolean;
  battleHistory: BattleRecord[];
  battlesWon: number;
  gymProgress: Record<GymId, GymProgress>;
  achievements: Achievement[];
  inventory: {
    potions: number;
    rareDisks: number;
  };
  settings: GameSettings;
  tutorialComplete: boolean;
  starterDiskClaimed: boolean;
  pendingDiskCode: string | null;
  lastSavedAt: number;
}

export interface GameSettings {
  audioEnabled: boolean;
  musicVolume: number;          // 0..1
  sfxVolume: number;            // 0..1
  battleSpeed: 'slow' | 'normal' | 'fast';
  crtEffect: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  audioEnabled: true,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  battleSpeed: 'normal',
  crtEffect: true,
};
