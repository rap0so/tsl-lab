import lilgui from "lil-gui";
import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  Fn,
  uniform,
  time,
  positionLocal,
  normalLocal,
  mx_noise_float,
  vec2,
  abs,
  vec3,
  float,
  cross,
  mul,
  TWO_PI,
  cos,
  add,
} from "three/tsl";

const gui = new lilgui();

const scene = new THREE.Scene();
scene.background = new THREE.Color("#08080c");

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

// OBRIGATÓRIO — sem isso não renderiza e falha em silêncio
await renderer.init();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(3, 4, 2);
scene.add(key);

const guiFolder = gui.addFolder("Crazy Ball 🪩");
// ---------- TSL ----------
const uAmp = uniform(1);
const uFreq = uniform(2);
const uSpeed = uniform(1.0);
const uMouse = uniform(vec2(0, 0));

// ------- GUI --------
guiFolder.add(uAmp, "value", 0, 2, 0.01).name("Amplification");
guiFolder.add(uFreq, "value", 0, 3, 0.05).name("Frequency");

// ------ Noise --------
const noise = Fn(([newPosition]: [THREE.Node<"vec3">]) => {
  const p = newPosition.mul(uFreq).add(time.div(5).mul(uSpeed));
  return mx_noise_float(p); // -1 .. 1
});

// desloca o vértice ao longo da normal
const displacePosition = Fn(
  ([newPosition, newNormal]: [THREE.Node<"vec3">, THREE.Node<"vec3">]) => {
    return newPosition.add(
      newNormal.mul(noise(newPosition).mul(uAmp).mul(abs(0.3))),
      newNormal.mul(noise(newPosition).mul(uAmp).mul(abs(0.3))),
    );
  },
);

// Cosine Palette
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

//  ----- Position Node --------
const positionNode = displacePosition(positionLocal, normalLocal);

//  ------- Normal Mode ------------
const getNormalNode = Fn(() => {
  const smallStep = float(0.01); // a.k.a eps

  const directionA = cross(normalLocal, vec3(0, 1, 0)).normalize();
  const directionB = cross(normalLocal, directionA).normalize();

  const x = displacePosition(
    positionLocal.add(directionA.mul(smallStep)),
    normalLocal,
  );
  const y = displacePosition(
    positionLocal.add(directionB.mul(smallStep)),
    normalLocal,
  );

  return cross(x, y).normalize();
});

// ------- Material ------
const material = new THREE.MeshStandardNodeMaterial({
  roughness: 0.1,
  metalness: 0.8,
});

const uColorBase = uniform(new THREE.Color("#bdc3cf"));
const uColorFreq = uniform(new THREE.Color("#04c7f3"));
const uColorAmp = uniform(new THREE.Color("#000"));
const uColorPhase = uniform(new THREE.Color("#0d0400"));

// ---------- Paleta Cosseno GUI ----------
const paletteFolder = guiFolder.addFolder("Cosine Palette");

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

const positionalLocalNoise = noise(positionLocal);
const colorRuler = positionalLocalNoise.mul(0.5).add(0.5);

const colorNode = cosinePalette(
  colorRuler,
  uColorBase.rgb,
  uColorFreq.rgb,
  uColorAmp.rgb,
  uColorPhase.rgb,
);

material.positionNode = positionNode;
material.normalNode = getNormalNode();
material.colorNode = colorNode;

const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 48), material);
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
