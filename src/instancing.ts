import lilgui from "lil-gui";
import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  Fn,
  uniform,
  positionLocal,
  normalLocal,
  vec2,
  abs,
  mul,
  add,
  texture,
  div,
  vec3,
  instanceIndex,
  hash,
  float,
  cos,
  TWO_PI,
  time,
} from "three/tsl";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#08080c");
const texturePath = "/textures/gray-rocks/gray_rocks_diff_1k.png";

// --------------- CAMERA ---------------
const camera = new THREE.PerspectiveCamera(
  45,
  innerWidth / innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0, 4);

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// -------------------- INIT --------------------
await renderer.init();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(3, 4, 2);
scene.add(key);

// ---------- TSL ----------
const uAmp = uniform(1);
// const uFreq = uniform(2);
// const uSpeed = uniform(1.0);
const uMouse = uniform(vec2(0, 0));

// -------------- GUI ---------------
const gui = new lilgui();
const guiFolder = gui.addFolder("Crazy Ball 🪩");
guiFolder.add(uAmp, "value", 0, 2, 0.01).name("Amplification");

// --------------- Noise -----------------
// const noise = Fn(([newPosition]: [THREE.Node<"vec3">]) => {
//   const p = newPosition.mul(uFreq).add(time.div(5).mul(uSpeed));
//   return mx_noise_float(p); // -1 .. 1
// });

//  ----- Position Node --------

//  ------- Normal Mode ------------

// ------- Material ------
const material = new THREE.MeshStandardNodeMaterial({
  roughness: 0.1,
  metalness: 0.8,
});

// --------------- TEXTURE LOADER ---------------
const textureLoader = new THREE.TextureLoader();
const textureRock = textureLoader.load(texturePath);
textureRock.wrapS = THREE.RepeatWrapping;
textureRock.wrapT = THREE.RepeatWrapping;

/**
 * Aqi estamos pegando a projeção da skin de angulos diferentes
 * tem que ser frente, cima e lado
 * como 3 projetores de filme apontando para a esfera
 */
const textureUp = texture(textureRock, positionLocal.xz);
const textureFront = texture(textureRock, positionLocal.xy);
const textureSide = texture(textureRock, positionLocal.yz);

/**
 * A normal decide quem vai ganhar dessas 3 textures aí
 * se tiver vendo de cima, de lado, ou de frente
 */
const textureRulerFront = abs(normalLocal.z);
const textureRulerUp = abs(normalLocal.y);
const textureRulerSide = abs(normalLocal.x);

/**
 * Agora tiramos a media de tudo
 */

const rulerKing = add(textureRulerFront, textureRulerUp, textureRulerSide);
const textureKing = add(
  mul(textureUp, textureRulerUp),
  mul(textureFront, textureRulerFront),
  mul(textureSide, textureRulerSide),
);
const theFinalKing = div(textureKing, rulerKing);

// --------------- SETUP MATERIAL ---------------

const spread = float(20);
const rX = hash(instanceIndex);
const rY = hash(instanceIndex.add(1));
const rZ = hash(instanceIndex.add(2));

const position = vec3(
  rX.mul(spread).sub(spread.div(2)),
  rY.mul(spread).sub(spread.div(2)),
  rZ.mul(spread).sub(spread.div(2)),
);

// -------- Cosine Palette--------
type CosinePalette = [
  THREE.Node<"float">,
  THREE.Node<"vec3">,
  THREE.Node<"vec3">,
  THREE.Node<"vec3">,
  THREE.Node<"vec3">,
];
const cosinePalette = Fn(([t, a, b, c, d]: CosinePalette) => {
  const position = add(d, mul(c, t));
  const cosineResult = cos(mul(TWO_PI, position));

  return add(a, b.mul(cosineResult));
});

//  ----------- Color ------------------
const uColorBase = uniform(new THREE.Color("#bdc3cf"));
const uColorFreq = uniform(new THREE.Color("#04c7f3"));
const uColorAmp = uniform(new THREE.Color("#000"));
const uColorPhase = uniform(new THREE.Color("#0d0400"));

const rColor = hash(instanceIndex.add(3));

const colorNode = cosinePalette(
  rColor,
  uColorBase.rgb,
  uColorAmp.rgb,
  uColorFreq.rgb,
  uColorPhase.rgb,
);

// ---------- Paleta Cosseno GUI ----------
const paletteFolder = guiFolder.addFolder("Cosine Palette");

const brightness = uniform(1);
paletteFolder.add(brightness, "value").name("Brightness").step(1).max(200);

const aFolder = paletteFolder.addFolder("Offset (a)");
aFolder.add(uColorBase.value, "r", 0, 1, 0.01).name("R");
aFolder.add(uColorBase.value, "g", 0, 1, 0.01).name("G");
aFolder.add(uColorBase.value, "b", 0, 1, 0.01).name("B");

const bFolder = paletteFolder.addFolder("Amplitude (b)");
bFolder.add(uColorAmp.value, "r", 0, 1, 0.01).name("R");
bFolder.add(uColorAmp.value, "g", 0, 1, 0.01).name("G");
bFolder.add(uColorAmp.value, "b", 0, 1, 0.01).name("B");

const cFolder = paletteFolder.addFolder("Frequency (c)");
cFolder.add(uColorFreq.value, "r", 0, 5, 0.1).name("R");
cFolder.add(uColorFreq.value, "g", 0, 5, 0.1).name("G");
cFolder.add(uColorFreq.value, "b", 0, 5, 0.1).name("B");

const dFolder = paletteFolder.addFolder("Phase (d)");
dFolder.add(uColorPhase.value, "r", 0, 1, 0.01).name("R");
dFolder.add(uColorPhase.value, "g", 0, 1, 0.01).name("G");
dFolder.add(uColorPhase.value, "b", 0, 1, 0.01).name("B");

//  ------------------- Scale ------------------
const rScale = hash(instanceIndex.add(4));
const scale = vec3(rScale.mul(0.8).add(0.2));

//  ----------------------------------------------

const rInstanceIndex = hash(instanceIndex.add(5));
const movement = cos(time.add(rInstanceIndex.mul(20)));

//  ----------------- Material ---------------

material.positionNode = positionLocal
  .mul(scale)
  .add(position)
  .add(vec3(movement));

material.colorNode = colorNode.mul(brightness);

const mesh = new THREE.InstancedMesh(
  new THREE.IcosahedronGeometry(0.5, 1),
  material,
  10000,
);
scene.add(mesh);
// -------------------------

addEventListener("pointermove", (e) => {
  uMouse.value.set(
    (e.clientX / innerWidth) * 2 - 1,
    -((e.clientY / innerHeight) * 2 - 1),
  );
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
