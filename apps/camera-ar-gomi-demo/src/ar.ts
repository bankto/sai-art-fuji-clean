export const AR_TARGET_IMAGE_URL = `${import.meta.env.BASE_URL}ar-targets/gomi-target.svg`;
export const AR_TARGET_MIND_URL = `${import.meta.env.BASE_URL}ar-targets/gomi-target.mind`;

type ThreeModule = {
  CanvasTexture: new (canvas: HTMLCanvasElement) => any;
  PlaneGeometry: new (width: number, height: number) => any;
  MeshBasicMaterial: new (options: Record<string, unknown>) => any;
  Mesh: new (geometry: any, material: any) => any;
  DoubleSide: unknown;
  LinearFilter: unknown;
  SRGBColorSpace?: unknown;
};

type MindArModule = {
  MindARThree: new (options: {
    container: HTMLElement;
    imageTargetSrc: string;
    filterMinCF?: number;
    filterBeta?: number;
  }) => MindArThreeInstance;
};

type MindArAnchor = {
  group: { add(object: unknown): void };
  onTargetFound?: () => void;
  onTargetLost?: () => void;
};

type MindArThreeInstance = {
  renderer: {
    domElement?: HTMLElement;
    setAnimationLoop(callback: (() => void) | null): void;
    render(scene: unknown, camera: unknown): void;
  };
  scene: unknown;
  camera: unknown;
  addAnchor(index: number): MindArAnchor;
  start(): Promise<void>;
  stop(): void;
};

export interface MindArSession {
  stop(): void;
}

export interface MindArSessionOptions {
  container: HTMLElement;
  sourceCanvas: HTMLCanvasElement;
  onTargetFound: () => void;
  onTargetLost: () => void;
}

export async function hasCompiledTarget(): Promise<boolean> {
  try {
    const response = await fetch(AR_TARGET_MIND_URL, { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function startMindArSession(options: MindArSessionOptions): Promise<MindArSession> {
  options.container.replaceChildren();

  const threeModuleId = 'three';
  const mindarModuleId = 'mindar-image-three';
  const [THREE, mindarModule] = await Promise.all([
    import(/* @vite-ignore */ threeModuleId) as Promise<ThreeModule>,
    import(/* @vite-ignore */ mindarModuleId) as Promise<MindArModule>,
  ]);

  const mindarThree = new mindarModule.MindARThree({
    container: options.container,
    imageTargetSrc: AR_TARGET_MIND_URL,
    filterMinCF: 0.0001,
    filterBeta: 0.001,
  });
  const { renderer, scene, camera } = mindarThree;
  const anchor = mindarThree.addAnchor(0);
  const texture = new THREE.CanvasTexture(options.sourceCanvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  if (THREE.SRGBColorSpace) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.PlaneGeometry(1, 1);
  const plane = new THREE.Mesh(geometry, material);
  anchor.group.add(plane);
  anchor.onTargetFound = options.onTargetFound;
  anchor.onTargetLost = options.onTargetLost;

  await mindarThree.start();
  renderer.setAnimationLoop(() => {
    texture.needsUpdate = true;
    renderer.render(scene, camera);
  });

  return {
    stop(): void {
      renderer.setAnimationLoop(null);
      mindarThree.stop();
      options.container.replaceChildren();
    },
  };
}

