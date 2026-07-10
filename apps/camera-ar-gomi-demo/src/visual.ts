import { mulberry32 } from './seed';
import type { ArtworkSeed, GeneratorParams } from './types';

interface VisualParticle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  phase: number;
}

interface VisualBand {
  radius: number;
  width: number;
  color: string;
  phase: number;
}

export class ArtworkRenderer {
  private readonly context: CanvasRenderingContext2D;
  private params: GeneratorParams | undefined;
  private artwork: ArtworkSeed | undefined;
  private particles: VisualParticle[] = [];
  private bands: VisualBand[] = [];
  private frame = 0;
  private startTime = performance.now();

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvasを初期化できません。');
    }
    this.context = context;
    window.addEventListener('resize', () => this.resize());
  }

  setArtwork(artwork: ArtworkSeed, params: GeneratorParams): void {
    this.artwork = artwork;
    this.params = params;
    this.startTime = performance.now();
    this.createPlan(params);
    this.resize();
    this.draw(performance.now());
  }

  start(): void {
    if (this.frame) {
      return;
    }
    const tick = (time: number) => {
      this.draw(time);
      this.frame = window.requestAnimationFrame(tick);
    };
    this.frame = window.requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.frame) {
      window.cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  downloadPng(): void {
    const filenameSeed = this.artwork?.seed ?? 'artwork';
    this.canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filenameSeed}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  private resize(): void {
    const parent = this.canvas.parentElement;
    const cssSize = Math.min(parent?.clientWidth ?? 960, 960);
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelSize = Math.max(320, Math.round(cssSize * devicePixelRatio));
    if (this.canvas.width !== pixelSize || this.canvas.height !== pixelSize) {
      this.canvas.width = pixelSize;
      this.canvas.height = pixelSize;
    }
    this.canvas.style.width = `${cssSize}px`;
    this.canvas.style.height = `${cssSize}px`;
  }

  private createPlan(params: GeneratorParams): void {
    const random = mulberry32(params.seedHash);
    this.particles = Array.from({ length: params.particleCount }, () => ({
      x: random(),
      y: random(),
      radius: 0.006 + random() * 0.026,
      speed: 0.25 + random() * 0.9,
      color: params.palette[2 + Math.floor(random() * 3)] ?? params.accent,
      phase: random() * Math.PI * 2,
    }));
    this.bands = Array.from({ length: params.lineCount }, (_, index) => ({
      radius: 0.18 + (index / Math.max(1, params.lineCount - 1)) * 0.42,
      width: 0.008 + random() * 0.028,
      color: params.palette[1 + (index % (params.palette.length - 1))],
      phase: random() * Math.PI * 2,
    }));
  }

  private draw(time: number): void {
    if (!this.params) {
      return;
    }
    this.resize();

    const { width, height } = this.canvas;
    const size = Math.min(width, height);
    const center = size / 2;
    const elapsed = (time - this.startTime) / 1000;
    const ctx = this.context;
    const params = this.params;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = params.background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(params.rotation + elapsed * 0.04);

    this.drawGrid(ctx, size, params, elapsed);
    this.drawBands(ctx, size, params, elapsed);
    this.drawParticles(ctx, size, params, elapsed);

    ctx.restore();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    size: number,
    params: GeneratorParams,
    elapsed: number,
  ): void {
    const spacing = size * (0.052 + params.density * 0.032);
    const offset = ((elapsed * 8) % spacing) - spacing;
    ctx.strokeStyle = withAlpha(params.palette[1], 0.12);
    ctx.lineWidth = Math.max(1, size * 0.002);

    for (let pos = -size; pos <= size; pos += spacing) {
      ctx.beginPath();
      ctx.moveTo(-size, pos + offset);
      ctx.lineTo(size, pos * 0.35 + offset);
      ctx.stroke();
    }
  }

  private drawBands(
    ctx: CanvasRenderingContext2D,
    size: number,
    params: GeneratorParams,
    elapsed: number,
  ): void {
    this.bands.forEach((band, index) => {
      const pulse = Math.sin(elapsed * (0.5 + index * 0.03) + band.phase) * 0.025;
      const radius = size * (band.radius + pulse);
      ctx.beginPath();
      ctx.strokeStyle = withAlpha(band.color, 0.54);
      ctx.lineWidth = Math.max(2, size * band.width);
      ctx.arc(0, 0, radius, band.phase + elapsed * 0.12, band.phase + Math.PI * (1.12 + params.density));
      ctx.stroke();
    });
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    size: number,
    params: GeneratorParams,
    elapsed: number,
  ): void {
    this.particles.forEach((particle, index) => {
      const orbit = size * (0.11 + particle.x * 0.39);
      const angle = particle.phase + elapsed * particle.speed * 0.18 + index * 0.04;
      const x = Math.cos(angle) * orbit + Math.sin(elapsed + particle.phase) * size * 0.06;
      const y = Math.sin(angle) * orbit * (0.72 + params.noise);

      ctx.beginPath();
      ctx.fillStyle = withAlpha(particle.color, 0.7);
      ctx.arc(x, y, size * particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
