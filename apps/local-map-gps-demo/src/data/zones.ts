import type { ZoneDefinition } from '../types';

/**
 * 仮データ: 正式なゾーン名・境界ではありません。
 * 現地確認後、この配列の名称と正規化座標を差し替えます。
 * 配列の先頭ほど重複時の判定優先度が高くなります。
 */
export const zones: readonly ZoneDefinition[] = [
  {
    id: 'temp-reception',
    name: '受付・搬入エリア（仮）',
    shape: 'rectangle',
    points: [
      { x: 0.08, y: 0.1 },
      { x: 0.5, y: 0.56 },
    ],
  },
  {
    id: 'temp-processing',
    name: '処理エリア（仮）',
    shape: 'polygon',
    points: [
      { x: 0.5, y: 0.08 },
      { x: 0.93, y: 0.13 },
      { x: 0.88, y: 0.62 },
      { x: 0.56, y: 0.58 },
    ],
  },
  {
    id: 'temp-stockyard',
    name: 'ストックヤード（仮）',
    shape: 'polygon',
    points: [
      { x: 0.12, y: 0.58 },
      { x: 0.88, y: 0.64 },
      { x: 0.91, y: 0.92 },
      { x: 0.1, y: 0.9 },
    ],
  },
];
