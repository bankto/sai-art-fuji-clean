import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CalibrationError,
  fitAffineTransform,
  isWithinMap,
  projectCoordinates,
} from '../src/affine.ts';
import type { CalibrationPoint } from '../src/types.ts';

const exactPoints: readonly CalibrationPoint[] = [
  { id: 'nw', latitude: 35.001, longitude: 135, x: 0, y: 0 },
  { id: 'ne', latitude: 35.001, longitude: 135.001, x: 1, y: 0 },
  { id: 'sw', latitude: 35, longitude: 135, x: 0, y: 1 },
];

function assertClose(actual: number, expected: number, tolerance = 1e-8): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not close to ${expected}`);
}

test('3基準点を正規化画像座標へ射影する', () => {
  const transform = fitAffineTransform(exactPoints);

  for (const point of exactPoints) {
    const projected = projectCoordinates(transform, point.latitude, point.longitude);
    assertClose(projected.x, point.x);
    assertClose(projected.y, point.y);
  }

  const center = projectCoordinates(transform, 35.0005, 135.0005);
  assertClose(center.x, 0.5);
  assertClose(center.y, 0.5);
});

test('4点以上の過剰決定系を最小二乗で近似する', () => {
  const noisyPoints: readonly CalibrationPoint[] = [
    { id: 'p1', latitude: 35, longitude: 135, x: 0.1, y: 0.9 },
    { id: 'p2', latitude: 35, longitude: 135.001, x: 0.91, y: 0.89 },
    { id: 'p3', latitude: 35.001, longitude: 135, x: 0.09, y: 0.11 },
    { id: 'p4', latitude: 35.001, longitude: 135.001, x: 0.9, y: 0.1 },
    { id: 'p5', latitude: 35.0005, longitude: 135.0005, x: 0.51, y: 0.49 },
  ];

  const transform = fitAffineTransform(noisyPoints);
  const center = projectCoordinates(transform, 35.0005, 135.0005);

  assertClose(center.x, 0.502, 0.015);
  assertClose(center.y, 0.498, 0.015);
});

test('画像範囲の内外を端で丸めず判定する', () => {
  const transform = fitAffineTransform(exactPoints);
  const inside = projectCoordinates(transform, 35.0005, 135.0005);
  const outside = projectCoordinates(transform, 35.0005, 135.002);

  assert.equal(isWithinMap(inside), true);
  assert.equal(isWithinMap({ x: 0, y: 1 }), true);
  assert.equal(isWithinMap(outside), false);
});

test('基準点不足・重複・一直線・数値不正を拒否する', () => {
  assert.throws(() => fitAffineTransform(exactPoints.slice(0, 2)), CalibrationError);

  assert.throws(
    () =>
      fitAffineTransform([
        exactPoints[0],
        { ...exactPoints[1], id: exactPoints[0].id },
        exactPoints[2],
      ]),
    CalibrationError,
  );

  assert.throws(
    () =>
      fitAffineTransform([
        exactPoints[0],
        {
          ...exactPoints[1],
          id: 'duplicate-coordinate',
          latitude: exactPoints[0].latitude,
          longitude: exactPoints[0].longitude,
        },
        exactPoints[2],
      ]),
    CalibrationError,
  );

  assert.throws(
    () =>
      fitAffineTransform([
        { id: 'a', latitude: 35, longitude: 135, x: 0, y: 0 },
        { id: 'b', latitude: 35.001, longitude: 135.001, x: 0.5, y: 0.5 },
        { id: 'c', latitude: 35.002, longitude: 135.002, x: 1, y: 1 },
      ]),
    CalibrationError,
  );

  assert.throws(
    () => fitAffineTransform([{ ...exactPoints[0], x: Number.NaN }, exactPoints[1], exactPoints[2]]),
    CalibrationError,
  );
});
