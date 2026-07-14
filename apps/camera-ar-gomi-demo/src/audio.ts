import type { GeneratorParams } from './types';

type ToneModule = typeof import('tone');

export class SoundEngine {
  private Tone: ToneModule | undefined;
  private synth: any;
  private noise: any;
  private channel: any;
  private sequence: any;
  private volume = 0.35;
  private isPlaying = false;

  async prepare(): Promise<void> {
    if (!this.Tone) {
      this.Tone = await import('tone');
    }
    await this.Tone.start();
  }

  async play(params: GeneratorParams): Promise<void> {
    await this.prepare();
    this.stop();

    const Tone = this.Tone;
    if (!Tone) {
      return;
    }

    this.channel = new Tone.Volume(volumeToDb(this.volume)).toDestination();
    const delay = new Tone.FeedbackDelay('8n', 0.22 + params.noise).connect(this.channel);
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: params.waveform },
      envelope: { attack: 0.03, decay: 0.22, sustain: 0.28, release: 0.6 },
    }).connect(delay);
    this.noise = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.01, decay: 0.08 + params.noise * 0.2, sustain: 0, release: 0.1 },
    }).connect(this.channel);

    const notes = buildPattern(params);
    this.sequence = new Tone.Sequence(
      (time, note) => {
        this.synth?.triggerAttackRelease(note, '8n', time);
        if (Math.random() < params.noise) {
          this.noise?.triggerAttackRelease('16n', time);
        }
      },
      notes,
      '8n',
    ).start(0);

    Tone.Transport.bpm.value = params.bpm;
    Tone.Transport.start('+0.02');
    this.isPlaying = true;
  }

  stop(): void {
    if (!this.Tone) {
      return;
    }
    this.Tone.Transport.stop();
    this.Tone.Transport.cancel();
    this.sequence?.dispose();
    this.sequence = undefined;
    this.synth?.dispose();
    this.synth = undefined;
    this.noise?.dispose();
    this.noise = undefined;
    this.channel?.dispose();
    this.channel = undefined;
    this.isPlaying = false;
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.channel) {
      this.channel.volume.value = volumeToDb(this.volume);
    }
  }

  getPlaying(): boolean {
    return this.isPlaying;
  }
}

function buildPattern(params: GeneratorParams): string[] {
  const notes: string[] = [];
  const stepCount = 8 + Math.floor(params.density * 8);
  for (let index = 0; index < stepCount; index += 1) {
    const note = params.scale[(index * 2 + params.seedHash) % params.scale.length];
    notes.push(note);
  }
  return notes;
}

function volumeToDb(volume: number): number {
  if (volume <= 0) {
    return -60;
  }
  return -36 + volume * 36;
}
