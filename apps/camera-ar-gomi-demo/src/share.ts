import QRCode from 'qrcode';
import { createArHash, createShareHash } from './seed';
import type { ArtworkSeed } from './types';

export function createShareUrl(artwork: ArtworkSeed): string {
  return `${createBaseUrl()}${createShareHash(artwork)}`;
}

export function createArUrl(artwork: ArtworkSeed): string {
  return `${createBaseUrl()}${createArHash(artwork)}`;
}

export async function renderQrCode(canvas: HTMLCanvasElement, url: string): Promise<void> {
  await QRCode.toCanvas(canvas, url, {
    width: 256,
    margin: 1,
    color: {
      dark: '#101312',
      light: '#f7f5ec',
    },
  });
}

export async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

function createBaseUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}
