import './styles.css';
import { fitAffineTransform, isWithinMap, projectCoordinates } from './affine';
import {
  calibrationPoints,
  demoPosition,
  lowAccuracyThresholdMeters,
} from './data/calibration';
import { zones } from './data/zones';
import {
  GeolocationFailure,
  requestCurrentPosition,
  type GeolocationFailureReason,
  type PositionSnapshot,
} from './geolocation';
import type { AffineTransform, NormalizedPoint, ZoneDefinition } from './types';
import { findZone, validateZones, zonePolygonPoints } from './zones';

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Required element not found: ${id}`);
  }
  return element as T;
}

const facilityMap = requiredElement<HTMLImageElement>('facility-map');
const mapFrame = requiredElement<HTMLDivElement>('map-frame');
const mapLoading = requiredElement<HTMLDivElement>('map-loading');
const positionMarker = requiredElement<HTMLDivElement>('position-marker');
const markerLabel = requiredElement<HTMLSpanElement>('marker-label');
const gpsButton = requiredElement<HTMLButtonElement>('gps-button');
const demoButton = requiredElement<HTMLButtonElement>('demo-button');
const stateChip = requiredElement<HTMLSpanElement>('state-chip');
const statusTitle = requiredElement<HTMLHeadingElement>('status-title');
const statusMessage = requiredElement<HTMLParagraphElement>('status-message');
const sourceValue = requiredElement<HTMLElement>('source-value');
const zoneValue = requiredElement<HTMLElement>('zone-value');
const accuracyValue = requiredElement<HTMLElement>('accuracy-value');
const timestampValue = requiredElement<HTMLElement>('timestamp-value');
const zoneLayerNode = document.getElementById('zone-layer');

if (!(zoneLayerNode instanceof SVGSVGElement)) {
  throw new Error('Required SVG element not found: zone-layer');
}
const zoneLayer = zoneLayerNode;

let mapReady = false;
let calibration: AffineTransform | undefined;
let configurationError = false;

function setState(
  chip: string,
  tone: 'idle' | 'loading' | 'success' | 'warning' | 'error' | 'demo',
  title: string,
  message: string,
): void {
  stateChip.textContent = chip;
  stateChip.dataset.tone = tone;
  statusTitle.textContent = title;
  statusMessage.textContent = message;
}

function setDemoEmphasis(emphasized: boolean): void {
  demoButton.dataset.emphasis = emphasized ? 'true' : 'false';
}

function resetResults(): void {
  sourceValue.textContent = '—';
  zoneValue.textContent = '—';
  accuracyValue.textContent = '—';
  timestampValue.textContent = '—';
  positionMarker.hidden = true;
}

function renderZoneLayer(): void {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  for (const zone of zones) {
    const polygon = document.createElementNS(svgNamespace, 'polygon');
    polygon.setAttribute(
      'points',
      zonePolygonPoints(zone)
        .map((point) => `${point.x * 100},${point.y * 100}`)
        .join(' '),
    );
    polygon.dataset.zoneId = zone.id;
    zoneLayer.append(polygon);
  }
}

function highlightZone(zone: ZoneDefinition | undefined): void {
  zoneLayer.querySelectorAll<SVGPolygonElement>('polygon').forEach((polygon) => {
    polygon.classList.toggle('is-active', polygon.dataset.zoneId === zone?.id);
  });
}

function placeMarker(point: NormalizedPoint, label: string, demo: boolean): ZoneDefinition | undefined {
  positionMarker.style.left = `${point.x * 100}%`;
  positionMarker.style.top = `${point.y * 100}%`;
  positionMarker.dataset.source = demo ? 'demo' : 'gps';
  markerLabel.textContent = label;
  positionMarker.hidden = false;

  const zone = findZone(point, zones);
  zoneValue.textContent = zone?.name ?? 'ゾーン外';
  highlightZone(zone);
  return zone;
}

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}

function showDemoPosition(): void {
  if (!mapReady) {
    setState('読込待ち', 'warning', '施設図を表示できません', '施設図を再読み込みしてからお試しください。');
    return;
  }
  if (!isWithinMap(demoPosition)) {
    resetResults();
    setState('設定エラー', 'error', 'デモ位置の設定が不正です', 'デモ位置データを確認してください。');
    return;
  }

  placeMarker(demoPosition, demoPosition.label, true);
  sourceValue.textContent = 'デモ位置（仮）';
  accuracyValue.textContent = 'GPS未使用';
  timestampValue.textContent = formatTimestamp(Date.now());
  setState(
    'デモ表示',
    'demo',
    'デモ位置を表示しています',
    '実GPSではない仮の位置です。ゾーン判定とマーカー表示の確認に使用します。',
  );
  setDemoEmphasis(false);
}

function showProjectedPosition(snapshot: PositionSnapshot): void {
  if (!calibration) {
    resetResults();
    setState(
      '設定エラー',
      'error',
      'GPS基準点を読み込めません',
      'デモ位置で表示を確認し、キャリブレーションデータを見直してください。',
    );
    setDemoEmphasis(true);
    return;
  }

  const projected = projectCoordinates(calibration, snapshot.latitude, snapshot.longitude);
  if (!isWithinMap(projected)) {
    resetResults();
    sourceValue.textContent = '実GPS';
    accuracyValue.textContent = `±${Math.round(snapshot.accuracy)} m`;
    timestampValue.textContent = formatTimestamp(snapshot.timestamp);
    zoneValue.textContent = '施設範囲外';
    highlightZone(undefined);
    setState(
      '範囲外',
      'warning',
      '施設範囲外です',
      '現在地は施設図の範囲外に射影されました。デモ位置でも動作を確認できます。',
    );
    setDemoEmphasis(true);
    return;
  }

  placeMarker(projected, '現在地', false);
  sourceValue.textContent = '実GPS';
  accuracyValue.textContent = `±${Math.round(snapshot.accuracy)} m`;
  timestampValue.textContent = formatTimestamp(snapshot.timestamp);

  const lowAccuracy = snapshot.accuracy > lowAccuracyThresholdMeters;
  setState(
    lowAccuracy ? '精度注意' : '取得完了',
    lowAccuracy ? 'warning' : 'success',
    lowAccuracy ? '現在地を表示しました（精度注意）' : '現在地を表示しました',
    lowAccuracy
      ? '精度が低いため表示は目安です。現地でマーカー位置をご確認ください。'
      : '仮キャリブレーションで施設図へ射影しています。',
  );
  setDemoEmphasis(false);
}

const failureMessages: Record<GeolocationFailureReason, readonly [string, string]> = {
  unsupported: ['位置情報に対応していません', 'このブラウザでは位置情報を取得できません。'],
  'insecure-context': ['安全な接続が必要です', 'HTTPSまたはlocalhostで開いてください。'],
  'permission-denied': [
    '位置情報が拒否されました',
    'ブラウザ設定で位置情報を許可して再取得するか、デモ位置をお試しください。',
  ],
  'position-unavailable': ['位置を取得できません', '電波状況を確認して再取得するか、デモ位置をお試しください。'],
  timeout: ['位置情報の取得がタイムアウトしました', 'もう一度取得するか、デモ位置をお試しください。'],
  unknown: ['位置情報の取得に失敗しました', 'もう一度取得するか、デモ位置をお試しください。'],
};

function showGeolocationFailure(reason: GeolocationFailureReason): void {
  const [title, message] = failureMessages[reason];
  resetResults();
  highlightZone(undefined);
  setState('取得失敗', 'error', title, message);
  setDemoEmphasis(true);
}

async function locate(): Promise<void> {
  if (!mapReady || configurationError) return;

  gpsButton.disabled = true;
  gpsButton.textContent = '取得中…';
  setDemoEmphasis(false);
  setState('取得中', 'loading', '現在地を取得しています', 'ブラウザの位置情報確認に応答してください。');

  try {
    const snapshot = await requestCurrentPosition(navigator.geolocation, window.isSecureContext);
    showProjectedPosition(snapshot);
  } catch (error) {
    showGeolocationFailure(error instanceof GeolocationFailure ? error.reason : 'unknown');
  } finally {
    gpsButton.disabled = false;
    gpsButton.textContent = '現在地を更新';
  }
}

function handleMapReady(): void {
  if (mapReady) return;
  mapReady = true;
  mapFrame.dataset.loaded = 'true';
  mapLoading.hidden = true;
  gpsButton.disabled = configurationError;

  if (!configurationError) {
    setState(
      '準備完了',
      'idle',
      '現在地を表示できます',
      'ボタンを押すと位置情報の許可を確認します。デモ位置はいつでも使用できます。',
    );
  }
}

function handleMapError(): void {
  mapReady = false;
  gpsButton.disabled = true;
  resetResults();
  mapLoading.textContent = '施設図を読み込めませんでした';
  setState(
    '画像エラー',
    'error',
    '施設図を読み込めませんでした',
    'ページを再読み込みしてください。位置情報の取得は開始しません。',
  );
}

try {
  validateZones(zones);
  calibration = fitAffineTransform(calibrationPoints);
  renderZoneLayer();
} catch {
  configurationError = true;
  setState(
    '設定エラー',
    'error',
    '仮データの設定が不正です',
    '実GPSは表示できません。デモ位置データを確認してください。',
  );
  setDemoEmphasis(true);
}

facilityMap.addEventListener('load', handleMapReady);
facilityMap.addEventListener('error', handleMapError);
gpsButton.addEventListener('click', () => void locate());
demoButton.addEventListener('click', showDemoPosition);

if (facilityMap.complete) {
  if (facilityMap.naturalWidth > 0) handleMapReady();
  else handleMapError();
}
