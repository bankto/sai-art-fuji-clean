import type { ArtworkSeed, GeneratorParams, PlaybackParams, RecognitionResult } from './types';

export const GENERATOR_VERSION = 'gomi-v1';

const palettes = [
  ['#101312', '#f2f0e6', '#d94f30', '#1f7a8c', '#f0b429'],
  ['#0f1418', '#e8e3d3', '#7c3aed', '#10b981', '#f97316'],
  ['#11100e', '#f6f1df', '#ef4444', '#2563eb', '#84cc16'],
  ['#121314', '#e9eef0', '#eab308', '#dc2626', '#0891b2'],
];

const noteSets = [
  ['C3', 'E3', 'G3', 'B3', 'D4', 'G4'],
  ['A2', 'C3', 'D3', 'E3', 'G3', 'A3'],
  ['D3', 'F3', 'A3', 'C4', 'E4', 'F4'],
  ['G2', 'B2', 'D3', 'F#3', 'A3', 'D4'],
];

export function createArtworkSeed(result: RecognitionResult, frameNonce: string): ArtworkSeed {
  const confidenceBucket = Math.round(result.confidence * 10) / 10;
  const source = [
    GENERATOR_VERSION,
    result.objectLabel,
    confidenceBucket.toFixed(1),
    frameNonce,
    Date.now().toString(36),
    crypto.getRandomValues(new Uint32Array(1))[0].toString(36),
  ].join('|');
  const hash = hashString(source).toString(36);
  const labelSlug = slugifyLabel(result.objectLabel);

  return {
    seed: `${GENERATOR_VERSION}-${labelSlug}-${hash}`,
    generatorVersion: GENERATOR_VERSION,
    objectLabel: result.objectLabel,
    confidence: result.confidence,
    createdAt: new Date().toISOString(),
  };
}

export function createArtworkSeedFromPlayback(params: PlaybackParams): ArtworkSeed {
  return {
    seed: params.seed,
    generatorVersion: params.generatorVersion,
    objectLabel: params.objectLabel || 'URL再生',
    confidence: 1,
    createdAt: new Date().toISOString(),
  };
}

export function deriveGeneratorParams(seed: string, version: string): GeneratorParams {
  const seedHash = hashString(`${version}:${seed}`);
  const random = mulberry32(seedHash);
  const palette = palettes[Math.floor(random() * palettes.length)];
  const scale = noteSets[Math.floor(random() * noteSets.length)];
  const waveforms: GeneratorParams['waveform'][] = ['sine', 'triangle', 'sawtooth', 'square'];

  return {
    seedHash,
    palette,
    background: palette[0],
    accent: palette[2],
    secondary: palette[3],
    lineCount: 9 + Math.floor(random() * 12),
    particleCount: 28 + Math.floor(random() * 44),
    rotation: random() * Math.PI * 2,
    bpm: 74 + Math.floor(random() * 52),
    scale,
    waveform: waveforms[Math.floor(random() * waveforms.length)],
    density: 0.35 + random() * 0.55,
    noise: 0.08 + random() * 0.22,
  };
}

export function readPlaybackParams(hash: string): PlaybackParams | null {
  return readRouteParams(hash, 'play');
}

export function readArParams(hash: string): PlaybackParams | null {
  return readRouteParams(hash, 'ar');
}

export function createShareHash(artwork: ArtworkSeed): string {
  return createRouteHash('play', artwork);
}

export function createArHash(artwork: ArtworkSeed): string {
  return createRouteHash('ar', artwork);
}

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function readRouteParams(hash: string, expectedRoute: 'play' | 'ar'): PlaybackParams | null {
  const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const [route, query = ''] = rawHash.split('?');
  if (route !== expectedRoute) {
    return null;
  }

  const params = new URLSearchParams(query);
  const seed = params.get('s');
  const generatorVersion = params.get('v');
  if (!seed || !generatorVersion) {
    return null;
  }

  return {
    seed,
    generatorVersion,
    objectLabel: params.get('label') || 'URL再生',
  };
}

function createRouteHash(route: 'play' | 'ar', artwork: ArtworkSeed): string {
  const params = new URLSearchParams({
    s: artwork.seed,
    v: artwork.generatorVersion,
    label: artwork.objectLabel,
  });
  return `#${route}?${params.toString()}`;
}

function slugifyLabel(label: string): string {
  const known: Record<string, string> = {
    アルミ片: 'aluminum',
    廃プラスチック: 'plastic',
    紙くず: 'paper',
    未認識: 'unknown',
  };
  return known[label] || hashString(label).toString(36);
}
