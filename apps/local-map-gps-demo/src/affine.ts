import type { AffineTransform, CalibrationPoint, NormalizedPoint } from './types';

const EPSILON = 1e-14;

export class CalibrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalibrationError';
  }
}

function validateCalibrationPoints(points: readonly CalibrationPoint[]): void {
  if (points.length < 3) {
    throw new CalibrationError('基準点は3点以上必要です。');
  }

  const ids = new Set<string>();
  const coordinates = new Set<string>();

  for (const point of points) {
    if (!point.id || ids.has(point.id)) {
      throw new CalibrationError('基準点IDが空、または重複しています。');
    }
    ids.add(point.id);

    if (
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude) ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y)
    ) {
      throw new CalibrationError('基準点に数値でない値が含まれています。');
    }

    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
      throw new CalibrationError('画像座標は0〜1の範囲で指定してください。');
    }

    const coordinateKey = `${point.latitude}:${point.longitude}`;
    if (coordinates.has(coordinateKey)) {
      throw new CalibrationError('同じ緯度経度の基準点が重複しています。');
    }
    coordinates.add(coordinateKey);
  }

  const longitudeSpan = Math.max(...points.map((point) => point.longitude)) - Math.min(...points.map((point) => point.longitude));
  const latitudeSpan = Math.max(...points.map((point) => point.latitude)) - Math.min(...points.map((point) => point.latitude));
  const scale = Math.max(longitudeSpan, latitudeSpan);
  let maximumTwiceArea = 0;

  for (let first = 0; first < points.length - 2; first += 1) {
    for (let second = first + 1; second < points.length - 1; second += 1) {
      for (let third = second + 1; third < points.length; third += 1) {
        const twiceArea = Math.abs(
          (points[second].longitude - points[first].longitude) *
            (points[third].latitude - points[first].latitude) -
            (points[third].longitude - points[first].longitude) *
              (points[second].latitude - points[first].latitude),
        );
        maximumTwiceArea = Math.max(maximumTwiceArea, twiceArea);
      }
    }
  }

  const collinearityTolerance = Math.max(scale * scale * 1e-9, Number.EPSILON);
  if (maximumTwiceArea <= collinearityTolerance) {
    throw new CalibrationError('基準点が一直線上にあるため射影を計算できません。');
  }
}

function solveThreeByThree(matrix: number[][], values: number[]): [number, number, number] {
  const augmented = matrix.map((row, index) => [...row, values[index]]);

  for (let column = 0; column < 3; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])) {
        pivotRow = row;
      }
    }

    if (Math.abs(augmented[pivotRow][column]) < EPSILON) {
      throw new CalibrationError('基準点が一直線上にあるため射影を計算できません。');
    }

    [augmented[column], augmented[pivotRow]] = [augmented[pivotRow], augmented[column]];
    const pivot = augmented[column][column];
    for (let index = column; index < 4; index += 1) {
      augmented[column][index] /= pivot;
    }

    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = column; index < 4; index += 1) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }

  return [augmented[0][3], augmented[1][3], augmented[2][3]];
}

export function fitAffineTransform(points: readonly CalibrationPoint[]): AffineTransform {
  validateCalibrationPoints(points);

  const originLatitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  const originLongitude = points.reduce((sum, point) => sum + point.longitude, 0) / points.length;

  const normalMatrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const xValues = [0, 0, 0];
  const yValues = [0, 0, 0];

  for (const point of points) {
    const row = [point.longitude - originLongitude, point.latitude - originLatitude, 1];
    for (let i = 0; i < 3; i += 1) {
      xValues[i] += row[i] * point.x;
      yValues[i] += row[i] * point.y;
      for (let j = 0; j < 3; j += 1) {
        normalMatrix[i][j] += row[i] * row[j];
      }
    }
  }

  return {
    originLatitude,
    originLongitude,
    xCoefficients: solveThreeByThree(normalMatrix, xValues),
    yCoefficients: solveThreeByThree(normalMatrix, yValues),
  };
}

export function projectCoordinates(
  transform: AffineTransform,
  latitude: number,
  longitude: number,
): NormalizedPoint {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new CalibrationError('位置情報に数値でない値が含まれています。');
  }

  const row: readonly [number, number, number] = [
    longitude - transform.originLongitude,
    latitude - transform.originLatitude,
    1,
  ];
  const multiply = (coefficients: readonly [number, number, number]): number =>
    coefficients.reduce((sum, coefficient, index) => sum + coefficient * row[index], 0);

  return {
    x: multiply(transform.xCoefficients),
    y: multiply(transform.yCoefficients),
  };
}

export function isWithinMap(point: NormalizedPoint): boolean {
  return point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
}
