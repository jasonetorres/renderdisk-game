import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Swords, FlaskRound, RefreshCw, LogOut } from 'lucide-react';
import { useGameStore, maxHpAtLevel, xpForLevel } from '@/store/gameStore';
import { emitGameEvent } from '@/lib/gameEvents';
import { audio, useSfx } from '@/audio/engine';
import { getSpecies, getAbility, GUARDIANS, CREATOR } from '@/data/species';
import { effectivenessLabel, typeMultiplier } from '@/data/elements';
import {
  createCombatant,
  calculateDamage,
  chooseAIAction,
  calculateXpReward,
  applyBossPassiveOnDamage,
  applyBossPassiveOnHpDrop,
  getPriorityAbility,
  tryApplyStatus,
  tryApplyStatBuff,
  tryApplyStatDebuff,
  canAct,
  rollCritical,
  type Combatant,
  type LogEntry,
  type BattleConfig,
} from '@/game/battle';
import { PixelButton, PixelText, BodyText, PixelPanel, HealthBar, ElementTag, XpBar } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Phase = 'boss-intro' | 'vs-flash' | 'intro' | 'menu' | 'ability-select' | 'item-select' | 'swap-select' | 'animating' | 'victory' | 'defeat';

interface FloatingText {
  id: number;
  text: string;
  color: string;
  target: 'player' | 'enemy';
}

export function Battle() {
  const navigate = useNavigate();
  const location = useLocation();
  const sfx = useSfx();

  const config = (location.state as BattleConfig | null);
  const collection = useGameStore((s) => s.collection);
  const addExperience = useGameStore((s) => s.addExperience);
  const captureMonster = useGameStore((s) => s.captureMonster);
  const markGymBossDefeated = useGameStore((s) => s.markGymBossDefeated);
  const recordGymWin = useGameStore((s) => s.recordGymWin);
  const markCreatorDefeated = useGameStore((s) => s.markCreatorDefeated);
  const addBattleRecord = useGameStore((s) => s.addBattleRecord);
  const addBadge = useGameStore((s) => s.addBadge);
  const applyPotionToMonster = useGameStore((s) => s.applyPotionToMonster);
  const spendPotion = useGameStore((s) => s.spendPotion);
  const potions = useGameStore((s) => s.inventory.potions);
  const battleSpeed = useGameStore((s) => s.settings.battleSpeed);
  const myTrainerName = useGameStore((s) => s.trainer?.name ?? 'Unknown');

  const [player, setPlayer] = useState<Combatant | null>(null);
  const [enemy, setEnemy] = useState<Combatant | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [screenFlash, setScreenFlash] = useState(false);
  const [shakeTarget, setShakeTarget] = useState<'player' | 'enemy' | null>(null);
  const [leveledUpTo, setLeveledUpTo] = useState<number | null>(null);
  const [captureFlash, setCaptureFlash] = useState(false);
  const floatIdRef = useRef(0);
  // StrictMode guard — prevents double-init (duplicate log) in dev
  const battleInitRef = useRef(false);

  const speedMs = battleSpeed === 'fast' ? 400 : battleSpeed === 'slow' ? 1200 : 800;

  // Initialize battle
  useEffect(() => {
    if (!config) {
      navigate('/world');
      return;
    }
    audio.playMusic(config.type === 'creator' ? 'finalboss' : config.type === 'guardian' ? 'boss' : 'battle');

    const collectionIds = Object.keys(collection);
    if (collectionIds.length === 0) {
      navigate('/world');
      return;
    }
    // Use the selected creature (from creature-select modal) or fall back to first healthy, then any
    const startId = config.startingCreatureId
      ?? collectionIds.find(id => (collection[id]?.currentHp ?? 0) > 0)
      ?? collectionIds[0];
    const mon = collection[startId];
    const playerCombatant = createCombatant(startId, mon.level, true, mon.currentHp);
    const enemyCombatant = createCombatant(config.enemySpeciesId, config.enemyLevel, false);
    if (!playerCombatant || !enemyCombatant) {
      navigate('/world');
      return;
    }
    setPlayer(playerCombatant);
    setEnemy(enemyCombatant);

    const isBoss = config.type === 'guardian' || config.type === 'creator';

    if (isBoss) {
      // VS flash → boss cutscene
      setPhase('vs-flash');
      return;
    }

    // Wild battle: VS flash → menu
    if (!battleInitRef.current) {
      battleInitRef.current = true;
      addLog({ text: `A wild ${enemyCombatant.name} appeared!`, type: 'info' });
    }
    setPhase('vs-flash');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const addLog = useCallback((entry: LogEntry) => {
    setLog((l) => [...l.slice(-4), entry]);
  }, []);

  // VS flash: 1.4s → boss-intro (for bosses) or menu (for wild)
  useEffect(() => {
    if (phase !== 'vs-flash') return;
    const isBoss = config?.type === 'guardian' || config?.type === 'creator';
    const t = setTimeout(() => setPhase(isBoss ? 'boss-intro' : 'menu'), 1400);
    return () => clearTimeout(t);
  }, [phase, config]);

  // Auto-dismiss boss intro after 4s
  useEffect(() => {
    if (phase !== 'boss-intro') return;
    const t = setTimeout(() => setPhase('menu'), 4000);
    return () => clearTimeout(t);
  }, [phase]);

  const addFloat = useCallback((text: string, color: string, target: 'player' | 'enemy') => {
    const id = floatIdRef.current++;
    setFloatingTexts((f) => [...f, { id, text, color, target }]);
    setTimeout(() => setFloatingTexts((f) => f.filter((ft) => ft.id !== id)), 1200);
  }, []);

  // ── Execute a turn ──────────────────────────────────────────────────────────

  const executeTurn = useCallback(
    async (playerAbility: string) => {
      if (!player || !enemy) return;
      setPhase('animating');

      const enemyAbility = chooseAIAction(enemy, player);
      const playerPriority = getPriorityAbility(playerAbility, undefined, player);
      const enemyPriority = getPriorityAbility(enemyAbility, config?.guardianIndex, enemy);

      const playerFirst = playerPriority && !enemyPriority
        ? true
        : enemyPriority && !playerPriority
        ? false
        : player.speed >= enemy.speed;

      const order: Array<{ combatant: Combatant; ability: string; isPlayer: boolean }> = playerFirst
        ? [{ combatant: player, ability: playerAbility, isPlayer: true }, { combatant: enemy, ability: enemyAbility, isPlayer: false }]
        : [{ combatant: enemy, ability: enemyAbility, isPlayer: false }, { combatant: player, ability: playerAbility, isPlayer: true }];

      let playerHp = player.currentHp;
      let enemyHp = enemy.currentHp;
      let playerFainted = false;
      let enemyFainted = false;

      for (const turn of order) {
        if (playerFainted || enemyFainted) break;
        const attacker = turn.combatant;
        const defender = turn.isPlayer ? enemy : player;
        const abilityName = turn.ability;
        const ability = getAbility(abilityName);
        if (!ability) continue;

        // Check if attacker can act
        if (!canAct(attacker)) {
          addLog({ text: `${attacker.name} can't move!`, type: 'status' });
          await sleep(speedMs);
          continue;
        }

        addLog({ text: `${attacker.name} used ${ability.name}!`, type: 'info' });
        sfx.hit();

        // Non-damaging move
        if (ability.power === 0) {
          const statusMsg = tryApplyStatus(abilityName, defender);
          if (statusMsg) addLog({ text: statusMsg, type: 'status' });
          const buffMsg = tryApplyStatBuff(abilityName, attacker);
          if (buffMsg) addLog({ text: buffMsg, type: 'status' });
          const debuffMsg = tryApplyStatDebuff(abilityName, defender);
          if (debuffMsg) addLog({ text: debuffMsg, type: 'status' });
          await sleep(speedMs);
          continue;
        }

        // Damaging move
        const isCrit = rollCritical();
        const result = calculateDamage(attacker, defender, abilityName, isCrit);

        if (result.missed) {
          addLog({ text: `${attacker.name}'s attack missed!`, type: 'miss' });
          await sleep(speedMs);
          continue;
        }

        let dmg = result.damage;

        // Boss passive: April blocks first hit
        if (!turn.isPlayer && config?.guardianIndex === 3) {
          // player attacking enemy — handled below for player turns
        }
        if (turn.isPlayer) {
          const passive = applyBossPassiveOnDamage(defender, dmg, config?.guardianIndex);
          if (passive.message) {
            addLog({ text: passive.message, type: 'status' });
            sfx.error();
          }
          dmg = passive.damage;
        }

        if (dmg > 0) {
          if (isCrit) {
            sfx.critical();
            setScreenFlash(true);
            setTimeout(() => setScreenFlash(false), 300);
            addLog({ text: 'A critical hit!', type: 'critical' });
          }
          const effLabel = effectivenessLabel(result.effectiveness);
          if (effLabel) addLog({ text: effLabel, type: 'effectiveness' });

          // Apply damage
          if (turn.isPlayer) {
            enemyHp = Math.max(0, enemyHp - dmg);
            setEnemy((e) => e ? { ...e, currentHp: enemyHp } : e);
            setShakeTarget('enemy');
            addFloat(`-${dmg}`, isCrit ? 'text-gold-400' : 'text-rust-400', 'enemy');
            addLog({ text: `${enemy.name} HP: ${enemyHp}/${enemy.maxHp}`, type: 'damage' });
          } else {
            playerHp = Math.max(0, playerHp - dmg);
            setPlayer((p) => p ? { ...p, currentHp: playerHp } : p);
            setShakeTarget('player');
            addFloat(`-${dmg}`, isCrit ? 'text-gold-400' : 'text-rust-400', 'player');
            addLog({ text: `${player.name} HP: ${playerHp}/${player.maxHp}`, type: 'damage' });
          }
          setTimeout(() => setShakeTarget(null), 400);
          await sleep(speedMs);

          // Boss passive: Danny heals below 40%
          if (!turn.isPlayer) {
            const heal = applyBossPassiveOnHpDrop({ ...defender, currentHp: enemyHp }, config?.guardianIndex);
            if (heal?.message) {
              addLog({ text: heal.message, type: 'status' });
              enemyHp = Math.min(enemy.maxHp, enemyHp + heal.healed);
              setEnemy((e) => e ? { ...e, currentHp: enemyHp } : e);
              addFloat(`+${heal.healed}`, 'text-forest-400', 'enemy');
              addLog({ text: `${enemy.name} HP: ${enemyHp}/${enemy.maxHp}`, type: 'status' });
              await sleep(speedMs);
            }
          }
        }

        // Check faint
        if (enemyHp <= 0) {
          enemyFainted = true;
          addLog({ text: `${enemy.name} fainted!`, type: 'faint' });
          break;
        }
        if (playerHp <= 0) {
          playerFainted = true;
          addLog({ text: `${player.name} fainted!`, type: 'faint' });
          break;
        }
      }

      // Update final HP
      setPlayer((p) => p ? { ...p, currentHp: playerHp } : p);
      setEnemy((e) => e ? { ...e, currentHp: enemyHp } : e);

      if (enemyFainted) {
        await sleep(speedMs);
        handleVictory();
      } else if (playerFainted) {
        await sleep(speedMs);
        handleDefeat();
      } else {
        setPhase('menu');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player, enemy, config, speedMs, addLog, addFloat, sfx],
  );

  const handleVictory = useCallback(
    async () => {
      if (!player || !enemy) return;
      audio.playMusic('victory');

      const isBoss = config?.type === 'guardian' || config?.type === 'creator';
      const xp = calculateXpReward(enemy, isBoss);
      addLog({ text: `${player.name} gained ${xp} XP!`, type: 'xp' });

      // Detect level-up by comparing before/after
      const levelBefore = useGameStore.getState().collection[player.speciesId]?.level ?? player.level;
      addExperience(player.speciesId, xp);
      const levelAfter = useGameStore.getState().collection[player.speciesId]?.level ?? player.level;
      if (levelAfter > levelBefore) {
        addLog({ text: `★ LEVEL UP! ${player.name} grew to Lv.${levelAfter}!`, type: 'levelup' });
        sfx.levelup();
        setLeveledUpTo(levelAfter);
      }

      addBattleRecord({
        opponent: config?.enemyName || enemy.name,
        result: 'win',
        monsterUsed: player.speciesId,
      });

      // Mark boss defeated
      if (config?.type === 'guardian' && config.guardianIndex !== undefined && config.gymId) {
        markGymBossDefeated(config.gymId as import('@/types/game').GymId, enemy.speciesId);
        const guardian = GUARDIANS[config.guardianIndex];
        if (guardian) {
          const badgeMap = ['forest', 'mountain', 'ruins', 'digital'] as const;
          addBadge(badgeMap[config.guardianIndex]);
          addLog({ text: `You defeated ${guardian.trainerName}!`, type: 'info' });
          emitGameEvent('boss_win', myTrainerName, guardian.trainerName);
        }
      }

      // Count gym win for wild battles
      if (config?.type === 'wild' && config.gymId) {
        recordGymWin(config.gymId as import('@/types/game').GymId);
      }
      if (config?.type === 'creator') {
        markCreatorDefeated();
        emitGameEvent('creator', myTrainerName);
      }

      // Capture wild/guardian monster — show flash then victory
      if (config?.type === 'wild' || config?.type === 'guardian') {
        captureMonster(enemy.speciesId);
        // Insert to leaderboard so battle captures show up (same as disk scan captures)
        const trainerNameForLB = useGameStore.getState().trainer?.name;
        if (trainerNameForLB) {
          supabase
            .from('leaderboard_entries')
            .insert({ trainer_name: trainerNameForLB, disk_id: enemy.speciesId })
            .then(({ error }) => { if (error && error.code !== '23505') console.warn('Leaderboard insert failed:', error.message); });
        }
        sfx.capture();
        setCaptureFlash(true);
        await sleep(1200);
        setCaptureFlash(false);
        addLog({
          text: config.type === 'guardian'
            ? `${enemy.name} joined your collection!`
            : `${enemy.name} was captured!`,
          type: 'info',
        });
      }

      await sleep(400);
      setPhase('victory');
    },
    [player, enemy, config, myTrainerName, addExperience, addBattleRecord, markGymBossDefeated, recordGymWin, markCreatorDefeated, captureMonster, addBadge, addLog, sfx],
  );

  const handleDefeat = useCallback(() => {
    setPhase('defeat');
    spendPotion();
    addBattleRecord({
      opponent: config?.enemyName || enemy?.name || 'Unknown',
      result: 'loss',
      monsterUsed: player?.speciesId || '',
    });
    if (config?.type === 'guardian' || config?.type === 'creator') {
      emitGameEvent('boss_loss', myTrainerName, config.enemyName ?? enemy?.name ?? 'a guardian');
    }
  }, [config, enemy, player, myTrainerName, addBattleRecord, spendPotion]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleFight = () => {
    sfx.select();
    setPhase('ability-select');
  };

  const handleAbility = (abilityName: string) => {
    sfx.confirm();
    executeTurn(abilityName);
  };

  const handleItem = () => {
    sfx.select();
    setPhase('item-select');
  };

  const applyPotion = () => {
    if (!player || potions <= 0) return;
    sfx.confirm();
    applyPotionToMonster(player.speciesId);
    const species = getSpecies(player.speciesId);
    if (species) {
      const maxHp = maxHpAtLevel(species.baseHp, player.level);
      setPlayer((p) => p ? { ...p, currentHp: Math.min(p.currentHp + Math.floor(maxHp * 0.5), maxHp) } : p);
      addFloat('+HP', 'text-forest-400', 'player');
      addLog({ text: `Used a Potion!`, type: 'info' });
    }
    // Enemy takes a turn
    setTimeout(() => {
      const enemyAbility = chooseAIAction(enemy!, player);
      enemyTurn(enemyAbility);
    }, speedMs);
  };

  const enemyTurn = async (abilityName: string) => {
    if (!player || !enemy) return;
    setPhase('animating');
    const ability = getAbility(abilityName);
    if (!ability) { setPhase('menu'); return; }

    if (!canAct(enemy)) {
      addLog({ text: `${enemy.name} can't move!`, type: 'status' });
      await sleep(speedMs);
      setPhase('menu');
      return;
    }

    addLog({ text: `${enemy.name} used ${ability.name}!`, type: 'info' });
    sfx.hit();

    if (ability.power === 0) {
      const statusMsg = tryApplyStatus(abilityName, player);
      if (statusMsg) addLog({ text: statusMsg, type: 'status' });
      const buffMsg = tryApplyStatBuff(abilityName, enemy);
      if (buffMsg) addLog({ text: buffMsg, type: 'status' });
      await sleep(speedMs);
      setPhase('menu');
      return;
    }

    const isCrit = rollCritical();
    const result = calculateDamage(enemy, player, abilityName, isCrit);
    if (result.missed) {
      addLog({ text: `${enemy.name}'s attack missed!`, type: 'miss' });
      await sleep(speedMs);
      setPhase('menu');
      return;
    }

    const dmg = result.damage;
    if (isCrit) {
      sfx.critical();
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 300);
      addLog({ text: 'A critical hit!', type: 'critical' });
    }
    const effLabel = effectivenessLabel(result.effectiveness);
    if (effLabel) addLog({ text: effLabel, type: 'effectiveness' });

    const newHp = Math.max(0, player.currentHp - dmg);
    setPlayer((p) => p ? { ...p, currentHp: newHp } : p);
    setShakeTarget('player');
    addFloat(`-${dmg}`, isCrit ? 'text-gold-400' : 'text-rust-400', 'player');
    addLog({ text: `${player.name} HP: ${newHp}/${player.maxHp}`, type: 'damage' });
    setTimeout(() => setShakeTarget(null), 400);
    await sleep(speedMs);

    if (newHp <= 0) {
      addLog({ text: `${player.name} fainted!`, type: 'faint' });
      await sleep(speedMs);
      handleDefeat();
    } else {
      setPhase('menu');
    }
  };

  const handleSwap = () => {
    sfx.select();
    setPhase('swap-select');
  };

  const handleSwapTo = (speciesId: string) => {
    if (!player) return;
    sfx.confirm();
    const mon = collection[speciesId];
    if (!mon) return;
    const newCombatant = createCombatant(speciesId, mon.level, true, mon.currentHp);
    if (!newCombatant) return;
    setPlayer(newCombatant);
    addLog({ text: `Go, ${newCombatant.name}!`, type: 'info' });
    // Enemy takes a turn
    setTimeout(() => {
      const enemyAbility = chooseAIAction(enemy!, newCombatant);
      enemyTurn(enemyAbility);
    }, speedMs);
  };

  const handleRun = () => {
    sfx.cancel();
    if (config?.type === 'guardian' || config?.type === 'creator') {
      addLog({ text: "You can't run from a Guardian battle!", type: 'info' });
      return;
    }
    audio.playMusic('menu');
    navigate('/world');
  };

  if (!config || !player || !enemy) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <PixelText className="text-ink-400">Loading battle...</PixelText>
      </div>
    );
  }

  const playerSpecies = getSpecies(player.speciesId);
  const enemySpecies = getSpecies(enemy.speciesId);
  const isBossType = config.type === 'guardian' || config.type === 'creator';

  // Boss intro data
  const bossGuardian = config.type === 'guardian' && config.guardianIndex !== undefined
    ? GUARDIANS[config.guardianIndex]
    : null;
  const bossCardImage = config.type === 'creator'
    ? CREATOR.cardImage
    : bossGuardian?.cardImage ?? null;
  const bossTrainerName = config.type === 'creator'
    ? CREATOR.name
    : bossGuardian?.trainerName ?? config.enemyName ?? 'Guardian';
  const bossTitleText = config.type === 'creator'
    ? 'The Creator'
    : bossGuardian?.title ?? 'Guardian';
  const bossPassive = config.type === 'creator'
    ? 'The final boss. Defeat all to claim victory.'
    : bossGuardian?.passive ?? '';

  // Background gradient based on battle type (only using defined palette stops)
  const arenaBg = config.type === 'creator'
    ? 'from-ink-800 via-ink-900 to-ink-900'
    : config.type === 'guardian'
    ? 'from-ember-900 via-ink-900 to-ink-900'
    : 'from-forest-900 via-ink-900 to-ink-900';

  // Latest log entry for the dialogue box
  const latestLog = log[log.length - 1];
  const dialogueText = phase === 'menu'
    ? `What will ${player.name} do?`
    : phase === 'ability-select'
    ? 'Choose an ability!'
    : phase === 'item-select'
    ? 'Choose an item!'
    : phase === 'swap-select'
    ? 'Choose a creature!'
    : latestLog?.text ?? '...';

  const logColor =
    latestLog?.type === 'critical'        ? '#f0c840'
    : latestLog?.type === 'effectiveness' ? '#4ade80'
    : latestLog?.type === 'faint'         ? '#f87171'
    : latestLog?.type === 'xp'            ? '#7dd3fc'
    : latestLog?.type === 'levelup'       ? '#f0c840'
    : latestLog?.type === 'status'        ? '#c4b5fd'
    : latestLog?.type === 'miss'          ? '#6b7280'
    : '#e2e8f0';

  // Shared button style helpers
  const btnFight = "flex-1 rounded-lg pixel-text-sm font-bold text-white bg-ember-700 border-b-4 border-ember-900 active:border-b-0 active:translate-y-1 transition-transform";
  const btnBlue  = "flex-1 rounded-lg pixel-text-sm font-bold text-white bg-ocean-700 border-b-4 border-ocean-900 active:border-b-0 active:translate-y-1 transition-transform disabled:opacity-40";

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-ink-900">

      {/* ── BOSS INTRO CUTSCENE ── */}
      <AnimatePresence>
        {phase === 'boss-intro' && (
          <motion.div
            key="boss-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink-900"
            onClick={() => setPhase('menu')}
          >
            {/* Dramatic background pulse */}
            <motion.div
              className={`absolute inset-0 ${config.type === 'creator' ? 'bg-gold-900/20' : 'bg-ember-900/20'}`}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />

            {/* Header label */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`mb-5 px-4 py-1.5 border-2 rounded-full ${
                config.type === 'creator'
                  ? 'border-gold-500 bg-gold-900/40'
                  : 'border-ember-500 bg-ember-900/40'
              }`}
            >
              <span className={`pixel-text-xs font-bold tracking-widest uppercase ${
                config.type === 'creator' ? 'text-gold-300' : 'text-ember-300'
              }`}>
                {config.type === 'creator' ? '⚡ Final Boss ⚡' : '⚔ Guardian Battle ⚔'}
              </span>
            </motion.div>

            {/* Boss card image */}
            {bossCardImage && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="relative mb-5"
              >
                <img
                  src={bossCardImage}
                  alt={bossTrainerName}
                  className="w-52 object-contain rounded-2xl border-4 border-ink-600 shadow-2xl"
                  style={{ imageRendering: 'auto', maxHeight: '280px' }}
                />
                {/* Glow ring */}
                <motion.div
                  className={`absolute -inset-2 rounded-2xl border-2 opacity-60 ${
                    config.type === 'creator' ? 'border-gold-400' : 'border-ember-400'
                  }`}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              </motion.div>
            )}

            {/* Boss name */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-center px-6"
            >
              <PixelText size="lg" className={`block mb-1 ${
                config.type === 'creator' ? 'text-gold-300' : 'text-ember-300'
              }`}>
                {bossTrainerName}
              </PixelText>
              <BodyText className="text-ink-400 text-sm mb-3">{bossTitleText}</BodyText>

              {bossPassive && (
                <div className="bg-ink-900/80 border border-ink-700 rounded-lg px-4 py-2 max-w-xs mx-auto">
                  <BodyText className="text-ink-500 text-xs mb-0.5 uppercase tracking-wider">Passive</BodyText>
                  <BodyText className="text-ink-300 text-sm">{bossPassive}</BodyText>
                </div>
              )}
            </motion.div>

            {/* Tap to battle hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 1.2, duration: 1.2, repeat: Infinity }}
              className="absolute bottom-10"
            >
              <BodyText className="text-ink-300 text-sm tracking-widest uppercase">▶ Tap to battle</BodyText>
            </motion.div>

            {/* Auto-dismiss after 4s — handled by useEffect below */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VS FLASH ── */}
      <AnimatePresence>
        {phase === 'vs-flash' && player && enemy && (
          <motion.div
            key="vs-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-ink-900"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-forest-900/30 via-ink-900 to-ember-900/30"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <div className="relative flex items-center justify-between w-full px-6 max-w-sm mx-auto">
              {/* Player creature */}
              <motion.div
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-2"
              >
                {playerSpecies?.spriteImage
                  ? <img src={playerSpecies.spriteImage} alt={player.name}
                      style={{ width: 80, height: 80, imageRendering: 'pixelated' }}
                      className="object-contain" />
                  : <div className="text-5xl">{playerSpecies?.sprite}</div>
                }
                <PixelText size="xs" className="text-forest-300">{player.name}</PixelText>
              </motion.div>

              {/* VS */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              >
                <PixelText size="lg" className="text-gold-400">VS</PixelText>
              </motion.div>

              {/* Enemy creature */}
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-2"
              >
                {enemySpecies?.spriteImage
                  ? <img src={enemySpecies.spriteImage} alt={enemy.name}
                      style={{ width: 80, height: 80, imageRendering: 'pixelated' }}
                      className="object-contain" />
                  : <div className="text-5xl">{enemySpecies?.sprite}</div>
                }
                <PixelText size="xs" className="text-rust-300">{enemy.name}</PixelText>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CAPTURE FLASH ── */}
      <AnimatePresence>
        {captureFlash && (
          <motion.div
            key="capture-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 1, 0.6, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink-900/95"
          >
            <motion.div
              animate={{ scale: [0.5, 1.3, 1.0] }}
              transition={{ duration: 0.7, ease: 'backOut' }}
              className="text-7xl mb-4"
            >
              💾
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <PixelText size="md" className="text-gold-400">{enemy.name} captured!</PixelText>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen flash */}
      {screenFlash && (
        <motion.div initial={{ opacity: 0.8 }} animate={{ opacity: 0 }}
          className="absolute inset-0 bg-white z-40 pointer-events-none" />
      )}

      {/* ── ARENA: 2×2 grid ── */}
      <div className={`grid grid-cols-2 grid-rows-2 bg-gradient-to-b ${arenaBg}`} style={{ height: '52vh' }}>

        {/* [TL] Enemy info card */}
        <div className="flex items-center p-3">
          <div className="bg-ink-900/90 border-2 border-ink-600 rounded-lg p-2.5 w-full">
            <div className="flex justify-between mb-1">
              <span className="pixel-text-xs text-ink-100 font-bold truncate">{enemy.name}</span>
              <div className="flex items-center gap-1">
                {enemy.status === 'sleep' && <span className="pixel-text-xs text-violet-400">💤</span>}
                {enemy.status === 'confusion' && <span className="pixel-text-xs text-gold-400">❓</span>}
                <span className="pixel-text-xs text-ink-500">Lv.{enemy.level}</span>
              </div>
            </div>
            {enemySpecies && <ElementTag element={enemySpecies.element} size="sm" />}
            {isBossType && config.enemyName && (
              <span className="pixel-text-xs text-gold-400 block mt-1">{config.enemyName}</span>
            )}
            <div className="mt-1.5">
              <HealthBar current={enemy.currentHp} max={enemy.maxHp} showNumbers />
            </div>
          </div>
        </div>

        {/* [TR] Enemy sprite + HP bar beneath it */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={shakeTarget === 'enemy' ? { x: [0, -8, 8, -5, 5, 0] } : { y: [0, -5, 0] }}
              transition={shakeTarget === 'enemy' ? { duration: 0.35 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              {enemySpecies?.spriteImage
                ? <img src={enemySpecies.spriteImage} alt={enemy.name}
                    style={{ width: 96, height: 96, imageRendering: 'pixelated' }}
                    draggable={false} className="object-contain select-none" />
                : <div className="text-6xl select-none">{enemySpecies?.sprite}</div>
              }
              <AnimatePresence>
                {floatingTexts.filter(f => f.target === 'enemy').map(ft => (
                  <motion.div key={ft.id} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -36 }} exit={{ opacity: 0 }}
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 pixel-text-xs font-bold ${ft.color} pointer-events-none whitespace-nowrap`}
                  >{ft.text}</motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* [BL] Player sprite */}
        <div className="flex items-center justify-center">
          <motion.div
            animate={shakeTarget === 'player' ? { x: [0, 10, -10, 6, -6, 0] } : { y: [0, -6, 0] }}
            transition={shakeTarget === 'player' ? { duration: 0.35 } : { duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            {playerSpecies?.spriteImage
              ? <img src={playerSpecies.spriteImage} alt={player.name}
                  style={{ width: 140, height: 140, imageRendering: 'pixelated' }}
                  draggable={false} className="object-contain select-none" />
              : <div className="text-8xl select-none">{playerSpecies?.sprite}</div>
            }
            <AnimatePresence>
              {floatingTexts.filter(f => f.target === 'player').map(ft => (
                <motion.div key={ft.id} initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -48 }} exit={{ opacity: 0 }}
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 pixel-text-xs font-bold ${ft.color} pointer-events-none whitespace-nowrap`}
                >{ft.text}</motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* [BR] Player status card */}
        <div className="flex items-center p-3">
          <div className="bg-ink-900/90 border-2 border-ink-600 rounded-lg p-2.5 w-full">
            <div className="flex justify-between mb-1">
              <span className="pixel-text-xs text-forest-300 font-bold truncate">{player.name}</span>
              <div className="flex items-center gap-1">
                {player.status === 'sleep' && <span className="pixel-text-xs text-violet-400">💤</span>}
                {player.status === 'confusion' && <span className="pixel-text-xs text-gold-400">❓</span>}
                <span className="pixel-text-xs text-ink-500">Lv.{player.level}</span>
              </div>
            </div>
            {playerSpecies && <ElementTag element={playerSpecies.element} size="sm" />}
            <div className="mt-1.5">
              <HealthBar current={player.currentHp} max={player.maxHp} showNumbers />
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM: dialogue + buttons ── */}
      <div className="flex bg-ink-900 border-t-4 border-ink-700" style={{ height: '48vh' }}>

        {/* Left: dialogue */}
        <div className="flex-1 flex items-center p-5 border-r-2 border-ink-700">
          <AnimatePresence mode="wait">
            <motion.p key={dialogueText}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pixel-text-sm text-ink-100 leading-relaxed"
            >{dialogueText}</motion.p>
          </AnimatePresence>
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-col justify-center p-3 gap-2" style={{ width: '50%' }}>
          <AnimatePresence mode="wait">

            {/* Main menu */}
            {phase === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-2" style={{ height: '100%' }}>
                <button onClick={handleFight} className={btnFight} style={{ minHeight: 56 }}>FIGHT</button>
                <button onClick={handleItem} disabled={potions <= 0} className={btnBlue} style={{ minHeight: 56 }}>BAG</button>
                <button onClick={handleSwap} disabled={Object.keys(collection).length < 2} className={btnBlue} style={{ minHeight: 56 }}>DISK</button>
                <button onClick={handleRun} disabled={isBossType} className={btnBlue} style={{ minHeight: 56 }}>RUN</button>
              </motion.div>
            )}

            {/* Animating */}
            {phase === 'animating' && (
              <motion.div key="animating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center" style={{ minHeight: 120 }}>
                <span className="pixel-text-sm text-ink-500 animate-pulse">▶ ▶ ▶</span>
              </motion.div>
            )}

            {/* Ability select */}
            {phase === 'ability-select' && (
              <motion.div key="ability" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-2">
                {player.abilities.map(ab => {
                  const ability = getAbility(ab);
                  if (!ability) return null;
                  const eff = ability.power > 0 && enemySpecies
                    ? effectivenessLabel(typeMultiplier(ability.element, enemySpecies.element))
                    : '';
                  return (
                    <button key={ab} onClick={() => handleAbility(ab)}
                      className="py-3 px-2 rounded-lg bg-ink-800 border-2 border-ink-600 hover:bg-ink-700 active:scale-95 text-left transition-all" style={{ minHeight: 56 }}>
                      <div className="pixel-text-xs text-ink-100 font-bold leading-tight">{ability.name}</div>
                      <div className="pixel-text-xs text-ink-500 mt-0.5">
                        {ability.element}{ability.power > 0 ? ` · ${ability.power}` : ''}
                        {eff && <span className="text-forest-400 ml-1">{eff}</span>}
                      </div>
                    </button>
                  );
                })}
                <button onClick={() => { sfx.cancel(); setPhase('menu'); }}
                  className="col-span-2 py-3 rounded-lg bg-ink-800 border-2 border-ink-600 hover:bg-ink-700 pixel-text-sm text-ink-300 transition-all">
                  ← Back
                </button>
              </motion.div>
            )}

            {/* Item select */}
            {phase === 'item-select' && (
              <motion.div key="item" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-2">
                <button onClick={applyPotion} disabled={potions <= 0}
                  className="py-4 px-3 rounded-lg bg-forest-800 border-2 border-forest-600 hover:bg-forest-700 disabled:opacity-40 active:scale-95 transition-all">
                  <div className="pixel-text-sm text-white font-bold">Potion ×{potions}</div>
                  <div className="pixel-text-xs text-forest-300 mt-0.5">Restore 50% HP</div>
                </button>
                <button onClick={() => { sfx.cancel(); setPhase('menu'); }}
                  className="py-3 rounded-lg bg-ink-800 border-2 border-ink-600 hover:bg-ink-700 pixel-text-sm text-ink-300 transition-all">
                  ← Back
                </button>
              </motion.div>
            )}

            {/* Swap select */}
            {phase === 'swap-select' && (
              <motion.div key="swap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
                {Object.entries(collection).map(([id, mon]) => {
                  const sp = getSpecies(id);
                  if (!sp) return null;
                  const maxHp = maxHpAtLevel(sp.baseHp, mon.level);
                  const isCurrent = id === player.speciesId;
                  return (
                    <button key={id} disabled={isCurrent} onClick={() => handleSwapTo(id)}
                      className={`py-3 px-3 rounded-lg border-2 text-left transition-all ${isCurrent ? 'bg-ink-900 border-ink-700 opacity-40 cursor-not-allowed' : 'bg-ink-800 border-ink-600 hover:bg-ink-700 active:scale-95'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{sp.sprite}</span>
                        <div>
                          <div className="pixel-text-xs text-ink-100 font-bold">{sp.name}</div>
                          <div className="pixel-text-xs text-ink-500">{mon.currentHp}/{maxHp} HP</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                <button onClick={() => { sfx.cancel(); setPhase('menu'); }}
                  className="py-3 rounded-lg bg-ink-800 border-2 border-ink-600 hover:bg-ink-700 pixel-text-sm text-ink-300 transition-all">
                  ← Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── VICTORY overlay ── */}
      {phase === 'victory' && (() => {
        const updatedMon = collection[player.speciesId];
        const xpNeeded = xpForLevel(updatedMon?.level ?? player.level);
        const xpCurrent = updatedMon?.experience ?? 0;
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-ink-900/90"
          >
            <PixelPanel variant="gold" className="p-6 text-center mx-4 max-w-xs w-full">
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
                <PixelText size="lg" className="text-gold-400 block mb-3">VICTORY!</PixelText>
              </motion.div>

              {/* Level-up banner */}
              {leveledUpTo !== null && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gold-900/60 border-2 border-gold-500 rounded-lg px-3 py-2 mb-3"
                >
                  <PixelText size="sm" className="text-gold-300">★ LEVEL UP! Lv.{leveledUpTo}</PixelText>
                </motion.div>
              )}

              <div className="space-y-1 mb-4">
                {log.filter(l => l.type === 'xp' || l.type === 'info').slice(-4).map((l, i) => (
                  <BodyText key={i} className="text-ink-200 block text-sm">{l.text}</BodyText>
                ))}
              </div>

              {/* XP bar — live from store after addExperience ran */}
              {updatedMon && (
                <div className="bg-ink-900 border-2 border-ink-700 rounded-lg p-3 mb-4 text-left">
                  <div className="flex justify-between items-center mb-1.5">
                    <BodyText className="text-ink-400 text-xs">{player.name} — Lv.{updatedMon.level}</BodyText>
                    <BodyText className="text-ocean-400 text-xs font-bold">{xpCurrent}/{xpNeeded} XP</BodyText>
                  </div>
                  <XpBar current={xpCurrent} needed={xpNeeded} />
                </div>
              )}

              <PixelButton
                variant="primary"
                fullWidth
                onClick={() => {
                  sfx.confirm();
                  audio.playMusic('menu');
                  if (config?.type === 'creator') {
                    navigate('/credits');
                  } else if (config?.type === 'guardian' && config.guardianIndex === 3) {
                    navigate('/final-unlock');
                  } else {
                    navigate('/world');
                  }
                }}
              >
                Continue
              </PixelButton>
            </PixelPanel>
          </motion.div>
        );
      })()}

      {/* ── DEFEAT overlay ── */}
      {phase === 'defeat' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-ink-900/90"
        >
          <PixelPanel variant="raised" className="p-6 text-center mx-4 max-w-xs w-full">
            <PixelText size="lg" className="text-rust-400 block mb-2">BLACKED OUT!</PixelText>
            <BodyText className="text-ink-300 block mb-2 text-sm">{player?.name} fainted...</BodyText>
            <div className="bg-ink-900 border-2 border-rust-800 rounded-lg px-3 py-2 mb-4">
              <BodyText className="text-rust-400 text-sm">🧪 –1 Potion lost</BodyText>
              <BodyText className="text-ink-500 text-xs mt-0.5">({potions} remaining)</BodyText>
            </div>
            <PixelButton
              variant="primary"
              fullWidth
              onClick={() => {
                sfx.confirm();
                audio.playMusic('menu');
                navigate('/world');
              }}
            >
              Return to Map
            </PixelButton>
          </PixelPanel>
        </motion.div>
      )}
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
