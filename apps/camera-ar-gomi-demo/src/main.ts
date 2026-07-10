import './styles.css';
import { readFrameNonce, startCamera, stopCamera } from './camera';
import { Recognizer } from './recognition';
import {
  createArtworkSeed,
  createArtworkSeedFromPlayback,
  deriveGeneratorParams,
  readPlaybackParams,
} from './seed';
import { copyToClipboard, createShareUrl, renderQrCode } from './share';
import type { ArtworkSeed, GeneratorParams, RecognitionResult } from './types';
import { SoundEngine } from './audio';
import { ArtworkRenderer } from './visual';

const recognitionIntervalMs = 1500;

class CameraArGomiDemo {
  private readonly recognizer = new Recognizer();
  private readonly sound = new SoundEngine();
  private readonly renderer: ArtworkRenderer;
  private stream: MediaStream | undefined;
  private recognitionTimer = 0;
  private currentRecognition: RecognitionResult | undefined;
  private currentArtwork: ArtworkSeed | undefined;
  private currentParams: GeneratorParams | undefined;

  private readonly views = {
    start: query<HTMLElement>('#start-view'),
    camera: query<HTMLElement>('#camera-view'),
    artwork: query<HTMLElement>('#artwork-view'),
  };

  private readonly status = query<HTMLElement>('#app-status');
  private readonly toast = query<HTMLElement>('#toast');
  private readonly video = query<HTMLVideoElement>('#camera-video');
  private readonly cameraMessage = query<HTMLElement>('#camera-message');
  private readonly demoLabelSelect = query<HTMLSelectElement>('#demo-label-select');
  private readonly recognitionLabel = query<HTMLElement>('#recognition-label');
  private readonly recognitionConfidence = query<HTMLElement>('#recognition-confidence');
  private readonly artworkLabel = query<HTMLElement>('#artwork-label');
  private readonly seedLabel = query<HTMLElement>('#seed-label');
  private readonly versionLabel = query<HTMLElement>('#version-label');
  private readonly shareUrlInput = query<HTMLInputElement>('#share-url-input');
  private readonly qrCanvas = query<HTMLCanvasElement>('#qr-canvas');
  private readonly volumeInput = query<HTMLInputElement>('#volume-input');

  constructor() {
    this.renderer = new ArtworkRenderer(query<HTMLCanvasElement>('#artwork-canvas'));
  }

  init(): void {
    this.bindEvents();
    const playbackParams = readPlaybackParams(window.location.hash);
    if (playbackParams) {
      this.loadArtwork(createArtworkSeedFromPlayback(playbackParams)).catch((error: unknown) => {
        this.showToast(messageFromError(error));
        this.showView('start');
      });
      return;
    }
    this.showView('start');
  }

  dispose(): void {
    window.clearInterval(this.recognitionTimer);
    this.sound.stop();
    this.renderer.stop();
    stopCamera(this.stream);
  }

  private bindEvents(): void {
    query<HTMLButtonElement>('#start-button').addEventListener('click', () => {
      this.startExperience().catch((error: unknown) => this.showCameraError(error));
    });
    query<HTMLButtonElement>('#recognize-button').addEventListener('click', () => {
      this.runRecognition().catch((error: unknown) => this.showCameraError(error));
    });
    query<HTMLButtonElement>('#generate-button').addEventListener('click', () => {
      this.generateArtwork().catch((error: unknown) => this.showCameraError(error));
    });
    query<HTMLButtonElement>('#play-button').addEventListener('click', () => {
      this.playArtwork().catch((error: unknown) => this.showToast(messageFromError(error)));
    });
    query<HTMLButtonElement>('#stop-button').addEventListener('click', () => {
      this.sound.stop();
      this.renderer.stop();
    });
    query<HTMLButtonElement>('#regenerate-button').addEventListener('click', () => {
      this.regenerateArtwork().catch((error: unknown) => this.showToast(messageFromError(error)));
    });
    query<HTMLButtonElement>('#rescan-button').addEventListener('click', () => {
      this.sound.stop();
      this.renderer.stop();
      this.showView('camera');
    });
    query<HTMLButtonElement>('#save-png-button').addEventListener('click', () => {
      this.renderer.downloadPng();
      this.showToast('PNGを保存しました。');
    });
    query<HTMLButtonElement>('#copy-url-button').addEventListener('click', () => {
      copyToClipboard(this.shareUrlInput.value)
        .then(() => this.showToast('URLをコピーしました。'))
        .catch((error: unknown) => this.showToast(messageFromError(error)));
    });
    this.volumeInput.addEventListener('input', () => {
      this.sound.setVolume(Number(this.volumeInput.value) / 100);
    });
    window.addEventListener('hashchange', () => {
      const playbackParams = readPlaybackParams(window.location.hash);
      if (playbackParams) {
        this.loadArtwork(createArtworkSeedFromPlayback(playbackParams)).catch((error: unknown) =>
          this.showToast(messageFromError(error)),
        );
      }
    });
  }

  private async startExperience(): Promise<void> {
    this.status.textContent = 'Starting';
    this.cameraMessage.textContent = '';
    try {
      await this.sound.prepare();
    } catch {
      this.showToast('音声は再生ボタンで再試行します。');
    }

    this.stream = await startCamera(this.video);
    const mode = await this.recognizer.init();
    this.status.textContent = mode === 'model' ? 'TF.js model' : 'Demo mode';
    this.showView('camera');
    await this.runRecognition();
    this.startRecognitionLoop();
  }

  private startRecognitionLoop(): void {
    window.clearInterval(this.recognitionTimer);
    this.recognitionTimer = window.setInterval(() => {
      this.runRecognition().catch(() => {
        this.cameraMessage.textContent = '認識を一時停止しました。手動更新を試してください。';
      });
    }, recognitionIntervalMs);
  }

  private async runRecognition(): Promise<void> {
    const result = await this.recognizer.recognize(this.video, this.demoLabelSelect.value);
    this.currentRecognition = result;
    this.recognitionLabel.textContent = result.objectLabel;
    this.recognitionConfidence.textContent = `${Math.round(result.confidence * 100)}%`;
    this.cameraMessage.textContent =
      result.mode === 'demo'
        ? 'デモモード: public/models にモデルを置くと自動認識へ切り替わります。'
        : `モデル認識: ${result.modelVersion}`;
  }

  private async generateArtwork(): Promise<void> {
    if (!this.currentRecognition) {
      await this.runRecognition();
    }
    const recognition = this.currentRecognition;
    if (!recognition || recognition.status === 'unrecognized') {
      throw new Error('対象物を認識してから生成してください。');
    }

    const artwork = createArtworkSeed(recognition, readFrameNonce(this.video));
    await this.loadArtwork(artwork);
  }

  private async regenerateArtwork(): Promise<void> {
    if (!this.currentRecognition || this.currentRecognition.status === 'unrecognized') {
      const label = this.currentArtwork?.objectLabel ?? 'アルミ片';
      this.currentRecognition = {
        objectLabel: label,
        confidence: 0.9,
        modelVersion: 'replay-regenerate-v1',
        recognizedAt: new Date().toISOString(),
        mode: 'demo',
        status: 'recognized',
      };
    }
    await this.generateArtwork();
  }

  private async loadArtwork(artwork: ArtworkSeed): Promise<void> {
    this.currentArtwork = artwork;
    const params = deriveGeneratorParams(artwork.seed, artwork.generatorVersion);
    this.currentParams = params;
    this.renderer.setArtwork(artwork, params);
    this.renderer.start();
    this.renderArtworkMeta(artwork);
    await this.renderShare(artwork);
    this.showView('artwork');
    this.status.textContent = 'Ready';
  }

  private renderArtworkMeta(artwork: ArtworkSeed): void {
    this.artworkLabel.textContent = artwork.objectLabel;
    this.seedLabel.textContent = artwork.seed;
    this.versionLabel.textContent = artwork.generatorVersion;
  }

  private async renderShare(artwork: ArtworkSeed): Promise<void> {
    const shareUrl = createShareUrl(artwork);
    this.shareUrlInput.value = shareUrl;
    await renderQrCode(this.qrCanvas, shareUrl);
  }

  private async playArtwork(): Promise<void> {
    if (!this.currentParams) {
      throw new Error('作品がありません。');
    }
    this.sound.setVolume(Number(this.volumeInput.value) / 100);
    await this.sound.play(this.currentParams);
    this.renderer.start();
  }

  private showView(viewName: keyof CameraArGomiDemo['views']): void {
    Object.entries(this.views).forEach(([name, element]) => {
      element.classList.toggle('hidden', name !== viewName);
    });
  }

  private showCameraError(error: unknown): void {
    const message = messageFromError(error);
    this.cameraMessage.textContent = message;
    this.showToast(message);
    this.status.textContent = 'Error';
  }

  private showToast(message: string): void {
    this.toast.textContent = message;
    this.toast.classList.add('visible');
    window.setTimeout(() => this.toast.classList.remove('visible'), 2600);
  }
}

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`${selector} が見つかりません。`);
  }
  return element;
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '処理に失敗しました。';
}

const app = new CameraArGomiDemo();
app.init();

window.addEventListener('beforeunload', () => app.dispose());
