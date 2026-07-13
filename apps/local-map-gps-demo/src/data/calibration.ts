import type { CalibrationPoint, DemoPosition } from '../types';

/**
 * 仮データ: 現地で測定した値ではありません。
 * 4点以上の最小二乗計算と画面フローを確認するための合成座標です。
 * 現地測定後、この配列だけを確定済みの基準点へ差し替えます。
 */
export const calibrationPoints: readonly CalibrationPoint[] = [
  { id: 'temp-nw', latitude: 35.001, longitude: 135.0, x: 0.08, y: 0.08 },
  { id: 'temp-ne', latitude: 35.001, longitude: 135.001, x: 0.92, y: 0.08 },
  { id: 'temp-se', latitude: 35.0, longitude: 135.001, x: 0.92, y: 0.92 },
  { id: 'temp-sw', latitude: 35.0, longitude: 135.0, x: 0.08, y: 0.92 },
];

/** 実GPSとは無関係な、画面確認専用の正規化座標です。 */
export const demoPosition: DemoPosition = {
  id: 'demo-center-yard',
  label: 'デモ位置',
  x: 0.46,
  y: 0.52,
};

/** 現地実測で見直す仮の精度警告値です。 */
export const lowAccuracyThresholdMeters = 50;
