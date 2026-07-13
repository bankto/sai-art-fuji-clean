import './styles.css';
import { hasCompiledTarget, startMindArSession, type MindArSession } from './ar';
import { getInAppBrowserOpenMessage, readFrameNonce, startCamera, stopCamera } from './camera';
import { Recognizer } from './recognition';
import {
  createArHash,
  createArtworkSeed,
  createArtworkSeedFromPlayback,
  deriveGeneratorParams,
  readArParams,
  readPlaybackParams,
} from './seed';
import { copyToClipboard, createArUrl, createShareUrl, renderQrCode } from './share';
import type { ArtworkSeed, GeneratorParams, RecognitionResult } from './types';
import { SoundEngine } from './audio';
import { ArtworkRenderer } from './visual';
import { canWriteWebNfc, getNfcFallbackMessage, writeUrlToNfc } from './nfc';
import { registerServiceWorker } from './pwa';

const recognitionIntervalMs = 1500;
// 実機フィードバック対応中は、将来検証用の導線だけをUIから一時的に隠す。
// 実装とDOMは残しているため、再開時はこのフラグとHTMLの hidden を戻す。
const deferredFeaturesEnabled = false;

class CameraArGomiDemo {
  private readonly recognizer = new Recognizer();
  private readonly sound = new SoundEngine();
  private readonly renderer: ArtworkRenderer;
  private readonly arTextureRenderer: ArtworkRenderer;
  private readonly arFallbackRenderer: ArtworkRenderer;
  private stream: MediaStream | undefined;
  private recognitionTimer = 0;
  private currentRecognition: RecognitionResult | undefined;
  private currentArtwork: ArtworkSeed | undefined;
  private currentParams: GeneratorParams | undefined;
  private arSession: MindArSession | undefined;

  private readonly views = {
    start: query<HTMLElement>('#start-view'),
    camera: query<HTMLElement>('#camera-view'),
    artwork: query<HTMLElement>('#artwork-view'),
    ar: query<HTMLElement>('#ar-view'),
  };

  private readonly status = query<HTMLElement>('#app-status');
  private readonly toast = query<HTMLElement>('#toast');
  private readonly video = query<HTMLVideoElement>('#camera-video');
  private readonly cameraMessage = query<HTMLElement>('#camera-message');
  private readonly recognitionLabel = query<HTMLElement>('#recognition-label');
  private readonly recognitionConfidence = query<HTMLElement>('#recognition-confidence');
  private readonly artworkLabel = query<HTMLElement>('#artwork-label');
  private readonly seedLabel = query<HTMLElement>('#seed-label');
  private readonly versionLabel = query<HTMLElement>('#version-label');
  private readonly shareUrlInput = query<HTMLInputElement>('#share-url-input');
  private readonly arUrlInput = query<HTMLInputElement>('#ar-url-input');
  private readonly qrCanvas = query<HTMLCanvasElement>('#qr-canvas');
  private readonly volumeInput = query<HTMLInputElement>('#volume-input');
  private readonly nfcMessage = query<HTMLElement>('#nfc-message');
  private readonly nfcWriteButton = query<HTMLButtonElement>('#nfc-write-button');
  private readonly arLayer = query<HTMLElement>('#mindar-layer');
  private readonly arTextureCanvas = query<HTMLCanvasElement>('#ar-texture-canvas');
  private readonly arFallbackPanel = query<HTMLElement>('#ar-fallback-panel');
  private readonly arStatus = query<HTMLElement>('#ar-status');

  constructor() {
    this.renderer = new ArtworkRenderer(query<HTMLCanvasElement>('#artwork-canvas'));
    this.arTextureRenderer = new ArtworkRenderer(this.arTextureCanvas);
    this.arFallbackRenderer = new ArtworkRenderer(query<HTMLCanvasElement>('#ar-fallback-canvas'));
  }

  init(): void {
    this.bindEvents();
    this.updateNfcSupport();

    const arParams = readArParams(window.location.hash);
    if (arParams) {
      this.loadArtwork(createArtworkSeedFromPlayback(arParams))
        .then(() => {
          if (deferredFeaturesEnabled) {
            this.showArView();
            return;
          }
          this.showToast('AR機能は現在一時非表示です。作品の通常再生を表示します。');
        })
        .catch((error: unknown) => {
          this.showToast(messageFromError(error));
          this.showView('start');
        });
      return;
    }

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
    this.stopArSession();
    this.sound.stop();
    this.renderer.stop();
    this.arTextureRenderer.stop();
    this.arFallbackRenderer.stop();
    stopCamera(this.stream);
  }

  private bindEvents(): void {
    query<HTMLButtonElement>('#start-button').addEventListener('click', () => {
      this.startExperience().catch((error: unknown) => this.showCameraError(error));
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
      this.stopArSession();
      if (!this.stream) {
        this.startExperience().catch((error: unknown) => this.showCameraError(error));
        return;
      }
      this.showView('camera');
    });
    query<HTMLButtonElement>('#save-png-button').addEventListener('click', () => {
      this.renderer.downloadPng();
      this.showToast('PNGを保存しました。');
    });
    query<HTMLButtonElement>('#copy-url-button').addEventListener('click', () => {
      copyToClipboard(this.shareUrlInput.value)
        .then(() => this.showToast('再生URLをコピーしました。'))
        .catch((error: unknown) => this.showToast(messageFromError(error)));
    });
    query<HTMLButtonElement>('#copy-ar-url-button').addEventListener('click', () => {
      copyToClipboard(this.arUrlInput.value)
        .then(() => this.showToast('AR URLをコピーしました。'))
        .catch((error: unknown) => this.showToast(messageFromError(error)));
    });
    query<HTMLButtonElement>('#open-ar-button').addEventListener('click', () => {
      this.openArRoute();
    });
    this.nfcWriteButton.addEventListener('click', () => {
      this.writeCurrentUrlToNfc().catch((error: unknown) => this.showToast(messageFromError(error)));
    });
    query<HTMLButtonElement>('#start-ar-button').addEventListener('click', () => {
      this.startArSession().catch((error: unknown) => this.showToast(messageFromError(error)));
    });
    query<HTMLButtonElement>('#stop-ar-button').addEventListener('click', () => {
      this.stopArSession();
      this.showArFallback('ARを停止しました。通常再生を表示しています。');
    });
    query<HTMLButtonElement>('#back-to-artwork-button').addEventListener('click', () => {
      this.stopArSession();
      this.showView('artwork');
      this.renderer.start();
    });
    this.volumeInput.addEventListener('input', () => {
      this.sound.setVolume(Number(this.volumeInput.value) / 100);
    });
    window.addEventListener('hashchange', () => {
      const arParams = readArParams(window.location.hash);
      if (arParams) {
        this.loadArtwork(createArtworkSeedFromPlayback(arParams))
          .then(() => {
            if (deferredFeaturesEnabled) {
              this.showArView();
              return;
            }
            this.showToast('AR機能は現在一時非表示です。作品の通常再生を表示します。');
          })
          .catch((error: unknown) => this.showToast(messageFromError(error)));
        return;
      }

      const playbackParams = readPlaybackParams(window.location.hash);
      if (playbackParams) {
        this.stopArSession();
        this.loadArtwork(createArtworkSeedFromPlayback(playbackParams)).catch((error: unknown) =>
          this.showToast(messageFromError(error)),
        );
      }
    });
  }

  private async startExperience(): Promise<void> {
    this.stopArSession();
    this.status.textContent = 'Starting';
    this.cameraMessage.textContent = '';

    const inAppBrowserMessage = getInAppBrowserOpenMessage();
    if (inAppBrowserMessage) {
      this.cameraMessage.textContent = inAppBrowserMessage;
      this.showToast(inAppBrowserMessage);
      this.status.textContent = 'Open in Safari/Chrome';
      return;
    }

    try {
      await this.sound.prepare();
    } catch {
      this.showToast('音声は再生ボタンで再試行します。');
    }

    this.stream = await startCamera(this.video);
    await this.recognizer.init();
    this.status.textContent = 'Recognizing';
    this.showView('camera');
    await this.runRecognition();
    this.startRecognitionLoop();
  }

  private startRecognitionLoop(): void {
    window.clearInterval(this.recognitionTimer);
    this.recognitionTimer = window.setInterval(() => {
      this.runRecognition().catch(() => {
        this.cameraMessage.textContent = '認識を一時停止しました。カメラを対象物へ向けたままお待ちください。';
      });
    }, recognitionIntervalMs);
  }

  private async runRecognition(): Promise<void> {
    this.status.textContent = 'Recognizing';
    const result = await this.recognizer.recognize(this.video);
    this.currentRecognition = result;
    this.recognitionLabel.textContent = result.objectLabel;
    this.recognitionConfidence.textContent = `${Math.round(result.confidence * 100)}%`;
    this.cameraMessage.textContent = '';
    this.status.textContent = 'Ready';
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
        mode: 'fallback',
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
    this.arTextureRenderer.setArtwork(artwork, params);
    this.arFallbackRenderer.setArtwork(artwork, params);
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
    const arUrl = createArUrl(artwork);
    this.shareUrlInput.value = shareUrl;
    this.arUrlInput.value = arUrl;
    await renderQrCode(this.qrCanvas, shareUrl);
    this.updateNfcSupport();
  }

  private async playArtwork(): Promise<void> {
    if (!this.currentParams) {
      throw new Error('作品がありません。');
    }
    this.sound.setVolume(Number(this.volumeInput.value) / 100);
    await this.sound.play(this.currentParams);
    this.renderer.start();
  }

  private openArRoute(): void {
    if (!deferredFeaturesEnabled) {
      this.showToast('AR機能は現在一時非表示です。');
      return;
    }
    if (!this.currentArtwork) {
      this.showToast('ARに渡す作品がありません。');
      return;
    }
    window.location.hash = createArHash(this.currentArtwork);
    this.showArView();
  }

  private showArView(): void {
    if (!this.currentArtwork) {
      this.showToast('ARに渡す作品がありません。');
      this.showView('start');
      return;
    }

    this.pauseRecognitionCamera();
    this.renderer.stop();
    this.arTextureRenderer.start();
    this.arFallbackRenderer.start();
    this.showArFallback('AR開始を押してターゲットをカメラに写してください。見失った場合は通常再生を継続します。');
    this.showView('ar');
    this.status.textContent = 'AR ready';
  }

  private async startArSession(): Promise<void> {
    if (!this.currentArtwork) {
      throw new Error('ARに渡す作品がありません。');
    }

    this.pauseRecognitionCamera();
    this.arTextureRenderer.start();
    this.arFallbackRenderer.start();
    this.stopArSession();

    this.showArFallback('MindARターゲットを確認しています。');
    const targetReady = await hasCompiledTarget();
    if (!targetReady) {
      this.showArFallback('gomi-target.mind が未生成のため、通常再生フォールバックを表示しています。READMEの手順で生成後に再実行してください。');
      this.status.textContent = 'AR target missing';
      return;
    }

    this.showArFallback('MindARを読み込み中です。カメラ許可後、印刷ターゲットを写してください。');
    this.arSession = await startMindArSession({
      container: this.arLayer,
      sourceCanvas: this.arTextureCanvas,
      onTargetFound: () => {
        this.arFallbackPanel.classList.remove('visible');
        this.status.textContent = 'AR tracking';
      },
      onTargetLost: () => {
        this.showArFallback('ターゲットを見失いました。通常再生フォールバックを表示しています。');
        this.status.textContent = 'AR fallback';
      },
    });
    this.status.textContent = 'AR scanning';
  }

  private stopArSession(): void {
    this.arSession?.stop();
    this.arSession = undefined;
  }

  private showArFallback(message: string): void {
    this.arFallbackPanel.classList.add('visible');
    this.arStatus.textContent = message;
  }

  private async writeCurrentUrlToNfc(): Promise<void> {
    const url = this.shareUrlInput.value;
    if (!url) {
      throw new Error('NFCに書き込むURLがありません。');
    }

    this.nfcMessage.textContent = 'NFCタグをスマホに近づけてください。';
    await writeUrlToNfc(url);
    this.nfcMessage.textContent = '共有URLをNFCタグに書き込みました。iPhoneでは標準タグ読み取りで開く想定です。';
    this.showToast('NFCタグに書き込みました。');
  }

  private updateNfcSupport(): void {
    const supported = canWriteWebNfc();
    this.nfcWriteButton.classList.toggle('hidden', !supported);
    this.nfcMessage.textContent = supported
      ? 'Android ChromeのWeb NFC対応環境です。共有URLをNDEF URLレコードとして書き込みます。'
      : getNfcFallbackMessage();
  }

  private pauseRecognitionCamera(): void {
    window.clearInterval(this.recognitionTimer);
    this.recognitionTimer = 0;
    stopCamera(this.stream);
    this.stream = undefined;
  }

  private showView(viewName: keyof CameraArGomiDemo['views']): void {
    Object.entries(this.views).forEach(([name, element]) => {
      element.classList.toggle('hidden', name !== viewName);
    });
    document.body.dataset.activeView = viewName;
  }

  private showCameraError(error: unknown): void {
    const message = messageFromCameraError(error);
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

function messageFromCameraError(error: unknown): string {
  if (error instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(error.name)) {
    return 'カメラ権限が拒否されています。ブラウザまたはOSの設定からこのサイトのカメラ許可を有効にし、ページを再読み込みしてください。';
  }
  return messageFromError(error);
}

const app = new CameraArGomiDemo();
app.init();
registerServiceWorker();

window.addEventListener('beforeunload', () => app.dispose());
