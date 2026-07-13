export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface CalibrationPoint extends NormalizedPoint {
  id: string;
  latitude: number;
  longitude: number;
}

export interface AffineTransform {
  originLatitude: number;
  originLongitude: number;
  xCoefficients: readonly [number, number, number];
  yCoefficients: readonly [number, number, number];
}

export interface RectangleZone {
  id: string;
  name: string;
  shape: 'rectangle';
  points: readonly [NormalizedPoint, NormalizedPoint];
}

export interface PolygonZone {
  id: string;
  name: string;
  shape: 'polygon';
  points: readonly NormalizedPoint[];
}

export type ZoneDefinition = RectangleZone | PolygonZone;

export interface DemoPosition extends NormalizedPoint {
  id: string;
  label: string;
}
