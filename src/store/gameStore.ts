import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  GameState,
  GameSettings,
  TrainerProfile,
  MonsterInstance,
  BadgeId,
  GymId,
  BattleRecord,
  Achievement,
} from '@/types/game';
import { DEFAULT_SETTINGS } from '@/types/game';
import { getSpecies } from '@/data/species';

const SAVE_VERSION = 2;

// XP needed to reach the next level from the current level.
export function xpForLevel(level: number): number {
  return Math.floor(20 + level * level * 5);
}

// Stats at a given level, derived from base stats (simple growth model).
export function statAtLevel(base: number, level: number): number {
  return Math.floor(base + base * (level - 1) * 0.08 + level * 1.5);
}

export function maxHpAtLevel(base: number, level: number): number {
  return Math.floor(base + base * (level - 1) * 0.1 + level * 2);
}

interface StoreActions {
  setPendingDiskCode: (code: string | null) => void;
  createTrainer: (profile: TrainerProfile) => void;
  updateTrainer: (partial: Partial<TrainerProfile>) => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  captureMonster: (speciesId: string) => void;
  addExperience: (speciesId: string, xp: number) => void;
  healAll: () => void;
  addBadge: (badge: BadgeId) => void;
  markBossDefeated: (speciesId: string) => void;
  markCreatorDefeated: () => void;
  addBattleRecord: (record: Omit<BattleRecord, 'id' | 'date'>) => void;
  recordGymWin: (gymId: GymId) => void;
  markGymBossDefeated: (gymId: GymId, speciesId: string) => void;
  unlockAchievement: (id: string) => void;
  addPotion: (n: number) => void;
  spendPotion: () => void;
  applyPotionToMonster: (speciesId: string) => void;
  addRareDisk: (n: number) => void;
  completeTutorial: () => void;
  enableDemoMode: () => void;
  claimStarterDisk: (speciesId: string) => void;
  resetSave: () => void;
}

type Store = GameState & StoreActions;

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-capture', name: 'First Contact', description: 'Capture your first monster.', unlockedAt: null },
  { id: 'ten-monsters', name: 'Disk Collector', description: 'Capture 10 monsters.', unlockedAt: null },
  { id: 'full-binder', name: 'Complete Binder', description: 'Capture all 20 monsters.', unlockedAt: null },
  { id: 'first-badge', name: 'Badge of Honor', description: 'Defeat your first Guardian.', unlockedAt: null },
  { id: 'four-badges', name: 'Guardian Slayer', description: 'Defeat all 4 Guardians.', unlockedAt: null },
  { id: 'creator-fallen', name: 'The End', description: 'Defeat the Creator.', unlockedAt: null },
];

const EMPTY_GYM_PROGRESS: Record<GymId, { playerWins: number; bossDefeated: boolean }> = {
  roxy:      { playerWins: 0, bossDefeated: false },
  danny:     { playerWins: 0, bossDefeated: false },
  francesco: { playerWins: 0, bossDefeated: false },
  april:     { playerWins: 0, bossDefeated: false },
};

const initialState: GameState = {
  version: SAVE_VERSION,
  trainer: null,
  collection: {},
  badges: [],
  bossesDefeated: [],
  creatorDefeated: false,
  battleHistory: [],
  battlesWon: 0,
  gymProgress: { ...EMPTY_GYM_PROGRESS },
  achievements: ACHIEVEMENTS,
  inventory: { potions: 5, rareDisks: 0 },
  settings: DEFAULT_SETTINGS,
  tutorialComplete: false,
  starterDiskClaimed: false,
  pendingDiskCode: null,
  lastSavedAt: 0,
};

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPendingDiskCode: (code) => set({ pendingDiskCode: code }),

      createTrainer: (profile) =>
        set((s) => {
          return {
            trainer: profile,
            tutorialComplete: false,
            starterDiskClaimed: false,
            collection: { ...s.collection },
            inventory: {
              potions: initialState.inventory.potions,
              rareDisks: initialState.inventory.rareDisks,
            },
          };
        }),

      updateTrainer: (partial) =>
        set((s) => {
          if (!s.trainer) return s;
          return { trainer: { ...s.trainer, ...partial } };
        }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      captureMonster: (speciesId) => {
        const species = getSpecies(speciesId);
        if (!species) return;
        set((s) => {
          if (s.collection[speciesId]) return s; // already captured
          // RD-16 through RD-20 are the rare tier — start at level 6
          const LEVEL_SIX_STARTERS = new Set(['RD-16', 'RD-17', 'RD-18', 'RD-19', 'RD-20']);
          const startLevel = LEVEL_SIX_STARTERS.has(speciesId) ? 6 : 5;
          const instance: MonsterInstance = {
            speciesId,
            level: startLevel,
            experience: 0,
            currentHp: maxHpAtLevel(species.baseHp, startLevel),
            capturedAt: Date.now(),
          };
          const collection = { ...s.collection, [speciesId]: instance };
          const achievements = s.achievements.map((a) => {
            if (a.id === 'first-capture' && a.unlockedAt === null)
              return { ...a, unlockedAt: Date.now() };
            if (a.id === 'ten-monsters' && a.unlockedAt === null && Object.keys(collection).length >= 10)
              return { ...a, unlockedAt: Date.now() };
            if (a.id === 'full-binder' && a.unlockedAt === null && Object.keys(collection).length >= 20)
              return { ...a, unlockedAt: Date.now() };
            return a;
          });
          return { collection, achievements };
        });
      },

      addExperience: (speciesId, xp) =>
        set((s) => {
          const mon = s.collection[speciesId];
          if (!mon) return s;
          let { level, experience, currentHp } = mon;
          experience += xp;
          const species = getSpecies(speciesId)!;
          while (experience >= xpForLevel(level) && level < 99) {
            experience -= xpForLevel(level);
            level += 1;
            // Heal to full on level up.
            currentHp = maxHpAtLevel(species.baseHp, level);
          }
          return { collection: { ...s.collection, [speciesId]: { ...mon, level, experience, currentHp } } };
        }),

      healAll: () =>
        set((s) => {
          const collection = { ...s.collection };
          for (const [id, mon] of Object.entries(collection)) {
            const species = getSpecies(id);
            if (species) collection[id] = { ...mon, currentHp: maxHpAtLevel(species.baseHp, mon.level) };
          }
          return { collection };
        }),

      addBadge: (badge) =>
        set((s) =>
          s.badges.includes(badge) ? s : { badges: [...s.badges, badge] },
        ),

      markBossDefeated: (speciesId) =>
        set((s) => {
          if (s.bossesDefeated.includes(speciesId)) return s;
          const bossesDefeated = [...s.bossesDefeated, speciesId];
          const achievements = s.achievements.map((a) => {
            if (a.id === 'first-badge' && a.unlockedAt === null) return { ...a, unlockedAt: Date.now() };
            if (a.id === 'four-badges' && a.unlockedAt === null && bossesDefeated.length >= 4)
              return { ...a, unlockedAt: Date.now() };
            return a;
          });
          return { bossesDefeated, achievements };
        }),

      markCreatorDefeated: () =>
        set((s) => ({
          creatorDefeated: true,
          achievements: s.achievements.map((a) =>
            a.id === 'creator-fallen' && a.unlockedAt === null ? { ...a, unlockedAt: Date.now() } : a,
          ),
        })),

      addBattleRecord: (record) =>
        set((s) => ({
          battleHistory: [
            { ...record, id: crypto.randomUUID(), date: Date.now() },
            ...s.battleHistory,
          ].slice(0, 50),
          battlesWon: record.result === 'win' ? s.battlesWon + 1 : s.battlesWon,
        })),

      recordGymWin: (gymId: GymId) =>
        set((s) => {
          const existing = s.gymProgress?.[gymId] ?? { playerWins: 0, bossDefeated: false };
          return {
            gymProgress: {
              ...(s.gymProgress ?? EMPTY_GYM_PROGRESS),
              [gymId]: { ...existing, playerWins: existing.playerWins + 1 },
            },
          };
        }),

      markGymBossDefeated: (gymId: GymId, speciesId: string) =>
        set((s) => {
          const existing = s.gymProgress?.[gymId] ?? { playerWins: 0, bossDefeated: false };
          const gymProgress = {
            ...(s.gymProgress ?? EMPTY_GYM_PROGRESS),
            [gymId]: { ...existing, bossDefeated: true },
          };
          if (s.bossesDefeated.includes(speciesId)) return { gymProgress };
          const bossesDefeated = [...s.bossesDefeated, speciesId];
          const achievements = s.achievements.map((a) => {
            if (a.id === 'first-badge' && a.unlockedAt === null) return { ...a, unlockedAt: Date.now() };
            if (a.id === 'four-badges' && a.unlockedAt === null && bossesDefeated.length >= 4)
              return { ...a, unlockedAt: Date.now() };
            return a;
          });
          return { gymProgress, bossesDefeated, achievements };
        }),

      unlockAchievement: (id) =>
        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === id && a.unlockedAt === null ? { ...a, unlockedAt: Date.now() } : a,
          ),
        })),

      addPotion: (n) => set((s) => ({ inventory: { ...s.inventory, potions: s.inventory.potions + n } })),
      spendPotion: () => set((s) => ({ inventory: { ...s.inventory, potions: Math.max(0, s.inventory.potions - 1) } })),

      applyPotionToMonster: (speciesId) =>
        set((s) => {
          if (s.inventory.potions <= 0) return s;
          const mon = s.collection[speciesId];
          if (!mon) return s;
          const species = getSpecies(speciesId)!;
          const maxHp = maxHpAtLevel(species.baseHp, mon.level);
          const healed = Math.min(mon.currentHp + Math.floor(maxHp * 0.5), maxHp);
          return {
            inventory: { ...s.inventory, potions: s.inventory.potions - 1 },
            collection: { ...s.collection, [speciesId]: { ...mon, currentHp: healed } },
          };
        }),

      addRareDisk: (n) => set((s) => ({ inventory: { ...s.inventory, rareDisks: s.inventory.rareDisks + n } })),

      completeTutorial: () => set({ tutorialComplete: true }),

  enableDemoMode: () =>
    set((s) => ({
      battlesWon: 99,
      gymProgress: {
        roxy:      { playerWins: 99, bossDefeated: false },
        danny:     { playerWins: 99, bossDefeated: false },
        francesco: { playerWins: 99, bossDefeated: false },
        april:     { playerWins: 99, bossDefeated: false },
      },
      inventory: { ...s.inventory, potions: 10, rareDisks: 5 },
    })),

      claimStarterDisk: (speciesId) => {
        get().captureMonster(speciesId);
        set({ starterDiskClaimed: true });
      },

      resetSave: () => set({ ...initialState, settings: get().settings }),
    }),
    {
      name: 'renderdisk-save',
      storage: createJSONStorage(() => localStorage),
      version: SAVE_VERSION,
      migrate: (persisted: unknown, version) => {
        // Zustand persist hands us whatever was in storage.
        // We only migrate trainer profile shape; everything else should remain intact.
        if (!persisted || typeof persisted !== 'object') return persisted as unknown as Record<string, unknown>;
        const state = persisted as unknown as {
          version?: number;
          trainer?: unknown;
          [key: string]: unknown;
        };
        if (version >= 2) return state;

        const isValidName = (raw: unknown) => {
          if (typeof raw !== 'string') return false;
          const name = raw.trim();
          if (name.length < 1 || name.length > 12) return false;
          return /^[A-Za-z0-9 '\\-]+$/.test(name);
        };

        const oldTrainer = (state as { trainer?: unknown }).trainer as {
          name?: unknown;
          createdAt?: unknown;
          appearance?: { bodyType?: unknown } | null;
        } | null;

        const name = isValidName(oldTrainer?.name) ? String(oldTrainer?.name).trim() : '';

        // Map old bodyType (slim/average/athletic/stocky) to closest new body id.
        const oldBody = typeof oldTrainer?.appearance?.bodyType === 'string' ? oldTrainer.appearance.bodyType : undefined;
        const body = oldBody === 'slim' ? 'small' : 'average';

        const defaults =
          body === 'small'
            ? {
                body: 'small',
                top: 'top-sm-vest',
                bottom: 'bottom-sm-slacks',
                shoes: 'shoes-sm-simple',
              }
            : {
                body: 'average',
                top: 'top-av-vest',
                bottom: 'bottom-av-slacks',
                shoes: 'shoes-av-simple',
              };

        state.trainer = name
          ? {
              name,
              version: 2,
              createdAt: typeof oldTrainer?.createdAt === 'number' ? oldTrainer.createdAt : Date.now(),
              appearance: {
                ...defaults,
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
            }
          : null;

        state.version = 2;
        return state;
      },
    },
  ),
);

// ── Selectors / helpers ──────────────────────────────────────────────────────

export function capturedCount(state: GameState): number {
  return Object.keys(state.collection).length;
}

export const GYM_WIN_THRESHOLD = 5; // player wins needed to unlock gym boss

export const GYM_IDS: GymId[] = ['roxy', 'danny', 'francesco', 'april'];

export function getGymProgress(state: GameState, gymId: GymId) {
  return state.gymProgress?.[gymId] ?? { playerWins: 0, bossDefeated: false };
}

export function isGymBossUnlocked(state: GameState, gymId: GymId): boolean {
  return getGymProgress(state, gymId).playerWins >= GYM_WIN_THRESHOLD;
}

export function isGuardianUnlocked(state: GameState, guardianIndex: number): boolean {
  return isGymBossUnlocked(state, GYM_IDS[guardianIndex]);
}

// Keep for legacy imports
export const BOSS_UNLOCK_THRESHOLDS = [5, 5, 5, 5];

export function isCreatorUnlocked(state: GameState): boolean {
  return GYM_IDS.every((id) => getGymProgress(state, id).bossDefeated);
}
