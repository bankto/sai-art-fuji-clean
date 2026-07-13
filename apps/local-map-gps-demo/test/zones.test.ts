import assert from 'node:assert/strict';
import test from 'node:test';
import type { ZoneDefinition } from '../src/types.ts';
import { containsPoint, findZone, validateZones } from '../src/zones.ts';

const rectangle: ZoneDefinition = {
  id: 'rect',
  name: '矩形',
  shape: 'rectangle',
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.6, y: 0.6 },
  ],
};

const polygon: ZoneDefinition = {
  id: 'poly',
  name: '三角形',
  shape: 'polygon',
  points: [
    { x: 0.4, y: 0.4 },
    { x: 0.9, y: 0.4 },
    { x: 0.65, y: 0.9 },
  ],
};

test('矩形とポリゴンの内部・境界・外部を判定する', () => {
  assert.equal(containsPoint(rectangle, { x: 0.2, y: 0.2 }), true);
  assert.equal(containsPoint(rectangle, { x: 0.1, y: 0.4 }), true);
  assert.equal(containsPoint(rectangle, { x: 0.8, y: 0.2 }), false);

  assert.equal(containsPoint(polygon, { x: 0.65, y: 0.6 }), true);
  assert.equal(containsPoint(polygon, { x: 0.4, y: 0.4 }), true);
  assert.equal(containsPoint(polygon, { x: 0.2, y: 0.8 }), false);
});

test('複数ゾーンが重なる場合は定義順を優先する', () => {
  const point = { x: 0.5, y: 0.5 };

  assert.equal(findZone(point, [rectangle, polygon])?.id, 'rect');
  assert.equal(findZone(point, [polygon, rectangle])?.id, 'poly');
});

test('画像内でもどのゾーンにも含まれなければゾーン外になる', () => {
  assert.equal(findZone({ x: 0.02, y: 0.98 }, [rectangle, polygon]), undefined);
});

test('ゾーンID・名称・点数・座標を検証する', () => {
  assert.doesNotThrow(() => validateZones([rectangle, polygon]));
  assert.throws(() => validateZones([rectangle, { ...polygon, id: rectangle.id }]));
  assert.throws(() => validateZones([{ ...rectangle, name: ' ' }]));
  assert.throws(() =>
    validateZones([
      {
        id: 'invalid',
        name: '範囲外',
        shape: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 1.1, y: 0 },
          { x: 0, y: 1 },
        ],
      },
    ]),
  );
});
