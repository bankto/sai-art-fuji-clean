import type { CalibrationPoint, DemoPosition } from '../types';

/**
 * 現地測定済みの緯度経度と、注釈付き施設図の赤丸中心を対応させた基準点です。
 * x / y は 765 x 632 px の施設図全体に対する正規化座標です。
 */
export const calibrationPoints: readonly CalibrationPoint[] = [
  { id: 'cal-north-biogarden', latitude: 34.5781240, longitude: 133.9070370, x: 0.3608, y: 0.0981 },
  { id: 'cal-parking', latitude: 34.5778714, longitude: 133.9070820, x: 0.2693, y: 0.144 },
  { id: 'cal-central-rpf', latitude: 34.5775539, longitude: 133.9077844, x: 0.4889, y: 0.3703 },
  { id: 'cal-plastic-yard', latitude: 34.5774286, longitude: 133.9077498, x: 0.4118, y: 0.4573 },
  { id: 'cal-therapy-garden', latitude: 34.5766068, longitude: 133.9084378, x: 0.4549, y: 0.8022 },
  { id: 'cal-plastic-plant', latitude: 34.5763724, longitude: 133.9075017, x: 0.5582, y: 0.7152 },
];

/** 実GPSとは無関係な、画面確認専用の正規化座標です。 */
export const demoPosition: DemoPosition = {
  id: 'demo-center-yard',
  label: 'デモ位置',
  x: 0.48,
  y: 0.55,
};

/** 現地実機確認後に見直す仮の精度警告値です。 */
export const lowAccuracyThresholdMeters = 50;
