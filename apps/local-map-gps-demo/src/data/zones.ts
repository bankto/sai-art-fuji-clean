import type { ZoneDefinition } from '../types';

/**
 * 施設図のラベルと描画領域に合わせた暫定ゾーンです。
 * 正式な業務ゾーンの確定後、この配列の名称と正規化座標を差し替えます。
 * 配列の先頭ほど重複時の判定優先度が高くなります。
 */
export const zones: readonly ZoneDefinition[] = [
  {
    id: 'provisional-biogarden',
    name: 'ビオガーデン（暫定）',
    shape: 'polygon',
    points: [
      { x: 0.315, y: 0.035 },
      { x: 0.405, y: 0.035 },
      { x: 0.43, y: 0.175 },
      { x: 0.35, y: 0.22 },
      { x: 0.3, y: 0.15 },
    ],
  },
  {
    id: 'provisional-therapy-garden',
    name: 'セラピーガーデン（暫定）',
    shape: 'polygon',
    points: [
      { x: 0.2, y: 0.76 },
      { x: 0.48, y: 0.76 },
      { x: 0.51, y: 0.93 },
      { x: 0.25, y: 0.96 },
      { x: 0.15, y: 0.86 },
    ],
  },
  {
    id: 'provisional-plastic',
    name: '廃プラ関連（暫定）',
    shape: 'polygon',
    points: [
      { x: 0.38, y: 0.43 },
      { x: 0.66, y: 0.48 },
      { x: 0.65, y: 0.78 },
      { x: 0.49, y: 0.82 },
      { x: 0.4, y: 0.7 },
    ],
  },
  {
    id: 'provisional-mixed-waste-sorting',
    name: '混合廃棄物選別プラント（暫定）',
    shape: 'polygon',
    points: [
      { x: 0.35, y: 0.25 },
      { x: 0.56, y: 0.26 },
      { x: 0.61, y: 0.48 },
      { x: 0.49, y: 0.53 },
      { x: 0.34, y: 0.42 },
    ],
  },
  {
    id: 'provisional-wood-gravel',
    name: '木くず・砕石関連（暫定）',
    shape: 'polygon',
    points: [
      { x: 0.28, y: 0.54 },
      { x: 0.46, y: 0.52 },
      { x: 0.48, y: 0.76 },
      { x: 0.37, y: 0.85 },
      { x: 0.25, y: 0.74 },
    ],
  },
];
