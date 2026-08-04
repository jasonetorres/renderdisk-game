import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { PixelButton, PixelPanel, PixelText } from '@/components/ui';
import { useSfx } from '@/audio/engine';
import { useGameStore } from '@/store/gameStore';
import type { BodyId, TrainerAppearance, TrainerLayerOption } from '@/data/trainer2/types';
import { makeDefaultAppearance, DEFAULTS_BY_BODY } from '@/data/trainer2/defaults';
import {
  TRAINER_OPTIONS,
  SKIN_TONES,
  HAIR_COLORS,
  SHIRT_COLORS,
  PANT_COLORS,
} from '@/data/trainer2/options';
import { TrainerSprite } from '@/components/trainer/TrainerSprite';
import { TrainerOptionSelector } from '@/components/trainer/TrainerOptionSelector';

type Gender = 'masc' | 'femme';

function matchesGender(opt: TrainerLayerOption, gender: Gender): boolean {
  if (!opt.tags || opt.tags.length === 0) return true;
  return opt.tags.includes(gender) || opt.tags.includes('any');
}

function isValidTrainerName(raw: string) {
  const name = raw.trim();
  if (name.length < 1 || name.length > 12) return false;
  return /^[A-Za-z0-9 '\\-]+$/.test(name);
}

function compatibleOptions(category: string, body: BodyId, gender: Gender) {
  return TRAINER_OPTIONS.filter(
    (o) => o.category === category && !o.hidden && o.supportedBodies.includes(body) && matchesGender(o, gender),
  );
}

function firstOption(category: string, body: BodyId, gender: Gender): string {
  return compatibleOptions(category, body, gender)[0]?.id ?? '';
}

/**
 * For femme gender, prefer femme-tagged options first so the
 * default appearance is visually distinct (blouse, skirt, high-ponytail).
 * Falls back to the first any-compatible option if no femme tag exists.
 */
function preferredOption(category: string, body: BodyId, gender: Gender): string {
  const all = compatibleOptions(category, body, gender);
  if (gender === 'femme') {
    const femmeFirst = all.find((o) => o.tags?.includes('femme'));
    if (femmeFirst) return femmeFirst.id;
  }
  return all[0]?.id ?? '';
}

function resetForGender(body: BodyId, gender: Gender): Partial<TrainerAppearance> {
  const defaults = DEFAULTS_BY_BODY[body];
  return {
    top: preferredOption('top', body, gender) || defaults.top,
    bottom: preferredOption('bottom', body, gender) || defaults.bottom,
    shoes: firstOption('shoes', body, gender) || defaults.shoes,
    hair: preferredOption('hair', body, gender) || defaults.hair,
    eyes: gender === 'femme' ? 'eyes-feminine' : defaults.eyes,
    faceAcc: gender === 'femme' ? null : defaults.faceAcc,
  };
}

// ── Swatch pickers ────────────────────────────────────────────────────────────
function SwatchPicker({
  label, value, swatches, onChange,
}: {
  label: string; value: string;
  swatches: { id: string; label: string; hex: string }[];
  onChange: (hex: string) => void;
}) {
  return (
    <div className="mb-3">
      <PixelText size="xs" className="text-ink-400 mb-1 block">{label}</PixelText>
      <div className="flex flex-wrap gap-1">
        {swatches.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s.hex)}
            title={s.label}
            aria-label={s.label}
            style={{
              width: 28, height: 28, backgroundColor: s.hex,
              borderWidth: 2, borderStyle: 'solid',
              borderColor: value === s.hex ? '#fbbf24' : '#374151',
              transform: value === s.hex ? 'scale(1.18)' : 'scale(1)',
              transition: 'transform 0.1s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DualSwatchPicker({
  label, value1, value2, swatches, onChange1, onChange2,
}: {
  label: string; value1: string; value2: string;
  swatches: { id: string; label: string; hex: string }[];
  onChange1: (hex: string) => void; onChange2: (hex: string) => void;
}) {
  const [active, setActive] = useState<1 | 2>(1);
  const activeHex = active === 1 ? value1 : value2;
  const onChange = active === 1 ? onChange1 : onChange2;
  return (
    <div className="mb-3">
      <PixelText size="xs" className="text-ink-400 mb-1 block">{label}</PixelText>
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => setActive(1)} title="Main fabric"
          style={{ width: 24, height: 24, backgroundColor: value1, borderWidth: 2, borderStyle: 'solid', borderColor: active === 1 ? '#fbbf24' : '#374151' }} />
        <PixelText size="xs" className="text-ink-500">+</PixelText>
        <button onClick={() => setActive(2)} title="Shadow/accent"
          style={{ width: 24, height: 24, backgroundColor: value2, borderWidth: 2, borderStyle: 'solid', borderColor: active === 2 ? '#fbbf24' : '#374151' }} />
        <PixelText size="xs" className="text-ink-500">{active === 1 ? '← Fabric' : '← Shadow'}</PixelText>
      </div>
      <div className="flex flex-wrap gap-1">
        {swatches.map((s) => (
          <button key={s.id} onClick={() => onChange(s.hex)} title={s.label} aria-label={s.label}
            style={{
              width: 28, height: 28, backgroundColor: s.hex,
              borderWidth: 2, borderStyle: 'solid',
              borderColor: activeHex === s.hex ? '#fbbf24' : '#374151',
              transform: activeHex === s.hex ? 'scale(1.18)' : 'scale(1)',
              transition: 'transform 0.1s',
            }} />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function TrainerRegister() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const createTrainer = useGameStore((s) => s.createTrainer);
  const pendingDiskCode = useGameStore((s) => s.pendingDiskCode);
  const claimStarterDisk = useGameStore((s) => s.claimStarterDisk);
  const setPendingDiskCode = useGameStore((s) => s.setPendingDiskCode);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('masc');
  const [appearance, setAppearance] = useState<TrainerAppearance>(() => makeDefaultAppearance('small'));

  const nameTrim = name.trim();
  const nameValid = isValidTrainerName(name);

  const bodyOptions = useMemo(() => [
    { id: 'small'   as const, label: 'Small'   },
    { id: 'average' as const, label: 'Average' },
  ], []);

  const topOptions      = useMemo(() => compatibleOptions('top',     appearance.body, gender), [appearance.body, gender]);
  const bottomOptions   = useMemo(() => compatibleOptions('bottom',  appearance.body, gender), [appearance.body, gender]);
  const shoesOptions    = useMemo(() => compatibleOptions('shoes',   appearance.body, gender), [appearance.body, gender]);
  const headOptions     = useMemo(() => compatibleOptions('head',    appearance.body, gender), [appearance.body, gender]);
  const eyesOptions     = useMemo(() => compatibleOptions('eyes',    appearance.body, gender), [appearance.body, gender]);
  const hairOptions     = useMemo(() => compatibleOptions('hair',    appearance.body, gender), [appearance.body, gender]);
  const faceAccOptions  = useMemo(() => [
    { id: 'none', label: 'None' },
    ...compatibleOptions('faceAcc', appearance.body, gender),
  ], [appearance.body, gender]);
  const headwearOptions = useMemo(() => [
    { id: 'none', label: 'None' },
    ...compatibleOptions('headwear', appearance.body, gender),
  ], [appearance.body, gender]);

  function handleGenderChange(g: Gender) {
    sfx.select();
    setGender(g);
    setAppearance((a) => {
      const overrides = resetForGender(a.body, g);
      const hair = (overrides.hair ?? a.hair) as string;
      const slug = hair.replace(/^hair-/, '');
      return { ...a, ...overrides, hair, hairFront: `hair-front-${slug}` };
    });
  }

  function setBody(body: BodyId) {
    sfx.select();
    setAppearance((a) => {
      const overrides = resetForGender(body, gender);
      const hair = (overrides.hair ?? a.hair) as string;
      const slug = hair.replace(/^hair-/, '');
      return { ...makeDefaultAppearance(body), ...a, body, ...overrides, hair, hairFront: `hair-front-${slug}` };
    });
  }

  function setField<K extends keyof TrainerAppearance>(key: K, val: TrainerAppearance[K]) {
    sfx.select();
    setAppearance((a) => ({ ...a, [key]: val }));
  }

  function handleBegin() {
    if (!nameValid) return;
    sfx.confirm();
    createTrainer({ name: nameTrim, appearance, version: 2, createdAt: Date.now() });
    if (pendingDiskCode) { claimStarterDisk(pendingDiskCode); setPendingDiskCode(null); }
    navigate('/tutorial');
  }

  return (
    <div>
      {/* ── Sticky preview ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-2" style={{ background: '#0D1117' }}>
        <div className="mx-auto" style={{ width: 'min(100%, 430px)' }}>
          <PixelPanel className="p-3">
            <div className="bg-ink-900 border-2 border-ink-700 px-3 py-3 flex justify-center">
              <TrainerSprite appearance={appearance} scale={5} />
            </div>
            <div className="text-center mt-1">
              <PixelText size="xs" className="text-ink-200">{nameTrim || '???'} the Trainer</PixelText>
            </div>
          </PixelPanel>
        </div>
      </div>

      {/* ── Scrollable options ─────────────────────────────────── */}
      <div className="px-4 pb-10">
        <div className="mx-auto" style={{ width: 'min(100%, 430px)' }}>

          {/* Name + Boy/Girl — first two things */}
          <PixelPanel className="p-4 mb-3">
            <PixelText size="xs" className="text-ink-300 mb-2 block">Trainer Name</PixelText>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-ink-900 border-2 border-ink-600 px-3 py-3 font-body text-base text-ink-100 outline-none focus:border-forest-500"
              inputMode="text"
              autoComplete="nickname"
              aria-label="Trainer name"
            />
            <div className="flex items-center justify-between mt-1 mb-4">
              <PixelText size="xs" className={name.length === 0 || nameValid ? 'text-ink-500' : 'text-rust-400'}>
                {name.length === 0 ? '1–12 characters' : nameValid ? 'OK' : "Letters, numbers, spaces, - and '"}
              </PixelText>
              <PixelText size="xs" className="text-ink-500">{nameTrim.length}/12</PixelText>
            </div>

            <PixelText size="xs" className="text-ink-300 mb-2 block">I am a...</PixelText>
            <div className="grid grid-cols-2 gap-2">
              {(['masc', 'femme'] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenderChange(g)}
                  className="py-3 text-sm font-mono border-2 transition-colors"
                  style={{
                    borderColor: gender === g ? '#fbbf24' : '#374151',
                    color: gender === g ? '#fbbf24' : '#9ca3af',
                    backgroundColor: gender === g ? 'rgba(251,191,36,0.1)' : 'transparent',
                  }}
                >
                  {g === 'masc' ? '👦 Boy' : '👧 Girl'}
                </button>
              ))}
            </div>
          </PixelPanel>

          {/* Body */}
          <PixelPanel className="p-4 mb-3">
            <TrainerOptionSelector
              label="Body"
              value={appearance.body}
              options={bodyOptions}
              onChange={(id) => setBody(id as BodyId)}
              ariaLabelPrev="Previous body"
              ariaLabelNext="Next body"
            />
          </PixelPanel>

          {/* Clothing */}
          <PixelPanel className="p-4 mb-3">
            <TrainerOptionSelector label="Top" value={appearance.top}
              options={topOptions.map((o) => ({ id: o.id, label: o.label }))}
              onChange={(id) => setField('top', id)}
              ariaLabelPrev="Previous top" ariaLabelNext="Next top" />
            <TrainerOptionSelector label="Bottom" value={appearance.bottom}
              options={bottomOptions.map((o) => ({ id: o.id, label: o.label }))}
              onChange={(id) => setField('bottom', id)}
              ariaLabelPrev="Previous bottom" ariaLabelNext="Next bottom" />
            <TrainerOptionSelector label="Shoes" value={appearance.shoes}
              options={shoesOptions.map((o) => ({ id: o.id, label: o.label }))}
              onChange={(id) => setField('shoes', id)}
              ariaLabelPrev="Previous shoes" ariaLabelNext="Next shoes" />
          </PixelPanel>

          {/* Colors */}
          <PixelPanel className="p-4 mb-3">
            <PixelText size="xs" className="text-ink-300 mb-3 block font-bold">Colors</PixelText>
            <SwatchPicker label="Shirt" value={appearance.topColor} swatches={SHIRT_COLORS}
              onChange={(hex) => setField('topColor', hex)} />
            <DualSwatchPicker label="Pants" value1={appearance.bottomColor} value2={appearance.bottomColor2}
              swatches={PANT_COLORS}
              onChange1={(hex) => setField('bottomColor', hex)}
              onChange2={(hex) => setField('bottomColor2', hex)} />
          </PixelPanel>

          {/* Head */}
          <PixelPanel className="p-4 mb-3">
            <TrainerOptionSelector label="Head Shape" value={appearance.head}
              options={headOptions.map((o) => ({ id: o.id, label: o.label }))}
              onChange={(id) => setField('head', id)}
              ariaLabelPrev="Previous head" ariaLabelNext="Next head" />
            <TrainerOptionSelector label="Eyes" value={appearance.eyes}
              options={eyesOptions.map((o) => ({ id: o.id, label: o.label }))}
              onChange={(id) => setField('eyes', id)}
              ariaLabelPrev="Previous eyes" ariaLabelNext="Next eyes" />
            <TrainerOptionSelector label="Face Acc" value={appearance.faceAcc ?? 'none'}
              options={faceAccOptions.map((o) => ({ id: o.id, label: o.label }))}
              onChange={(id) => setField('faceAcc', id === 'none' ? null : id)}
              ariaLabelPrev="Previous face accessory" ariaLabelNext="Next face accessory" />
          </PixelPanel>

          {/* Hair */}
          <PixelPanel className="p-4 mb-3">
            <TrainerOptionSelector label="Hair" value={appearance.hair}
              options={hairOptions.map((o) => ({ id: o.id, label: o.label }))}
              onChange={(id) => {
                const slug = id.replace(/^hair-/, '');
                sfx.select();
                setAppearance((a) => ({ ...a, hair: id, hairFront: `hair-front-${slug}` }));
              }}
              ariaLabelPrev="Previous hair" ariaLabelNext="Next hair" />
            <SwatchPicker label="Hair Color" value={appearance.hairColor} swatches={HAIR_COLORS}
              onChange={(hex) => setField('hairColor', hex)} />
            <TrainerOptionSelector label="Headwear" value={appearance.headwear ?? 'none'}
              options={headwearOptions.map((o) => ({ id: o.id, label: o.label }))}
              onChange={(id) => setField('headwear', id === 'none' ? null : id)}
              ariaLabelPrev="Previous headwear" ariaLabelNext="Next headwear" />
          </PixelPanel>

          {/* Skin */}
          <PixelPanel className="p-4 mb-4">
            <SwatchPicker
              label="Skin Tone"
              value={appearance.skinTone}
              swatches={SKIN_TONES.map((s) => ({ id: s.id, label: s.label, hex: s.hex }))}
              onChange={(hex) => {
                const tone = SKIN_TONES.find((s) => s.hex === hex);
                if (tone) setField('skinTone', tone.id);
              }}
            />
          </PixelPanel>

          <PixelButton variant="primary" fullWidth disabled={!nameValid} onClick={handleBegin} className="text-base">
            <Play size={16} /> Begin Journey
          </PixelButton>
          {!nameValid && nameTrim.length > 0 && (
            <PixelText size="xs" className="text-rust-400 block text-center mt-2">
              Enter a valid trainer name to begin.
            </PixelText>
          )}
        </div>
      </div>
    </div>
  );
}
