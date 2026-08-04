import type { Ability, MonsterSpecies } from '@/types/game';
import type { GymId } from '@/types/game';

// ─── Ability library ─────────────────────────────────────────────────────────

export const ABILITIES: Record<string, Ability> = {
  // Nature
  vineLash:    { name: 'Vine Lash',    element: 'Nature', power: 35, accuracy: 100, description: 'Whips with thorned vines.' },
  leafBlade:   { name: 'Leaf Blade',   element: 'Nature', power: 55, accuracy: 95,  description: 'Sharp leaves slash the foe.' },
  sporeCloud:  { name: 'Spore Cloud',  element: 'Nature', power: 0,  accuracy: 85,  description: 'May put the foe to sleep.' },
  rootDrain:   { name: 'Root Drain',   element: 'Nature', power: 25, accuracy: 100, description: 'Drains HP from the foe.' },
  // Fire
  ember:       { name: 'Ember',        element: 'Fire',  power: 35, accuracy: 100, description: 'Flickers of flame.' },
  flameWheel:  { name: 'Flame Wheel',  element: 'Fire',  power: 50, accuracy: 95,  description: 'Charges wreathed in fire.' },
  flareBurst:  { name: 'Flare Burst',  element: 'Fire',  power: 65, accuracy: 90,  description: 'An erupting ball of fire.' },
  singe:       { name: 'Singe',        element: 'Fire',  power: 0,  accuracy: 90,  description: 'May lower the foe attack.' },
  // Water
  bubble:      { name: 'Bubble',       element: 'Water', power: 30, accuracy: 100, description: 'Stinging bubbles.' },
  tideCrash:   { name: 'Tide Crash',   element: 'Water', power: 55, accuracy: 95,  description: 'A crashing wave.' },
  aquaJet:     { name: 'Aqua Jet',     element: 'Water', power: 40, accuracy: 100, description: 'Always strikes first.' },
  mistVeil:    { name: 'Mist Veil',    element: 'Water', power: 0,  accuracy: 100, description: 'Raises own defense.' },
  // Wind
  gust:        { name: 'Gust',         element: 'Wind',  power: 35, accuracy: 100, description: 'A sharp gust of wind.' },
  cyclone:     { name: 'Cyclone',      element: 'Wind',  power: 55, accuracy: 90,  description: 'A spinning vortex.' },
  featherDart: { name: 'Feather Dart', element: 'Wind',  power: 45, accuracy: 100, description: 'Quick piercing feathers.' },
  tailwind:    { name: 'Tailwind',     element: 'Wind',  power: 0,  accuracy: 100, description: 'Raises own speed.' },
  // Earth
  pebble:      { name: 'Pebble Shot',  element: 'Earth', power: 30, accuracy: 100, description: 'Hurls small stones.' },
  rockThrow:   { name: 'Rock Throw',   element: 'Earth', power: 55, accuracy: 90,  description: 'A heavy boulder.' },
  quakeStomp:  { name: 'Quake Stomp',  element: 'Earth', power: 60, accuracy: 85,  description: 'Shakes the ground.' },
  harden:      { name: 'Harden',       element: 'Earth', power: 0,  accuracy: 100, description: 'Raises own defense.' },
  // Steel
  metalClaw:   { name: 'Metal Claw',   element: 'Steel', power: 45, accuracy: 100, description: 'Raking steel claws.' },
  ironHead:    { name: 'Iron Head',    element: 'Steel', power: 55, accuracy: 95,  description: 'A steel-plated headbutt.' },
  gearGrind:   { name: 'Gear Grind',   element: 'Steel', power: 60, accuracy: 90,  description: 'Crushing gears.' },
  polish:      { name: 'Polish',       element: 'Steel', power: 0,  accuracy: 100, description: 'Raises own speed.' },
  // Tech
  staticJolt:  { name: 'Static Jolt',  element: 'Tech',  power: 35, accuracy: 100, description: 'A jolt of current.' },
  dataBeam:    { name: 'Data Beam',    element: 'Tech',  power: 55, accuracy: 95,  description: 'A beam of raw data.' },
  glitch:      { name: 'Glitch',       element: 'Tech',  power: 50, accuracy: 80,  description: 'May confuse the foe.' },
  reboot:      { name: 'Reboot',       element: 'Tech',  power: 0,  accuracy: 100, description: 'Restores some HP.' },
  // Arcane
  spark:       { name: 'Spark',        element: 'Arcane', power: 40, accuracy: 100, description: 'A flicker of arcane light.' },
  hexBolt:     { name: 'Hex Bolt',     element: 'Arcane', power: 55, accuracy: 95,  description: 'A bolt of dark energy.' },
  arcaneSurge: { name: 'Arcane Surge', element: 'Arcane', power: 70, accuracy: 85,  description: 'A surge of raw power.' },
  ward:        { name: 'Ward',         element: 'Arcane', power: 0,  accuracy: 100, description: 'Raises own special defense.' },
  // Arcane / Innovation
  innovate:    { name: 'Innovate',     element: 'Arcane', power: 0,  accuracy: 100, description: 'Raises own special attack.' },
  designCut:   { name: 'Design Cut',   element: 'Arcane', power: 50, accuracy: 100, description: 'A precisely engineered strike.' },
  prototype:   { name: 'Prototype',    element: 'Arcane', power: 60, accuracy: 90,  description: 'Releases an experimental burst.' },
};

// ─── Species ─────────────────────────────────────────────────────────────────

export const SPECIES: MonsterSpecies[] = [
  // ── 20 normal monsters ─────────────────────────────────────────────────────
  { id:'RD-01', name:'Terrabo',   element:'Earth',  rarity:'Common',   baseHp:50,  baseAttack:55, baseDefense:38, baseSpeed:38, baseSpecialAttack:32,  baseSpecialDefense:42, abilities:['pebble','harden','rockThrow'], signatureMove:'rockThrow',  description:'A tough boar caked in mud and stone. It charges anything that blocks its path.',      sprite:'🐗', spriteImage:'/assets/images/creatures/01_terrabo.png',   cardImage:'/assets/images/creatures/01_terrabo_card.png',   diskId:'RD-01' },
  { id:'RD-02', name:'Voltix',    element:'Tech',   rarity:'Common',   baseHp:50,  baseAttack:45, baseDefense:30, baseSpeed:55, baseSpecialAttack:40,  baseSpecialDefense:35, abilities:['staticJolt','glitch','dataBeam'], signatureMove:'dataBeam',   description:'A fox pup crackling with electric energy. Its fur sparks with every step.',          sprite:'⚡', spriteImage:'/assets/images/creatures/02_voltix.png',    cardImage:'/assets/images/creatures/02_voltix_card.png',    diskId:'RD-02' },
  { id:'RD-03', name:'Aurora',    element:'Arcane', rarity:'Common',   baseHp:55,  baseAttack:35, baseDefense:40, baseSpeed:35, baseSpecialAttack:50,  baseSpecialDefense:45, abilities:['spark','ward','hexBolt'],   signatureMove:'hexBolt',    description:'A celestial deer wreathed in starlight. It leaves glowing hoofprints wherever it walks.', sprite:'✨', spriteImage:'/assets/images/creatures/03_aurora.png',    cardImage:'/assets/images/creatures/03_aurora_card.png',    diskId:'RD-03' },
  { id:'RD-04', name:'Tidalfin',  element:'Water',  rarity:'Common',   baseHp:40,  baseAttack:35, baseDefense:30, baseSpeed:60, baseSpecialAttack:45,  baseSpecialDefense:40, abilities:['bubble','aquaJet'],        signatureMove:'tideCrash',  description:'A small shark that leaps through shallow waves. It steers with its spotted fins.',    sprite:'🦈', spriteImage:'/assets/images/creatures/04_tidalfin.png',  cardImage:'/assets/images/creatures/04_tidalfin_card.png',  diskId:'RD-04' },
  { id:'RD-05', name:'Pyrax',     element:'Fire',   rarity:'Common',   baseHp:60,  baseAttack:40, baseDefense:55, baseSpeed:25, baseSpecialAttack:35,  baseSpecialDefense:45, abilities:['ember','singe','flameWheel'], signatureMove:'flameWheel', description:'A lava lizard with a fiery mane. It basks on volcanic rocks to recharge.',           sprite:'🔥', spriteImage:'/assets/images/creatures/05_pyrax.png',     cardImage:'/assets/images/creatures/05_pyrax_card.png',     diskId:'RD-05' },
  { id:'RD-06', name:'Leafquill', element:'Nature', rarity:'Uncommon', baseHp:55,  baseAttack:50, baseDefense:60, baseSpeed:30, baseSpecialAttack:40,  baseSpecialDefense:50, abilities:['vineLash','sporeCloud','leafBlade'], signatureMove:'leafBlade',  description:'A hedgehog blanketed in broad green leaves. It curls into a spiky leaf-ball when scared.', sprite:'🌿', spriteImage:'/assets/images/creatures/06_leafquill.png', cardImage:'/assets/images/creatures/06_leafquill_card.png', diskId:'RD-06' },
  { id:'RD-07', name:'Rocknel',   element:'Earth',  rarity:'Uncommon', baseHp:65,  baseAttack:65, baseDefense:65, baseSpeed:20, baseSpecialAttack:30,  baseSpecialDefense:45, abilities:['pebble','rockThrow','quakeStomp'], signatureMove:'quakeStomp', description:'A hulking tortoise armored in jagged stone slabs. It rarely moves but hits hard.',    sprite:'🪨', spriteImage:'/assets/images/creatures/07_rocknel.png',   cardImage:'/assets/images/creatures/07_rocknel_card.png',   diskId:'RD-07' },
  { id:'RD-08', name:'Buzzle',    element:'Nature', rarity:'Uncommon', baseHp:50,  baseAttack:40, baseDefense:40, baseSpeed:45, baseSpecialAttack:65,  baseSpecialDefense:55, abilities:['vineLash','rootDrain'],    signatureMove:'leafBlade',  description:'A cheerful honeybee with oversized wings. It pollinates flowers faster than the eye can follow.', sprite:'🐝', spriteImage:'/assets/images/creatures/08_buzzle.png',    cardImage:'/assets/images/creatures/08_buzzle_card.png',    diskId:'RD-08' },
  { id:'RD-09', name:'Cloudash',  element:'Wind',   rarity:'Uncommon', baseHp:65,  baseAttack:55, baseDefense:50, baseSpeed:60, baseSpecialAttack:55,  baseSpecialDefense:50, abilities:['gust','cyclone','tailwind'], signatureMove:'cyclone',  description:'A wolf pup wrapped in rolling clouds. It howls and a gust sweeps through the valley.', sprite:'🌬️', spriteImage:'/assets/images/creatures/09_cloudash.png',  cardImage:'/assets/images/creatures/09_cloudash_card.png',  diskId:'RD-09' },
  { id:'RD-10', name:'Whirli',    element:'Wind',   rarity:'Uncommon', baseHp:60,  baseAttack:60, baseDefense:40, baseSpeed:70, baseSpecialAttack:55,  baseSpecialDefense:40, abilities:['gust','featherDart','cyclone'], signatureMove:'cyclone', description:'A living tornado with a cheerful face. It spins endlessly and never seems to get dizzy.', sprite:'🌪️', spriteImage:'/assets/images/creatures/10_whirli.png',    cardImage:'/assets/images/creatures/10_whirli_card.png',    diskId:'RD-10' },
  { id:'RD-11', name:'Droplin',   element:'Water',  rarity:'Uncommon', baseHp:70,  baseAttack:45, baseDefense:55, baseSpeed:40, baseSpecialAttack:60,  baseSpecialDefense:60, abilities:['bubble','tideCrash','mistVeil'], signatureMove:'aquaJet', description:'A cheerful water droplet with a big personality. It bounces off surfaces without ever splashing.', sprite:'💧', spriteImage:'/assets/images/creatures/11_droplin.png',   cardImage:'/assets/images/creatures/11_droplin_card.png',   diskId:'RD-11' },
  { id:'RD-12', name:'Solbud',    element:'Nature', rarity:'Rare',     baseHp:55,  baseAttack:50, baseDefense:40, baseSpeed:75, baseSpecialAttack:60,  baseSpecialDefense:50, abilities:['vineLash','leafBlade','rootDrain'], signatureMove:'leafBlade', description:'A sunflower that grew legs and a smile. It always faces the light no matter the season.', sprite:'🌻', spriteImage:'/assets/images/creatures/12_solbud.png',    cardImage:'/assets/images/creatures/12_solbud_card.png',    diskId:'RD-12' },
  { id:'RD-13', name:'Honee',     element:'Nature', rarity:'Rare',     baseHp:80,  baseAttack:65, baseDefense:70, baseSpeed:30, baseSpecialAttack:45,  baseSpecialDefense:55, abilities:['vineLash','sporeCloud','rootDrain'], signatureMove:'leafBlade', description:'A plump bumblebee bursting with nectar. Flowers bloom wherever it rests.',         sprite:'🍯', spriteImage:'/assets/images/creatures/13_honee.png',     cardImage:'/assets/images/creatures/13_honee_card.png',     diskId:'RD-13' },
  { id:'RD-14', name:'Crystab',   element:'Steel',  rarity:'Rare',     baseHp:70,  baseAttack:65, baseDefense:75, baseSpeed:35, baseSpecialAttack:50,  baseSpecialDefense:60, abilities:['metalClaw','ironHead','polish'], signatureMove:'gearGrind', description:'A crystal gem with spider legs. It reflects light in all directions as it scuttles along.', sprite:'💎', spriteImage:'/assets/images/creatures/14_crystab.png',   cardImage:'/assets/images/creatures/14_crystab_card.png',   diskId:'RD-14' },
  { id:'RD-15', name:'Bouncer',   element:'Water',  rarity:'Rare',     baseHp:60,  baseAttack:45, baseDefense:50, baseSpeed:70, baseSpecialAttack:75,  baseSpecialDefense:55, abilities:['bubble','aquaJet','mistVeil'], signatureMove:'tideCrash', description:'A bouncy blue bunny that is always damp. It loves splashing in puddles and never stops hopping.', sprite:'🐰', spriteImage:'/assets/images/creatures/15_bouncer.png',   cardImage:'/assets/images/creatures/15_bouncer_card.png',   diskId:'RD-15' },
  { id:'RD-16', name:'Nibblit',   element:'Earth',  rarity:'Rare',     baseHp:65,  baseAttack:75, baseDefense:45, baseSpeed:55, baseSpecialAttack:50,  baseSpecialDefense:65, abilities:['pebble','harden','rockThrow','quakeStomp'], signatureMove:'quakeStomp', description:'A round little rabbit that digs through solid rock. Its teeth can gnaw through boulders.', sprite:'🐇', spriteImage:'/assets/images/creatures/16_nibblit.png',   cardImage:'/assets/images/creatures/16_nibblit_card.png',   diskId:'RD-16' },
  { id:'RD-17', name:'Mosswal',   element:'Nature', rarity:'Rare',     baseHp:75,  baseAttack:65, baseDefense:60, baseSpeed:50, baseSpecialAttack:70,  baseSpecialDefense:60, abilities:['vineLash','leafBlade','rootDrain'], signatureMove:'leafBlade', description:'A rolling ball of living moss adorned with tiny blossoms. Where it rests, a garden grows.', sprite:'🌳', spriteImage:'/assets/images/creatures/17_mosswal.png',   cardImage:'/assets/images/creatures/17_mosswal_card.png',   diskId:'RD-17' },
  { id:'RD-18', name:'Gloomper',  element:'Arcane', rarity:'Rare',     baseHp:70,  baseAttack:75, baseDefense:50, baseSpeed:65, baseSpecialAttack:70,  baseSpecialDefense:50, abilities:['spark','hexBolt','ward'], signatureMove:'arcaneSurge', description:'A dark caterpillar studded with glowing arcane gems. It munches on old spells for energy.', sprite:'🔮', spriteImage:'/assets/images/creatures/18_gloomper.png',  cardImage:'/assets/images/creatures/18_gloomper_card.png',  diskId:'RD-18' },
  { id:'RD-19', name:'Pingo',     element:'Water',  rarity:'Rare',     baseHp:85,  baseAttack:55, baseDefense:65, baseSpeed:45, baseSpecialAttack:75,  baseSpecialDefense:70, abilities:['bubble','tideCrash','aquaJet'], signatureMove:'tideCrash', description:'A starry-feathered penguin waddling with confidence. It slides across ice faster than it walks.', sprite:'🐧', spriteImage:'/assets/images/creatures/19_pingo.png',     cardImage:'/assets/images/creatures/19_pingo_card.png',     diskId:'RD-19' },
  { id:'RD-20', name:'Tadpol',    element:'Water',  rarity:'Rare',     baseHp:65,  baseAttack:70, baseDefense:50, baseSpeed:85, baseSpecialAttack:75,  baseSpecialDefense:55, abilities:['bubble','aquaJet','tideCrash'], signatureMove:'aquaJet', description:'A chubby little tadpole covered in spots. It wiggles its tail so fast it can leap clear out of the water.', sprite:'🐢', spriteImage:'/assets/images/creatures/20_tadpol.png',    cardImage:'/assets/images/creatures/20_tadpol_card.png',    diskId:'RD-20' },

  // ── Guardian boss creatures ────────────────────────────────────────────────
  { id:'RD-03B', name:'Elderbloom',  element:'Wind',   rarity:'Boss', baseHp:115, baseAttack:75, baseDefense:65, baseSpeed:90, baseSpecialAttack:85, baseSpecialDefense:70, abilities:['gust','cyclone','featherDart','tailwind'], signatureMove:'cyclone',    description:"Roxy's steed. A serpent of the endless sky that moves before thought.",      sprite:'🐉', spriteImage:'/assets/images/creatures/21_elderbloom.png', cardImage:'/assets/images/creatures/03_elderbloom_card.png', diskId:'RD-03B' },
  { id:'RD-09B', name:'Bytewing', element:'Tech',   rarity:'Boss', baseHp:130, baseAttack:90, baseDefense:80, baseSpeed:55, baseSpecialAttack:95, baseSpecialDefense:65, abilities:['staticJolt','dataBeam','glitch','reboot'], signatureMove:'dataBeam',   description:"April's steed. A digital raptor built from pure data — it processes faster than thought.",   sprite:'🦅', spriteImage:'/assets/images/creatures/22_bytewing.png', cardImage:'/assets/images/creatures/09_bytewing_card.png', diskId:'RD-09B' },
  { id:'RD-14B', name:'Forgefowl', element:'Fire',  rarity:'Boss', baseHp:140, baseAttack:90, baseDefense:85, baseSpeed:60, baseSpecialAttack:75, baseSpecialDefense:80, abilities:['ember','flameWheel','flareBurst','singe'], signatureMove:'flareBurst',   description:"Danny's steed. A hound of molten steel that charges without hesitation.",      sprite:'🐕', spriteImage:'/assets/images/creatures/23_forgefowl.png', cardImage:'/assets/images/creatures/23_forgefowl.png', diskId:'RD-14B' },
  { id:'RD-17B', name:'Granchix',   element:'Arcane', rarity:'Boss', baseHp:125, baseAttack:80, baseDefense:70, baseSpeed:75, baseSpecialAttack:95, baseSpecialDefense:75, abilities:['spark','designCut','prototype','innovate'], signatureMove:'prototype', description:"Francesco's steed. A deep-current leviathan that rewrites the tides.",      sprite:'🐙', spriteImage:'/assets/images/creatures/24_granchix.png', cardImage:'/assets/images/creatures/24_granchix.png', diskId:'RD-17B' },

  // ── Final boss creature ────────────────────────────────────────────────────
  { id:'RD-23', name:'Creatorius', element:'Arcane', rarity:'Legendary', baseHp:200, baseAttack:95, baseDefense:85, baseSpeed:80, baseSpecialAttack:110, baseSpecialDefense:90, abilities:['arcaneSurge','hexBolt','dataBeam','glitch'], signatureMove:'arcaneSurge', description:'The Creator\'s own monster. It is said to have written the others into being.', sprite:'👑', cardImage:'/assets/images/finalboss/jason_torres_finalboss_card.png', diskId:'RD-23' },
];

export const SPECIES_MAP: Record<string, MonsterSpecies> = Object.fromEntries(
  SPECIES.map((s) => [s.id, s]),
);

export const NORMAL_SPECIES  = SPECIES.filter((s) => s.rarity !== 'Boss' && s.rarity !== 'Legendary');
export const BOSS_SPECIES    = SPECIES.filter((s) => s.rarity === 'Boss');
export const FINAL_BOSS      = SPECIES.find((s) => s.rarity === 'Legendary')!;

// ── Guardian trainer metadata (matches card images exactly) ──────────────────

export type GuardianTheme = 'purple' | 'orange' | 'blue' | 'violet' | 'gold';

export interface Guardian {
  speciesId: string;
  trainerName: string;
  diskId: string;
  title: string;
  theme: GuardianTheme;
  passive: string;
  cardImage: string;
}

export const GUARDIANS: Guardian[] = [
  {
    speciesId: 'RD-03B',
    trainerName: 'Roxy',
    diskId: 'RD-03',
    title: 'Guardian of Creativity',
    theme: 'violet',
    passive: 'Signature move always goes first once per battle.',
    cardImage: '/assets/images/minibosses/roxy_card.png',
  },
  {
    speciesId: 'RD-14B',
    trainerName: 'Danny Thompson',
    diskId: 'RD-09',
    title: 'Guardian of Momentum',
    theme: 'orange',
    passive: 'Heals 25% HP when dropping below 40%.',
    cardImage: '/assets/images/minibosses/danny_thompson_card.png',
  },
  {
    speciesId: 'RD-17B',
    trainerName: 'Francesco Ciulla',
    diskId: 'RD-14',
    title: 'Guardian of Connection',
    theme: 'blue',
    passive: 'Potion effectiveness is halved.',
    cardImage: '/assets/images/minibosses/francesco_ciulla_card.png',
  },
  {
    speciesId: 'RD-09B',
    trainerName: 'April Gittens',
    diskId: 'RD-17',
    title: 'Guardian of Innovation',
    theme: 'purple',
    passive: 'First hit received each battle is blocked.',
    cardImage: '/assets/images/minibosses/april_gittens_card.png',
  },
];

export const CREATOR = {
  name: 'Jason Torres',
  title: 'The Creator',
  diskId: 'RD-23',
  speciesId: 'RD-23',
  cardImage: '/assets/images/finalboss/jason_torres_finalboss_card.png',
};

export interface GymDef {
  id: GymId;
  name: string;
  subtitle: string;
  description: string;
  accent: string;
  border: string;
  bg: string;
  glow: string;
  speciesPool: string[];
  guardianIndex: number;
}

export const GYMS: GymDef[] = [
  {
    id: 'roxy',
    name: "Roxy's Wind Gym",
    subtitle: 'Wind • Arcane',
    description: "Where creativity takes flight — Roxy's gym channels wild winds and arcane sparks.",
    accent: 'text-violet-400',
    border: 'border-violet-600',
    bg: 'bg-violet-900',
    glow: 'shadow-[0_0_18px_rgba(130,80,200,0.3)]',
    speciesPool: ['RD-09', 'RD-10', 'RD-03', 'RD-18', 'RD-12'],
    guardianIndex: 0,
  },
  {
    id: 'danny',
    name: "Danny's Fire Gym",
    subtitle: 'Fire • Earth',
    description: "Momentum forged in flame — Danny's gym is hot, relentless, and heavy as stone.",
    accent: 'text-ember-400',
    border: 'border-ember-600',
    bg: 'bg-ember-900',
    glow: 'shadow-[0_0_18px_rgba(200,85,30,0.3)]',
    speciesPool: ['RD-05', 'RD-01', 'RD-07', 'RD-16', 'RD-14'],
    guardianIndex: 1,
  },
  {
    id: 'francesco',
    name: "Francesco's Nature Gym",
    subtitle: 'Nature • Tech',
    description: "Connection runs deep — Francesco's gym weaves living roots with digital signals.",
    accent: 'text-forest-400',
    border: 'border-forest-600',
    bg: 'bg-forest-900',
    glow: 'shadow-[0_0_18px_rgba(74,124,58,0.3)]',
    speciesPool: ['RD-08', 'RD-17', 'RD-13', 'RD-06', 'RD-02'],
    guardianIndex: 2,
  },
  {
    id: 'april',
    name: "April's Water Gym",
    subtitle: 'Water',
    description: "Innovation flows freely — April's gym is built on the tides of deep-ocean ingenuity.",
    accent: 'text-ocean-400',
    border: 'border-ocean-600',
    bg: 'bg-ocean-900',
    glow: 'shadow-[0_0_18px_rgba(30,100,160,0.3)]',
    speciesPool: ['RD-04', 'RD-11', 'RD-19', 'RD-20', 'RD-15'],
    guardianIndex: 3,
  },
];

export function getSpecies(id: string): MonsterSpecies | undefined {
  return SPECIES_MAP[id];
}

export function getAbility(name: string): Ability | undefined {
  return ABILITIES[name];
}
