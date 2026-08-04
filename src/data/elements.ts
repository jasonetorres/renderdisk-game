import type { Element } from '@/types/game';

// Type effectiveness multiplier — attacker element vs defender element.
// 2.0 = super effective, 0.5 = not very effective, 0 = no effect, 1 = neutral.

const CHART: Partial<Record<Element, Partial<Record<Element, number>>>> = {
  Nature: { Water: 2, Fire: 0.5, Wind: 0.5, Steel: 0.5, Nature: 0.5 },
  Fire:   { Nature: 2, Steel: 2, Water: 0.5, Fire: 0.5, Earth: 0.5 },
  Water:  { Fire: 2, Earth: 2, Water: 0.5, Nature: 2, Tech: 1 },
  Wind:   { Nature: 2, Earth: 0.5, Steel: 0.5, Wind: 0.5 },
  Earth:  { Fire: 2, Steel: 2, Wind: 0.5, Earth: 0.5, Nature: 0.5 },
  Steel:  { Nature: 1, Fire: 0.5, Steel: 0.5, Earth: 1 },
  Tech:   { Water: 0.5, Arcane: 2, Steel: 1, Nature: 1 },
  Arcane: { Tech: 2, Arcane: 0.5, Nature: 1, Fire: 1 },
};

export function typeMultiplier(attacker: Element, defender: Element): number {
  return CHART[attacker]?.[defender] ?? 1;
}

export function effectivenessLabel(mult: number): string {
  if (mult === 0) return 'No effect...';
  if (mult >= 2) return 'Super effective!';
  if (mult >= 1.5) return 'Very effective!';
  if (mult <= 0.5) return 'Not very effective...';
  return '';
}

export const ELEMENTS: Element[] = ['Nature', 'Fire', 'Water', 'Wind', 'Earth', 'Steel', 'Tech', 'Arcane'];

export const ELEMENT_COLORS: Record<Element, { bg: string; text: string; border: string }> = {
  Nature: { bg: 'bg-forest-700', text: 'text-forest-200', border: 'border-forest-500' },
  Fire:   { bg: 'bg-ember-700',  text: 'text-ember-200',  border: 'border-ember-500' },
  Water:  { bg: 'bg-ocean-700',  text: 'text-ocean-200',  border: 'border-ocean-500' },
  Wind:   { bg: 'bg-parchment-600', text: 'text-parchment-100', border: 'border-parchment-400' },
  Earth:  { bg: 'bg-gold-800',  text: 'text-gold-200',  border: 'border-gold-600' },
  Steel:  { bg: 'bg-ink-500',   text: 'text-ink-100',   border: 'border-ink-300' },
  Tech:   { bg: 'bg-ocean-600', text: 'text-ocean-200', border: 'border-ocean-400' },
  Arcane: { bg: 'bg-rust-700',  text: 'text-rust-200',  border: 'border-rust-500' },
};
