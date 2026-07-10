import { hashString } from './seed';

export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('このブラウザではカメラを起動できません。Safari または Chrome で開いてください。');
  }

  const preferredConstraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };

  try {
    return await attachStream(video, await navigator.mediaDevices.getUserMedia(preferredConstraints));
  } catch {
    const fallbackConstraints: MediaStreamConstraints = {
      audio: false,
      video: true,
    };
    return attachStream(video, await navigator.mediaDevices.getUserMedia(fallbackConstraints));
  }
}

export function stopCamera(stream: MediaStream | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function readFrameNonce(video: HTMLVideoElement): string {
  if (!video.videoWidth || !video.videoHeight) {
    return hashString(Date.now().toString()).toString(36);
  }

  const canvas = document.createElement('canvas');
  const size = 32;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return hashString(Date.now().toString()).toString(36);
  }

  context.drawImage(video, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  let accumulator = '';
  for (let index = 0; index < pixels.length; index += 64) {
    const brightness = Math.round((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3);
    accumulator += brightness.toString(16).padStart(2, '0');
  }

  return hashString(accumulator).toString(36);
}

async function attachStream(video: HTMLVideoElement, stream: MediaStream): Promise<MediaStream> {
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  return stream;
}
