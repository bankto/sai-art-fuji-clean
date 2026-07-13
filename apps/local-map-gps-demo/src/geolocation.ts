export type GeolocationFailureReason =
  | 'unsupported'
  | 'insecure-context'
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'unknown';

export class GeolocationFailure extends Error {
  readonly reason: GeolocationFailureReason;

  constructor(reason: GeolocationFailureReason) {
    super(reason);
    this.name = 'GeolocationFailure';
    this.reason = reason;
  }
}

export interface GeolocationSource {
  getCurrentPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    options?: PositionOptions,
  ): void;
}

export interface PositionSnapshot {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

function reasonFromPositionError(error: GeolocationPositionError): GeolocationFailureReason {
  if (error.code === error.PERMISSION_DENIED) return 'permission-denied';
  if (error.code === error.POSITION_UNAVAILABLE) return 'position-unavailable';
  if (error.code === error.TIMEOUT) return 'timeout';
  return 'unknown';
}

export function requestCurrentPosition(
  source: GeolocationSource | undefined,
  secureContext: boolean,
): Promise<PositionSnapshot> {
  if (!secureContext) {
    return Promise.reject(new GeolocationFailure('insecure-context'));
  }
  if (!source) {
    return Promise.reject(new GeolocationFailure('unsupported'));
  }

  return new Promise((resolve, reject) => {
    source.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => reject(new GeolocationFailure(reasonFromPositionError(error))),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10_000,
      },
    );
  });
}
