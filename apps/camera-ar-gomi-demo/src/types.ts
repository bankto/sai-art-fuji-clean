export type RecognitionMode = 'model' | 'demo';

export interface RecognitionResult {
  objectLabel: string;
  confidence: number;
  modelVersion: string;
  recognizedAt: string;
  mode: RecognitionMode;
  status: 'recognized' | 'unrecognized';
}

export interface ArtworkSeed {
  seed: string;
  generatorVersion: string;
  objectLabel: string;
  confidence: number;
  createdAt: string;
}

export interface PlaybackParams {
  seed: string;
  generatorVersion: string;
  objectLabel: string;
}

export interface GeneratorParams {
  seedHash: number;
  palette: string[];
  background: string;
  accent: string;
  secondary: string;
  lineCount: number;
  particleCount: number;
  rotation: number;
  bpm: number;
  scale: string[];
  waveform: 'sine' | 'triangle' | 'sawtooth' | 'square';
  density: number;
  noise: number;
}
