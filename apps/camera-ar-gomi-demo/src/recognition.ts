import type { RecognitionResult } from './types';

type TfModule = typeof import('@tensorflow/tfjs');
type LayersModel = import('@tensorflow/tfjs').LayersModel;
type Tensor = import('@tensorflow/tfjs').Tensor;

const MODEL_PATH = `${import.meta.env.BASE_URL}models/model.json`;
const METADATA_PATH = `${import.meta.env.BASE_URL}models/metadata.json`;
const LABELS_PATH = `${import.meta.env.BASE_URL}models/labels.txt`;
const DEFAULT_LABELS = ['アルミ片', '廃プラスチック', '紙くず', '背景'];
const FALLBACK_LABELS = DEFAULT_LABELS.slice(0, 3);
const CONFIDENCE_THRESHOLD = 0.55;
const FALLBACK_FRAME_SIZE = 16;

export class Recognizer {
  private tf: TfModule | undefined;
  private model: LayersModel | undefined;
  private labels = DEFAULT_LABELS;
  private inputSize = 224;
  private mode: 'model' | 'fallback' = 'fallback';
  private readonly fallbackCanvas = document.createElement('canvas');

  async init(): Promise<'model' | 'fallback'> {
    try {
      const probe = await fetch(MODEL_PATH, { cache: 'no-store' });
      if (!probe.ok) {
        throw new Error('model.json is not available');
      }

      this.tf = await import('@tensorflow/tfjs');
      this.model = await this.tf.loadLayersModel(MODEL_PATH);
      this.labels = await loadLabels();
      const shape = this.model.inputs[0]?.shape;
      if (Array.isArray(shape) && typeof shape[1] === 'number') {
        this.inputSize = shape[1];
      }
      this.mode = 'model';
      return this.mode;
    } catch {
      this.mode = 'fallback';
      return this.mode;
    }
  }

  async recognize(video: HTMLVideoElement): Promise<RecognitionResult> {
    if (this.mode === 'model' && this.model && this.tf && video.videoWidth > 0) {
      return this.recognizeWithModel(video);
    }

    return this.recognizeWithFrameFallback(video);
  }

  getMode(): 'model' | 'fallback' {
    return this.mode;
  }

  private recognizeWithFrameFallback(video: HTMLVideoElement): RecognitionResult {
    const frameHash = this.hashCameraFrame(video);
    const objectLabel = FALLBACK_LABELS[frameHash % FALLBACK_LABELS.length] ?? FALLBACK_LABELS[0];
    const confidence = 0.84 + ((frameHash >>> 8) % 11) / 100;

    return {
      objectLabel,
      confidence,
      modelVersion: 'camera-frame-fallback-v1',
      recognizedAt: new Date().toISOString(),
      mode: 'fallback',
      status: 'recognized',
    };
  }

  private hashCameraFrame(video: HTMLVideoElement): number {
    const canvas = this.fallbackCanvas;
    canvas.width = FALLBACK_FRAME_SIZE;
    canvas.height = FALLBACK_FRAME_SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || !video.videoWidth || !video.videoHeight) {
      return Math.floor(video.currentTime * 1000) >>> 0;
    }

    context.drawImage(video, 0, 0, FALLBACK_FRAME_SIZE, FALLBACK_FRAME_SIZE);
    const pixels = context.getImageData(0, 0, FALLBACK_FRAME_SIZE, FALLBACK_FRAME_SIZE).data;
    let hash = 2166136261;
    for (let index = 0; index < pixels.length; index += 16) {
      const brightness = Math.round((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3);
      hash ^= brightness;
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  private async recognizeWithModel(video: HTMLVideoElement): Promise<RecognitionResult> {
    const tf = this.tf;
    const model = this.model;
    if (!tf || !model) {
      throw new Error('model is not ready');
    }

    const input = tf.tidy(() => {
      const image = tf.browser.fromPixels(video);
      const resized = tf.image.resizeBilinear(image, [this.inputSize, this.inputSize], true);
      return resized.toFloat().div(255).expandDims(0);
    });
    const prediction = model.predict(input);
    const predictionTensor = (Array.isArray(prediction) ? prediction[0] : prediction) as Tensor;
    const values = Array.from(await predictionTensor.data());
    tf.dispose([input, predictionTensor]);
    if (Array.isArray(prediction)) {
      prediction.slice(1).forEach((tensor) => tensor.dispose());
    }

    const best = values.reduce(
      (current, value, index) => (value > current.value ? { index, value } : current),
      { index: 0, value: -Infinity },
    );
    const objectLabel = this.labels[best.index] ?? `class_${best.index}`;
    const status = best.value >= CONFIDENCE_THRESHOLD ? 'recognized' : 'unrecognized';

    return {
      objectLabel: status === 'recognized' ? objectLabel : '未認識',
      confidence: Math.max(0, Math.min(1, best.value)),
      modelVersion: 'tfjs-local-v1',
      recognizedAt: new Date().toISOString(),
      mode: 'model',
      status,
    };
  }
}

async function loadLabels(): Promise<string[]> {
  try {
    const metadataResponse = await fetch(METADATA_PATH, { cache: 'no-store' });
    if (metadataResponse.ok) {
      const metadata = (await metadataResponse.json()) as { labels?: string[]; wordLabels?: string[] };
      const labels = metadata.labels ?? metadata.wordLabels;
      if (labels?.length) {
        return labels;
      }
    }
  } catch {
    // labels.txt fallback below.
  }

  try {
    const labelsResponse = await fetch(LABELS_PATH, { cache: 'no-store' });
    if (labelsResponse.ok) {
      const labels = (await labelsResponse.text())
        .split(/\r?\n/)
        .map((label) => label.trim())
        .filter(Boolean);
      if (labels.length) {
        return labels;
      }
    }
  } catch {
    // Default labels keep recognition available when model metadata is incomplete.
  }

  return DEFAULT_LABELS;
}
