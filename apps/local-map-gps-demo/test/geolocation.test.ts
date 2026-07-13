import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GeolocationFailure,
  requestCurrentPosition,
  type GeolocationSource,
} from '../src/geolocation.ts';

function position(): GeolocationPosition {
  return {
    coords: {
      latitude: 35.0005,
      longitude: 135.0005,
      accuracy: 12,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: 1_725_000_000_000,
    toJSON: () => ({}),
  };
}

function positionError(code: 1 | 2 | 3): GeolocationPositionError {
  return {
    code,
    message: 'mock error',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  };
}

function successfulSource(): GeolocationSource {
  return {
    getCurrentPosition(success, _error, options) {
      assert.deepEqual(options, { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 });
      success(position());
    },
  };
}

function failingSource(code: 1 | 2 | 3): GeolocationSource {
  return {
    getCurrentPosition(_success, error) {
      error?.(positionError(code));
    },
  };
}

async function assertFailure(
  promise: Promise<unknown>,
  expectedReason: GeolocationFailure['reason'],
): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof GeolocationFailure);
    assert.equal(error.reason, expectedReason);
    return true;
  });
}

test('位置情報を1回取得し、必要な値だけをメモリへ返す', async () => {
  const snapshot = await requestCurrentPosition(successfulSource(), true);

  assert.deepEqual(snapshot, {
    latitude: 35.0005,
    longitude: 135.0005,
    accuracy: 12,
    timestamp: 1_725_000_000_000,
  });
});

test('権限拒否・取得不能・タイムアウトを区別する', async () => {
  await assertFailure(requestCurrentPosition(failingSource(1), true), 'permission-denied');
  await assertFailure(requestCurrentPosition(failingSource(2), true), 'position-unavailable');
  await assertFailure(requestCurrentPosition(failingSource(3), true), 'timeout');
});

test('API非対応と非HTTPS環境を区別し、位置取得を呼ばない', async () => {
  await assertFailure(requestCurrentPosition(undefined, true), 'unsupported');

  let called = false;
  const source: GeolocationSource = {
    getCurrentPosition() {
      called = true;
    },
  };
  await assertFailure(requestCurrentPosition(source, false), 'insecure-context');
  assert.equal(called, false);
});
