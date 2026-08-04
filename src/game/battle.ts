import type { Element } from '@/types/game';
import { getSpecies, getAbility, ABILITIES } from '@/data/species';
import { typeMultiplier } from '@/data/elements';
import { maxHpAtLevel, statAtLevel, xpForLevel } from '@/store/gameStore';

// ── Combatant ─────────────────────────────────────────────────────────────────

export type StatusCondition = 'none' | 'sleep' | 'confusion';

export interface StatStages {
  attack: number;
  defense: number;
  speed: number;
  spAtk: number;
  spDef: number;
}

export interface Combatant {
  speciesId: string;
  name: string;
  level: number;
  element: Element;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  specialAttack: number;
  specialDefense: number;
  abilities: string[];
  isPlayer: boolean;
  status: StatusCondition;
  stages: StatStages;
  // Boss passive tracking
  firstHitBlocked?: boolean;       // April
  signaturePriorityUsed?: boolean; // Roxy
  healTriggered?: boolean;         // Danny
}

export function createCombatant(
  speciesId: string,
  level: number,
  isPlayer: boolean,
  currentHpOverride?: number,
): Combatant | null {
  const species = getSpecies(speciesId);
  if (!species) return null;
  return {
    speciesId,
    name: species.name,
    level,
    element: species.element,
    maxHp: maxHpAtLevel(species.baseHp, level),
    currentHp: currentHpOverride ?? maxHpAtLevel(species.baseHp, level),
    attack: statAtLevel(species.baseAttack, level),
    defense: statAtLevel(species.baseDefense, level),
    speed: statAtLevel(species.baseSpeed, level),
    specialAttack: statAtLevel(species.baseSpecialAttack, level),
    specialDefense: statAtLevel(species.baseSpecialDefense, level),
    abilities: [...species.abilities],
    isPlayer,
    status: 'none',
    stages: { attack: 0, defense: 0, speed: 0, spAtk: 0, spDef: 0 },
  };
}

// ── Battle configuration ──────────────────────────────────────────────────────

export type BattleType = 'wild' | 'trainer' | 'guardian' | 'creator';

export interface BattleConfig {
  type: BattleType;
  enemySpeciesId: string;
  enemyLevel: number;
  enemyName?: string;
  guardianIndex?: number;
  gymId?: string;
  startingCreatureId?: string;
}

// ── Battle log entry ─────────────────────────────────────────────────────────

export interface LogEntry {
  text: string;
  type: 'info' | 'damage' | 'effectiveness' | 'critical' | 'miss' | 'status' | 'faint' | 'xp' | 'levelup';
}

// ── Damage calculation ────────────────────────────────────────────────────────

function stageMultiplier(stage: number): number {
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 - stage);
}

export interface DamageResult {
  damage: number;
  effectiveness: number;     // type multiplier
  isCritical: boolean;
  missed: boolean;
}

export function calculateDamage(
  attacker: Combatant,
  defender: Combatant,
  abilityName: string,
  isCritical: boolean,
): DamageResult {
  const ability = getAbility(abilityName);
  if (!ability) return { damage: 0, effectiveness: 1, isCritical: false, missed: true };

  // Accuracy check
  const hitRoll = Math.random() * 100;
  if (hitRoll > ability.accuracy) {
    return { damage: 0, effectiveness: 1, isCritical: false, missed: true };
  }

  // Non-damaging moves
  if (ability.power === 0) {
    return { damage: 0, effectiveness: 1, isCritical: false, missed: false };
  }

  // Determine physical vs special (simplified: Arcane/Tech = special, else physical)
  const isSpecial = ability.element === 'Arcane' || ability.element === 'Tech' || ability.element === 'Water';
  const atkStat = isSpecial
    ? attacker.specialAttack * stageMultiplier(isCritical ? Math.max(0, attacker.stages.spAtk) : attacker.stages.spAtk)
    : attacker.attack * stageMultiplier(isCritical ? Math.max(0, attacker.stages.attack) : attacker.stages.attack);
  const defStat = isSpecial
    ? defender.specialDefense * stageMultiplier(isCritical ? Math.min(0, defender.stages.spDef) : defender.stages.spDef)
    : defender.defense * stageMultiplier(isCritical ? Math.min(0, defender.stages.defense) : defender.stages.defense);

  // Base damage formula — /5 keeps it from collapsing; +level*2 ensures every
  // hit is meaningful and battles resolve in 3-6 turns at low level.
  const base = Math.floor(Math.floor((2 * attacker.level) / 5 + 2) * ability.power * atkStat / defStat) / 5 + attacker.level * 2;

  // Type effectiveness
  const effectiveness = typeMultiplier(ability.element, defender.element);

  // STAB (same type attack bonus)
  const stab = ability.element === attacker.element ? 1.5 : 1;

  // Critical multiplier
  const critMult = isCritical ? 1.5 : 1;

  // Random variance (0.85 - 1.0)
  const variance = 0.85 + Math.random() * 0.15;

  const damage = Math.max(1, Math.floor(base * effectiveness * stab * critMult * variance));

  return { damage, effectiveness, isCritical, missed: false };
}

// ── AI ─────────────────────────────────────────────────────────────────────────

export function chooseAIAction(ai: Combatant, player: Combatant): string {
  const usable = ai.abilities.filter((a) => {
    const ab = ABILITIES[a];
    return ab && ab.power > 0;
  });

  // If no damaging moves, just use first ability
  if (usable.length === 0) return ai.abilities[0];

  // Score each ability by expected damage
  let best = usable[0];
  let bestScore = -1;

  for (const name of usable) {
    const ability = ABILITIES[name];
    const effectiveness = typeMultiplier(ability.element, player.element);
    const stab = ability.element === ai.element ? 1.5 : 1;
    const score = ability.power * effectiveness * stab;
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }

  // 50% chance to pick a random move — keeps AI beatable for casual players
  if (Math.random() < 0.5 && usable.length > 1) {
    return usable[Math.floor(Math.random() * usable.length)];
  }

  return best;
}

// ── XP and leveling ─────────────────────────────────────────────────────────────

export function calculateXpReward(enemy: Combatant, isBoss: boolean): number {
  const base = Math.floor(enemy.level * 12 + 20);
  return isBoss ? base * 3 : base;
}

export function xpToNextLevel(currentLevel: number, currentXp: number): number {
  return xpForLevel(currentLevel) - currentXp;
}

// ── Boss passive hooks ─────────────────────────────────────────────────────────

export function applyBossPassiveOnDamage(
  defender: Combatant,
  damage: number,
  guardianIndex: number | undefined,
): { damage: number; message?: string } {
  if (guardianIndex === undefined) return { damage };

  // April (index 3): First hit blocked
  if (guardianIndex === 3 && !defender.firstHitBlocked) {
    defender.firstHitBlocked = true;
    return { damage: 0, message: "April's shield blocks the first hit!" };
  }

  return { damage };
}

export function applyBossPassiveOnHpDrop(
  combatant: Combatant,
  guardianIndex: number | undefined,
): { healed: number; message?: string } | null {
  if (guardianIndex === undefined) return null;

  // Danny (index 1): Heals 25% when below 40%
  if (guardianIndex === 1 && !combatant.healTriggered) {
    const threshold = combatant.maxHp * 0.4;
    if (combatant.currentHp <= threshold) {
      combatant.healTriggered = true;
      const heal = Math.floor(combatant.maxHp * 0.25);
      combatant.currentHp = Math.min(combatant.currentHp + heal, combatant.maxHp);
      return { healed: heal, message: `Danny's creature recovers ${heal} HP!` };
    }
  }

  return null;
}

export function getPriorityAbility(abilityName: string, guardianIndex: number | undefined, combatant: Combatant): boolean {
  // Roxy (index 0): Signature move goes first once
  if (guardianIndex === 0 && !combatant.signaturePriorityUsed) {
    const species = getSpecies(combatant.speciesId);
    if (species && abilityName === species.signatureMove) {
      combatant.signaturePriorityUsed = true;
      return true;
    }
  }
  // Aqua Jet always goes first
  const ability = getAbility(abilityName);
  if (ability && ability.name === 'Aqua Jet') return true;
  return false;
}

// ── Status effects (simplified) ─────────────────────────────────────────────────

export function tryApplyStatus(abilityName: string, target: Combatant): string | null {
  const ability = getAbility(abilityName);
  if (!ability || ability.power !== 0) return null;

  switch (abilityName) {
    case 'sporeCloud':
      if (target.status === 'none' && Math.random() < 0.25) {
        target.status = 'sleep';
        return `${target.name} fell asleep!`;
      }
      return null;
    case 'glitch':
      if (target.status === 'none' && Math.random() < 0.2) {
        target.status = 'confusion';
        return `${target.name} became confused!`;
      }
      return null;
    default:
      return null;
  }
}

export function tryApplyStatBuff(abilityName: string, user: Combatant): string | null {
  switch (abilityName) {
    case 'harden':
      user.stages.defense = Math.min(6, user.stages.defense + 1);
      return `${user.name}'s defense rose!`;
    case 'mistVeil':
      user.stages.defense = Math.min(6, user.stages.defense + 1);
      return `${user.name}'s defense rose!`;
    case 'tailwind':
      user.stages.speed = Math.min(6, user.stages.speed + 1);
      return `${user.name}'s speed rose!`;
    case 'polish':
      user.stages.speed = Math.min(6, user.stages.speed + 1);
      return `${user.name}'s speed rose!`;
    case 'ward':
      user.stages.spDef = Math.min(6, user.stages.spDef + 1);
      return `${user.name}'s special defense rose!`;
    case 'innovate':
      user.stages.spAtk = Math.min(6, user.stages.spAtk + 1);
      return `${user.name}'s special attack rose!`;
    case 'reboot': {
      // Restores 20% of max HP
      const restored = Math.floor(user.maxHp * 0.2);
      user.currentHp = Math.min(user.maxHp, user.currentHp + restored);
      return `${user.name} restored ${restored} HP!`;
    }
    case 'singe':
      // Debuffs the enemy — handled separately
      return null;
    default:
      return null;
  }
}

export function tryApplyStatDebuff(abilityName: string, target: Combatant): string | null {
  if (abilityName === 'singe' && Math.random() < 0.5) {
    target.stages.attack = Math.max(-6, target.stages.attack - 1);
    return `${target.name}'s attack fell!`;
  }
  return null;
}

export function canAct(combatant: Combatant): boolean {
  if (combatant.status === 'sleep') {
    if (Math.random() < 0.4) return false; // still asleep
    combatant.status = 'none';
    return true;
  }
  if (combatant.status === 'confusion') {
    if (Math.random() < 0.33) return false; // hurts self
    return true;
  }
  return true;
}

// ── Critical hit chance ─────────────────────────────────────────────────────────

export function rollCritical(): boolean {
  return Math.random() < 0.0625; // 1/16
}
