import type { NormalizedPoint, ZoneDefinition } from './types';

const BOUNDARY_EPSILON = 1e-10;

function isNormalizedPoint(point: NormalizedPoint): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1
  );
}

export function validateZones(zones: readonly ZoneDefinition[]): void {
  const ids = new Set<string>();

  for (const zone of zones) {
    if (!zone.id || ids.has(zone.id)) {
      throw new Error('ゾーンIDが空、または重複しています。');
    }
    ids.add(zone.id);

    if (!zone.name.trim()) {
      throw new Error('ゾーン名が空です。');
    }
    if (zone.shape === 'rectangle' && zone.points.length !== 2) {
      throw new Error('矩形ゾーンは対角の2点で指定してください。');
    }
    if (zone.shape === 'polygon' && zone.points.length < 3) {
      throw new Error('ポリゴンゾーンは3点以上で指定してください。');
    }
    if (!zone.points.every(isNormalizedPoint)) {
      throw new Error('ゾーン座標は0〜1の有限値で指定してください。');
    }
  }
}

function isPointOnSegment(point: NormalizedPoint, start: NormalizedPoint, end: NormalizedPoint): boolean {
  const cross =
    (point.y - start.y) * (end.x - start.x) -
    (point.x - start.x) * (end.y - start.y);
  if (Math.abs(cross) > BOUNDARY_EPSILON) return false;

  const dot =
    (point.x - start.x) * (end.x - start.x) +
    (point.y - start.y) * (end.y - start.y);
  const squaredLength = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  return dot >= -BOUNDARY_EPSILON && dot <= squaredLength + BOUNDARY_EPSILON;
}

function isInsidePolygon(point: NormalizedPoint, polygon: readonly NormalizedPoint[]): boolean {
  let inside = false;

  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const start = polygon[previous];
    const end = polygon[current];

    if (isPointOnSegment(point, start, end)) return true;

    const crossesHorizontalRay =
      start.y > point.y !== end.y > point.y &&
      point.x < ((end.x - start.x) * (point.y - start.y)) / (end.y - start.y) + start.x;
    if (crossesHorizontalRay) inside = !inside;
  }

  return inside;
}

export function containsPoint(zone: ZoneDefinition, point: NormalizedPoint): boolean {
  if (zone.shape === 'rectangle') {
    const [first, second] = zone.points;
    return (
      point.x >= Math.min(first.x, second.x) &&
      point.x <= Math.max(first.x, second.x) &&
      point.y >= Math.min(first.y, second.y) &&
      point.y <= Math.max(first.y, second.y)
    );
  }

  return isInsidePolygon(point, zone.points);
}

export function findZone(
  point: NormalizedPoint,
  zones: readonly ZoneDefinition[],
): ZoneDefinition | undefined {
  return zones.find((zone) => containsPoint(zone, point));
}

export function zonePolygonPoints(zone: ZoneDefinition): readonly NormalizedPoint[] {
  if (zone.shape === 'polygon') return zone.points;
  const [first, second] = zone.points;
  const left = Math.min(first.x, second.x);
  const right = Math.max(first.x, second.x);
  const top = Math.min(first.y, second.y);
  const bottom = Math.max(first.y, second.y);
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}
