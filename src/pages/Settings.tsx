import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Gauge, Monitor, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { audio, useSfx } from '@/audio/engine';
import { PixelButton, PixelText, BodyText, PixelPanel } from '@/components/ui';
import type { GameSettings } from '@/types/game';

export function Settings() {
  const navigate = useNavigate();
  const sfx = useSfx();
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetSave = useGameStore((s) => s.resetSave);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggleAudio = () => {
    const newVal = !settings.audioEnabled;
    updateSettings({ audioEnabled: newVal });
    if (newVal) {
      audio.resume();
      audio.playMusic('menu');
      sfx.confirm();
    }
  };

  const setBattleSpeed = (speed: GameSettings['battleSpeed']) => {
    sfx.select();
    updateSettings({ battleSpeed: speed });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button
          onClick={() => {
            sfx.cancel();
            navigate('/game');
          }}
          className="pixel-btn !p-2"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <PixelText size="md" className="text-forest-400">
          Settings
        </PixelText>
      </div>

      {/* Audio */}
      <PixelPanel className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <PixelText size="xs" className="text-ink-200">
            <Volume2 size={12} className="inline mr-1" /> Audio
          </PixelText>
          <button
            onClick={toggleAudio}
            className={`pixel-btn ${settings.audioEnabled ? 'pixel-btn-primary' : ''} !px-3 !py-2`}
          >
            {settings.audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span className="ml-1">{settings.audioEnabled ? 'On' : 'Off'}</span>
          </button>
        </div>

        {settings.audioEnabled && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <BodyText className="text-ink-300">Music</BodyText>
                <span className="pixel-text-xs text-ink-400">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.musicVolume}
                onChange={(e) => updateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-forest-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <BodyText className="text-ink-300">Sound Effects</BodyText>
                <span className="pixel-text-xs text-ink-400">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.sfxVolume}
                onChange={(e) => {
                  updateSettings({ sfxVolume: parseFloat(e.target.value) });
                  sfx.select();
                }}
                className="w-full accent-ocean-500"
              />
            </div>
          </div>
        )}
      </PixelPanel>

      {/* Battle Speed */}
      <PixelPanel className="p-4 mb-4">
        <PixelText size="xs" className="text-ink-200 mb-3 block">
          <Gauge size={12} className="inline mr-1" /> Battle Speed
        </PixelText>
        <div className="grid grid-cols-3 gap-2">
          {(['slow', 'normal', 'fast'] as const).map((speed) => (
            <button
              key={speed}
              onClick={() => setBattleSpeed(speed)}
              className={`pixel-btn !px-2 !py-2 capitalize ${
                settings.battleSpeed === speed ? 'pixel-btn-primary' : ''
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </PixelPanel>

      {/* CRT Effect */}
      <PixelPanel className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <PixelText size="xs" className="text-ink-200">
            <Monitor size={12} className="inline mr-1" /> CRT Scanlines
          </PixelText>
          <button
            onClick={() => {
              sfx.select();
              updateSettings({ crtEffect: !settings.crtEffect });
            }}
            className={`pixel-btn ${settings.crtEffect ? 'pixel-btn-primary' : ''} !px-3 !py-2`}
          >
            {settings.crtEffect ? 'On' : 'Off'}
          </button>
        </div>
      </PixelPanel>

      {/* Danger zone */}
      <PixelPanel variant="gold" className="p-4 mb-4 mt-auto">
        <PixelText size="xs" className="text-rust-400 mb-3 block">
          Danger Zone
        </PixelText>
        {!showResetConfirm ? (
          <PixelButton
            variant="ember"
            fullWidth
            onClick={() => {
              sfx.error();
              setShowResetConfirm(true);
            }}
          >
            <RotateCcw size={16} /> Erase Save Data
          </PixelButton>
        ) : (
          <div className="space-y-2">
            <BodyText className="text-rust-300 block text-center mb-2">
              This will delete your trainer, all captured monsters, and progress. This cannot be undone.
            </BodyText>
            <div className="flex gap-2">
              <PixelButton
                variant="ember"
                fullWidth
                onClick={() => {
                  sfx.error();
                  resetSave();
                  setShowResetConfirm(false);
                  navigate('/');
                }}
              >
                Yes, Erase
              </PixelButton>
              <PixelButton
                fullWidth
                onClick={() => {
                  sfx.cancel();
                  setShowResetConfirm(false);
                }}
              >
                Cancel
              </PixelButton>
            </div>
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
