/**
 * Real-world application — keynote stage.
 *
 * Composition follows the reference: a very wide LED wall filling the middle of
 * the frame, seen from the back of the house over rows of dark seating, a dark
 * ceiling and no set dressing. The wall is the only thing that carries detail.
 */
import * as THREE from 'three';
import {
  createStage,
  glowTexture,
  ledSeamsTexture,
  loadTexture,
  swapTexture,
  averageLuminance,
  type SceneHandle,
} from './core';

const WALL_W = 27;
const WALL_ASPECT = 2.3;
const WALL_H = WALL_W / WALL_ASPECT;

const HALL_W = 40;
const HALL_H = 19;
const STAGE_FRONT = -7;
const STAGE_DEPTH = 11;
const BACK_WALL = STAGE_FRONT - STAGE_DEPTH;
const DECK_H = 1.0;

const SEAT_PITCH = 0.62;
const ROW_PITCH = 1.16;
const SEATS_PER_BLOCK = 11;
const BLOCK_X = 11.2;
const FIRST_ROW_Z = STAGE_FRONT + 2.4;
const ROW_COUNT = 13;
const RAKE = 0.12;

function coverTexture(tex: THREE.Texture) {
  const img = tex.image as { width?: number; height?: number } | undefined;
  if (!img?.width || !img.height) return;
  const imageAspect = img.width / img.height;
  if (imageAspect > WALL_ASPECT) {
    const s = WALL_ASPECT / imageAspect;
    tex.repeat.set(s, 1);
    tex.offset.set((1 - s) / 2, 0);
  } else {
    const s = imageAspect / WALL_ASPECT;
    tex.repeat.set(1, s);
    tex.offset.set(0, (1 - s) / 2);
  }
}

export async function mountPresentation(canvas: HTMLCanvasElement, { image }: { image: string }): Promise<SceneHandle> {
  const stage = createStage(canvas, {
    fov: 50,
    exposure: 1.02,
    bloom: { strength: 0.1, radius: 0.7, threshold: 1.12 },
    film: { vignette: 0.85, grain: 0.035 },
    environmentIntensity: 0.2,
  });
  const { scene, camera, controls, onFrame } = stage;

  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.Fog(0x050505, 40, 130);

  /* ---------------------------------------------------------------- room */
  const shell = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.95, metalness: 0 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, 90), new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.72 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 30;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, 90), shell);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, HALL_H, 30);
  scene.add(ceiling);

  for (const x of [-HALL_W / 2, HALL_W / 2]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(90, HALL_H), shell);
    wall.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    wall.position.set(x, HALL_H / 2, 30);
    wall.receiveShadow = true;
    scene.add(wall);
  }

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, HALL_H), new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1 }));
  backWall.position.set(0, HALL_H / 2, BACK_WALL);
  scene.add(backWall);

  /* --------------------------------------------------------------- stage */
  const deck = new THREE.Mesh(new THREE.BoxGeometry(HALL_W - 4, DECK_H, STAGE_DEPTH), new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.6 }));
  deck.position.set(0, DECK_H / 2, STAGE_FRONT - STAGE_DEPTH / 2);
  deck.receiveShadow = true;
  scene.add(deck);

  const deckEdge = new THREE.Mesh(
    new THREE.BoxGeometry(HALL_W - 4, 0.06, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x2a2a2a }),
  );
  deckEdge.position.set(0, DECK_H, STAGE_FRONT + 0.02);
  scene.add(deckEdge);

  // Two shallow steps at the centre of the deck edge
  for (let i = 0; i < 2; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(6 - i * 0.6, DECK_H / 2, 0.9), new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.8 }));
    step.position.set(0, DECK_H / 4 + (i * DECK_H) / 4, STAGE_FRONT + 0.45 + i * 0.9);
    scene.add(step);
  }

  // Confidence monitors flat on the deck
  for (const x of [-6.4, 5.2]) {
    const mon = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.9), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.3 }));
    mon.position.set(x, DECK_H + 0.06, STAGE_FRONT - 2.6);
    mon.rotation.x = -0.22;
    scene.add(mon);
  }

  /* ---------------------------------------------------------------- wall */
  const wallGroup = new THREE.Group();
  wallGroup.position.set(0, DECK_H + 0.45 + WALL_H / 2, BACK_WALL + 0.35);
  scene.add(wallGroup);

  const wallBacking = new THREE.Mesh(new THREE.BoxGeometry(WALL_W + 0.5, WALL_H + 0.5, 0.35), new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 1 }));
  wallBacking.position.z = -0.2;
  wallGroup.add(wallBacking);

  const wallMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true });
  const wallScreen = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, WALL_H), wallMat);
  wallGroup.add(wallScreen);

  const seams = new THREE.Mesh(
    new THREE.PlaneGeometry(WALL_W, WALL_H),
    new THREE.MeshBasicMaterial({ map: ledSeamsTexture({ cols: 13, rows: 6 }), transparent: true, opacity: 0.07, depthWrite: false }),
  );
  seams.position.z = 0.01;
  wallGroup.add(seams);

  /* -------------------------------------------------------------- seating */
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.9, metalness: 0 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.5, metalness: 0.4 });

  const seatGeo = new THREE.BoxGeometry(0.5, 0.09, 0.48);
  const backGeo = new THREE.BoxGeometry(0.5, 0.62, 0.09);
  const armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.44);
  const legGeo = new THREE.BoxGeometry(0.05, 0.44, 0.42);

  const total = SEATS_PER_BLOCK * 3 * ROW_COUNT;
  const seats = new THREE.InstancedMesh(seatGeo, seatMat, total);
  const backs = new THREE.InstancedMesh(backGeo, seatMat, total);
  const arms = new THREE.InstancedMesh(armGeo, legMat, total * 2);
  const legs = new THREE.InstancedMesh(legGeo, legMat, total * 2);

  const riserMat = new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.94 });
  const dummy = new THREE.Object3D();
  let n = 0;
  let m = 0;

  for (let row = 0; row < ROW_COUNT; row++) {
    const floorY = row * RAKE;
    const z = FIRST_ROW_Z + row * ROW_PITCH;

    const riser = new THREE.Mesh(new THREE.BoxGeometry(HALL_W - 4, floorY + 0.02, ROW_PITCH), riserMat);
    riser.position.set(0, (floorY + 0.02) / 2, z);
    riser.receiveShadow = true;
    scene.add(riser);

    for (let block = -1; block <= 1; block++) {
      const blockX = block * BLOCK_X;
      for (let i = 0; i < SEATS_PER_BLOCK; i++) {
        const x = blockX + (i - (SEATS_PER_BLOCK - 1) / 2) * SEAT_PITCH;
        const jitter = Math.abs(Math.sin(row * 12.9898 + i * 78.233 + block * 3.7) * 43758.5453) % 1;
        const yaw = jitter * 0.06;

        dummy.position.set(x, floorY + 0.46, z);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        seats.setMatrixAt(n, dummy.matrix);

        dummy.position.set(x, floorY + 0.78, z - 0.22);
        dummy.rotation.set(-0.08, yaw, 0);
        dummy.updateMatrix();
        backs.setMatrixAt(n, dummy.matrix);
        n++;

        for (const side of [-1, 1]) {
          dummy.position.set(x + side * 0.29, floorY + 0.7, z - 0.04);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          arms.setMatrixAt(m, dummy.matrix);

          dummy.position.set(x + side * 0.23, floorY + 0.22, z - 0.02);
          dummy.updateMatrix();
          legs.setMatrixAt(m, dummy.matrix);
          m++;
        }
      }
    }
  }
  for (const mesh of [seats, backs, arms, legs]) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  /* --------------------------------------------------------- ceiling grid */
  const gridCols = 5;
  const gridRows = 9;
  const lampGeo = new THREE.CircleGeometry(0.16, 12);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const lamps = new THREE.InstancedMesh(lampGeo, lampMat, gridCols * gridRows * 2);
  let li = 0;
  for (let c = 0; c < gridCols; c++) {
    for (let r = 0; r < gridRows; r++) {
      const x = (c - (gridCols - 1) / 2) * 7.4;
      const z = 2 - r * 4.4;
      for (const y of [HALL_H - 0.02, HALL_H - 0.02]) {
        dummy.position.set(x, y, z);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        lamps.setMatrixAt(li++, dummy.matrix);
      }
    }
  }
  lamps.instanceMatrix.needsUpdate = true;
  scene.add(lamps);

  const lampGlow = new THREE.Points(
    (() => {
      const g = new THREE.BufferGeometry();
      const pos: number[] = [];
      for (let c = 0; c < gridCols; c++) {
        for (let r = 0; r < gridRows; r++) {
          pos.push((c - (gridCols - 1) / 2) * 7.4, HALL_H - 0.05, 2 - r * 4.4);
        }
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      return g;
    })(),
    new THREE.PointsMaterial({
      size: 2.2,
      map: glowTexture({ inner: 0.9, falloff: 2.6 }),
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffffff,
    }),
  );
  scene.add(lampGlow);

  /* --------------------------------------------------------------- truss */
  const stem = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.45, metalness: 0.6 });
  const truss = new THREE.Group();
  truss.position.set(0, HALL_H - 2.2, STAGE_FRONT - 1.5);
  const chordGeo = new THREE.BoxGeometry(HALL_W - 6, 0.12, 0.12);
  for (const [y, z] of [[0.45, -0.3], [0.45, 0.3], [-0.45, -0.3], [-0.45, 0.3]]) {
    const chord = new THREE.Mesh(chordGeo, stem);
    chord.position.set(0, y, z);
    truss.add(chord);
  }
  const braceGeo = new THREE.BoxGeometry(0.07, 1.05, 0.07);
  for (let i = 0; i < 14; i++) {
    const x = -((HALL_W - 8) / 2) + (i * (HALL_W - 8)) / 13;
    const brace = new THREE.Mesh(braceGeo, stem);
    brace.position.set(x, 0, 0);
    brace.rotation.z = i % 2 ? 0.42 : -0.42;
    truss.add(brace);
  }
  scene.add(truss);

  /* -------------------------------------------------------------- lights */
  scene.add(new THREE.AmbientLight(0xffffff, 0.08));

  const house = new THREE.DirectionalLight(0xffffff, 0.5);
  house.position.set(0, HALL_H, 26);
  house.target.position.set(0, 4, BACK_WALL);
  scene.add(house, house.target);

  // The wall itself is the light source
  const wallLight = new THREE.RectAreaLight(0xffffff, 8, WALL_W, WALL_H);
  wallLight.position.copy(wallGroup.position).add(new THREE.Vector3(0, 0, 0.4));
  wallLight.rotation.y = Math.PI;
  scene.add(wallLight);

  // Soft pools under each ceiling lamp
  for (const x of [-11, 0, 11]) {
    const lamp = new THREE.PointLight(0xffffff, 6, 26, 2);
    lamp.position.set(x, HALL_H - 1.2, 4);
    scene.add(lamp);
  }

  /* ------------------------------------------------------------- artwork */
  let spill = 1;
  const applyArtwork = (tex: THREE.Texture) => {
    coverTexture(tex);
    swapTexture(wallMat, tex, 'map');
    spill = 0.45 + averageLuminance(tex) * 1.1;
  };

  const initial = await loadTexture(image);
  if (initial) applyArtwork(initial);
  let currentUrl = image;

  /* -------------------------------------------------------------- camera */
  const home = new THREE.Vector3(0, (ROW_COUNT - 1) * RAKE + 1.85, FIRST_ROW_Z + (ROW_COUNT - 1) * ROW_PITCH + 2.4);
  const target = new THREE.Vector3(0, DECK_H + 0.45 + WALL_H / 2, BACK_WALL);
  camera.position.copy(home);
  controls.target.copy(target);
  controls.minDistance = 8;
  controls.maxDistance = 55;
  controls.minPolarAngle = 0.6;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.minAzimuthAngle = -0.55;
  controls.maxAzimuthAngle = 0.55;
  controls.update();

  onFrame(() => {
    wallLight.intensity = 8 * spill;
  });

  return {
    async setImage(source) {
      const url = typeof source === 'string' ? source : URL.createObjectURL(source);
      if (url === currentUrl) return;
      const tex = await loadTexture(url);
      if (tex) {
        applyArtwork(tex);
        currentUrl = url;
      }
      if (typeof source !== 'string') setTimeout(() => URL.revokeObjectURL(url), 600);
    },
    setScreen(on) {
      wallScreen.visible = on;
      seams.visible = on;
      wallLight.intensity = on ? 8 * spill : 0;
      wallMat.color.set(on ? 0xffffff : 0x050505);
    },
    setAutoRotate(on) {
      controls.autoRotate = on;
      controls.autoRotateSpeed = 0.25;
    },
    resetView() {
      camera.position.copy(home);
      controls.target.copy(target);
      controls.update();
    },
    dispose: stage.dispose,
  };
}
