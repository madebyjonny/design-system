/**
 * Shared Three.js stage.
 *
 * Realism comes from four things here: image-based lighting, physically-shaped
 * procedural textures (albedo + bump + roughness + emissive), soft area lights
 * for emissive surfaces, and a filmic post chain (ACES → bloom → vignette/grain).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

RectAreaLightUniformsLib.init();

/** Every scene exposes the same small surface so the page can drive it uniformly. */
export interface SceneHandle {
  setImage: (source: string | File) => Promise<void>;
  setScreen: (on: boolean) => void;
  setAutoRotate: (on: boolean) => void;
  resetView: () => void;
  dispose: () => void;
}

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  onFrame: (fn: (t: number, dt: number) => void) => void;
  resize: () => void;
  dispose: () => void;
}

const FilmShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uVignette: { value: 0.72 },
    uGrain: { value: 0.035 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + uTime * 13.7) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Lens vignette
      vec2 d = vUv - 0.5;
      float vig = smoothstep(0.82, 0.24, length(d) * 1.28);
      color.rgb *= mix(1.0, vig, uVignette);

      // Fine film grain, stronger in the shadows
      float g = hash(vUv * vec2(1920.0, 1080.0)) - 0.5;
      float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb += g * uGrain * (1.0 - luma * 0.6);

      gl_FragColor = color;
    }
  `,
};

export function createStage(
  canvas: HTMLCanvasElement,
  {
    fov = 45,
    exposure = 1,
    bloom = { strength: 0.62, radius: 0.72, threshold: 0.82 },
    film = { vignette: 0.72, grain: 0.035 },
    environmentIntensity = 0.55,
  }: {
    fov?: number;
    exposure?: number;
    bloom?: { strength: number; radius: number; threshold: number };
    film?: { vignette: number; grain: number };
    environmentIntensity?: number;
  } = {},
): Stage {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.4, 900);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.045);
  scene.environment = envRT.texture;
  scene.environmentIntensity = environmentIntensity;
  pmrem.dispose();

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.zoomSpeed = 0.7;
  controls.rotateSpeed = 0.55;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloom.strength, bloom.radius, bloom.threshold);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  const filmPass = new ShaderPass(FilmShader);
  filmPass.uniforms.uVignette.value = film.vignette;
  filmPass.uniforms.uGrain.value = film.grain;
  composer.addPass(filmPass);

  const frames: ((t: number, dt: number) => void)[] = [];
  const timer = new THREE.Timer();
  let running = true;
  let visible = true;
  let raf = 0;

  const size = () => {
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 360;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    raf = requestAnimationFrame(render);
    if (!running || !visible) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();
    controls.update();
    for (const fn of frames) fn(t, dt);
    filmPass.uniforms.uTime.value = t;
    composer.render();
  };

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
    },
    { rootMargin: '120px' },
  );
  io.observe(canvas);

  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  size();
  render();

  return {
    renderer,
    scene,
    camera,
    controls,
    composer,
    bloom: bloomPass,
    onFrame: (fn) => frames.push(fn),
    resize: size,
    dispose: () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      controls.dispose();
      composer.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      envRT.dispose();
      renderer.dispose();
    },
  };
}

/* ========================================================================== */
/*  Procedural textures                                                       */
/* ========================================================================== */

function canvas2d(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function finish(c: HTMLCanvasElement, { srgb = false, repeat }: { srgb?: boolean; repeat?: [number, number] } = {}) {
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.anisotropy = 8;
  return tex;
}

/** Mottled surface plus a matching roughness map — asphalt, carpet, concrete. */
export function noiseTexture({
  size = 512,
  base = '#141414',
  variance = 26,
  seed = 9,
  puddles = 0,
}: { size?: number; base?: string; variance?: number; seed?: number; puddles?: number } = {}) {
  const { c, ctx } = canvas2d(size, size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const image = ctx.getImageData(0, 0, size, size);
  const rand = rng(seed);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (rand() - 0.5) * variance;
    image.data[i] = Math.max(0, Math.min(255, image.data[i] + n));
    image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + n));
    image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + n));
  }
  ctx.putImageData(image, 0, 0);

  const map = finish(c, { srgb: true, repeat: [1, 1] });

  // roughness: wet patches are smooth, dry aggregate is rough
  const r = canvas2d(size, size);
  r.ctx.fillStyle = '#b8b8b8';
  r.ctx.fillRect(0, 0, size, size);
  const rRand = rng(seed + 11);
  for (let i = 0; i < puddles; i++) {
    const cx = rRand() * size;
    const cy = rRand() * size;
    const rad = size * (0.04 + rRand() * 0.14);
    const g = r.ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, 'rgba(20,20,20,0.95)');
    g.addColorStop(0.7, 'rgba(60,60,60,0.5)');
    g.addColorStop(1, 'rgba(184,184,184,0)');
    r.ctx.fillStyle = g;
    r.ctx.beginPath();
    r.ctx.ellipse(cx, cy, rad, rad * 0.62, rRand() * Math.PI, 0, Math.PI * 2);
    r.ctx.fill();
  }
  const roughnessMap = finish(r.c, { repeat: [1, 1] });

  return { map, roughnessMap };
}

/** Vertical sky gradient for a backdrop sphere. */
export function skyTexture({ top = '#161616', mid = '#262626', bottom = '#0a0a0a' } = {}) {
  const { c, ctx } = canvas2d(8, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 256);
  return finish(c, { srgb: true });
}

/** Soft radial falloff — light glow sprites, ground light pools. */
export function glowTexture({ inner = 1, falloff = 2.2 } = {}) {
  const s = 256;
  const { c, ctx } = canvas2d(s, s);
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    g.addColorStop(t, `rgba(255,255,255,${Math.max(0, Math.pow(1 - t, falloff) * inner)})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return finish(c, { srgb: true });
}

/** Vertical fade used as an alpha map for reflections and light shafts. */
export function fadeTexture({ dir = 'up' }: { dir?: 'up' | 'down' } = {}) {
  const { c, ctx } = canvas2d(4, 256);
  const g = ctx.createLinearGradient(0, dir === 'up' ? 256 : 0, 0, dir === 'up' ? 0 : 256);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#000000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  return finish(c);
}

/** Thin grid of LED cabinet seams drawn over a screen surface. */
export function ledSeamsTexture({ cols = 8, rows = 4 } = {}) {
  const s = 512;
  const { c, ctx } = canvas2d(s, s);
  ctx.clearRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.25;
  for (let i = 1; i < cols; i++) {
    ctx.beginPath();
    ctx.moveTo((i / cols) * s, 0);
    ctx.lineTo((i / cols) * s, s);
    ctx.stroke();
  }
  for (let i = 1; i < rows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (i / rows) * s);
    ctx.lineTo(s, (i / rows) * s);
    ctx.stroke();
  }
  return finish(c, { srgb: true });
}

/** Load any image URL into an sRGB texture, with graceful failure. */
export function loadTexture(url: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        resolve(tex);
      },
      undefined,
      () => resolve(null),
    );
  });
}

/**
 * Average luminance (0–1) of an image texture. Used so emissive surfaces light
 * the room in proportion to how bright the artwork actually is.
 */
export function averageLuminance(texture: THREE.Texture | null): number {
  const image = texture?.image as (CanvasImageSource & { width?: number; height?: number }) | undefined;
  if (!image) return 0.5;
  try {
    const { ctx } = canvas2d(32, 18);
    ctx.drawImage(image, 0, 0, 32, 18);
    const { data } = ctx.getImageData(0, 0, 32, 18);
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      total += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    }
    return Math.min(1, Math.max(0, total / (data.length / 4)));
  } catch {
    return 0.5;
  }
}

/** Swap a texture on a material, disposing the previous one. */
export function swapTexture(
  material: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial,
  next: THREE.Texture | null,
  slot: 'map' | 'emissiveMap' = 'map',
) {
  if (slot === 'emissiveMap') {
    const standard = material as THREE.MeshStandardMaterial;
    const previous = standard.emissiveMap;
    standard.emissiveMap = next;
    standard.needsUpdate = true;
    if (previous && previous !== next) previous.dispose();
    return;
  }
  const previous = material.map;
  material.map = next;
  material.needsUpdate = true;
  if (previous && previous !== next) previous.dispose();
}
