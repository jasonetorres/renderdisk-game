import { useGameStore } from '@/store/gameStore';

// ── Chiptune audio engine ────────────────────────────────────────────────────
// A small synth built on the Web Audio API that produces 8-bit style music
// and sound effects. No external audio files needed — everything is
// generated procedurally from oscillators and a noise buffer.

type TrackId =
  | 'menu'
  | 'overworld'
  | 'battle'
  | 'boss'
  | 'finalboss'
  | 'victory'
  | 'credits';

interface Note {
  freq: number;
  dur: number; // beats
}

// Note frequency helper (equal temperament, A4 = 440).
function n(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ── Melodies (simple looping patterns) ───────────────────────────────────────
// Each track is a sequence of [midi, beats] tuples for melody + bass.

const TRACKS: Record<TrackId, { tempo: number; melody: Note[]; bass: Note[] }> = {
  menu: {
    tempo: 120,
    melody: [
      [76,1],[79,1],[81,1],[79,1], [76,1],[74,1],[72,2],
      [74,1],[76,1],[79,1],[81,1], [83,2],[79,2],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
    bass: [
      [36,2],[43,2], [41,2],[38,2],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
  },
  overworld: {
    tempo: 140,
    melody: [
      [72,0.5],[76,0.5],[79,0.5],[76,0.5], [74,1],[72,1],
      [74,0.5],[77,0.5],[81,0.5],[77,0.5], [76,1],[74,1],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
    bass: [
      [36,2],[43,2], [41,2],[38,2],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
  },
  battle: {
    tempo: 160,
    melody: [
      [76,0.5],[76,0.5],[79,1],[76,0.5], [74,0.5],[76,1],[79,0.5],
      [81,0.5],[79,0.5],[76,1],[74,0.5], [72,2],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
    bass: [
      [33,1],[33,1],[38,1],[38,1], [40,1],[40,1],[35,1],[35,1],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
  },
  boss: {
    tempo: 150,
    melody: [
      [69,0.5],[72,0.5],[76,1],[72,0.5], [69,0.5],[67,1],[69,0.5],
      [72,0.5],[76,0.5],[79,1],[76,0.5], [72,2],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
    bass: [
      [33,1],[33,1],[33,1],[33,1], [31,1],[31,1],[31,1],[31,1],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
  },
  finalboss: {
    tempo: 170,
    melody: [
      [64,0.5],[67,0.5],[71,0.5],[74,1], [71,0.5],[67,0.5],[64,1],
      [62,0.5],[65,0.5],[69,0.5],[72,1], [69,0.5],[65,0.5],[62,1],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
    bass: [
      [28,1],[28,1],[28,1],[28,1], [26,1],[26,1],[26,1],[26,1],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
  },
  victory: {
    tempo: 130,
    melody: [
      [72,0.5],[76,0.5],[79,1],[84,1], [83,0.5],[79,0.5],[76,2],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
    bass: [
      [36,1],[43,1],[48,1],[43,1],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
  },
  credits: {
    tempo: 100,
    melody: [
      [76,2],[79,2],[81,2],[83,2], [84,4],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
    bass: [
      [36,4],[43,4],
    ].map(([m,d]) => ({ freq: n(m), dur: d })),
  },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private currentTrack: TrackId | null = null;
  private scheduleTimer: number | null = null;
  private nextNoteTime = 0;
  private melodyIdx = 0;
  private bassIdx = 0;

  private get settings() {
    return useGameStore.getState().settings;
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 1;

      // Build noise buffer for SFX
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch {
      return null;
    }
    return this.ctx;
  }

  resume() {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  // Called from React when settings change so volumes stay in sync.
  syncVolumes() {
    this.setVolumes();
  }

  private setVolumes() {
    if (!this.ctx || !this.musicGain || !this.sfxGain) return;
    const s = this.settings;
    if (!s.audioEnabled) {
      this.musicGain.gain.value = 0;
      this.sfxGain.gain.value = 0;
    } else {
      this.musicGain.gain.value = s.musicVolume;
      this.sfxGain.gain.value = s.sfxVolume;
    }
  }

  playMusic(track: TrackId) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    this.nextNoteTime = ctx.currentTime + 0.1;
    this.melodyIdx = 0;
    this.bassIdx = 0;
    this.setVolumes();
    this.scheduler();
  }

  stopMusic() {
    this.currentTrack = null;
    if (this.scheduleTimer !== null) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  private scheduler = () => {
    if (!this.ctx || !this.currentTrack) return;
    const track = TRACKS[this.currentTrack];
    const beatDur = 60 / track.tempo;
    const lookahead = 0.25;

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      const melodyNote = track.melody[this.melodyIdx];
      const bassNote = track.bass[this.bassIdx];
      this.scheduleNote(this.musicGain!, melodyNote.freq, this.nextNoteTime, melodyNote.dur * beatDur, 'square', 0.15);
      this.scheduleNote(this.musicGain!, bassNote.freq, this.nextNoteTime, bassNote.dur * beatDur, 'triangle', 0.2);
      const noteDur = Math.min(melodyNote.dur, bassNote.dur) * beatDur;
      this.nextNoteTime += noteDur;
      this.melodyIdx = (this.melodyIdx + 1) % track.melody.length;
      this.bassIdx = (this.bassIdx + 1) % track.bass.length;
    }

    this.scheduleTimer = window.setTimeout(this.scheduler, 100);
  };

  private scheduleNote(
    dest: AudioNode,
    freq: number,
    startTime: number,
    dur: number,
    type: OscillatorType,
    vol: number,
  ) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    gain.gain.setValueAtTime(vol, startTime + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, startTime + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);
  }

  // ── Sound effects ──────────────────────────────────────────────────────────

  sfx(type: 'select' | 'confirm' | 'cancel' | 'capture' | 'hit' | 'critical' | 'levelup' | 'floppy' | 'error') {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || !this.noiseBuffer) return;
    this.setVolumes();
    const now = ctx.currentTime;

    switch (type) {
      case 'select':
        this.scheduleNote(this.sfxGain, n(76), now, 0.06, 'square', 0.2);
        break;
      case 'confirm':
        this.scheduleNote(this.sfxGain, n(76), now, 0.06, 'square', 0.2);
        this.scheduleNote(this.sfxGain, n(83), now + 0.06, 0.1, 'square', 0.2);
        break;
      case 'cancel':
        this.scheduleNote(this.sfxGain, n(72), now, 0.06, 'square', 0.2);
        this.scheduleNote(this.sfxGain, n(67), now + 0.06, 0.08, 'square', 0.2);
        break;
      case 'error':
        this.scheduleNote(this.sfxGain, n(60), now, 0.15, 'sawtooth', 0.2);
        break;
      case 'capture':
        this.scheduleNote(this.sfxGain, n(72), now, 0.08, 'square', 0.2);
        this.scheduleNote(this.sfxGain, n(76), now + 0.08, 0.08, 'square', 0.2);
        this.scheduleNote(this.sfxGain, n(79), now + 0.16, 0.08, 'square', 0.2);
        this.scheduleNote(this.sfxGain, n(84), now + 0.24, 0.2, 'square', 0.2);
        break;
      case 'hit':
        this.playNoise(0.08, 0.3);
        break;
      case 'critical':
        this.playNoise(0.15, 0.5);
        this.scheduleNote(this.sfxGain, n(55), now, 0.15, 'sawtooth', 0.2);
        break;
      case 'levelup':
        this.scheduleNote(this.sfxGain, n(72), now, 0.06, 'square', 0.2);
        this.scheduleNote(this.sfxGain, n(76), now + 0.06, 0.06, 'square', 0.2);
        this.scheduleNote(this.sfxGain, n(79), now + 0.12, 0.06, 'square', 0.2);
        this.scheduleNote(this.sfxGain, n(84), now + 0.18, 0.2, 'square', 0.2);
        break;
      case 'floppy':
        // Floppy drive seek sound — short noise bursts
        this.playNoise(0.04, 0.15);
        this.playNoise(0.04, 0.15, now + 0.08);
        this.playNoise(0.06, 0.12, now + 0.18);
        break;
    }
  }

  private playNoise(dur: number, vol: number, startTime?: number) {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const start = startTime ?? this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;
    src.buffer = this.noiseBuffer;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.linearRampToValueAtTime(0, start + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(start);
    src.stop(start + dur + 0.02);
  }
}

export const audio = new AudioEngine();

// React hook for components to easily play UI sounds.
export function useSfx() {
  return {
    select: () => audio.sfx('select'),
    confirm: () => audio.sfx('confirm'),
    cancel: () => audio.sfx('cancel'),
    error: () => audio.sfx('error'),
    capture: () => audio.sfx('capture'),
    hit: () => audio.sfx('hit'),
    critical: () => audio.sfx('critical'),
    levelup: () => audio.sfx('levelup'),
    floppy: () => audio.sfx('floppy'),
  };
}
