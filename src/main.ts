import lilgui from "lil-gui";
import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  Fn,
  uniform,
  mix,
  time,
  positionLocal,
  normalLocal,
  mx_noise_float,
  vec2,
  abs,
  vec3,
  float,
  cross,
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

const guiFolder = gui.addFolder("crazy-ball 🪩");
// ---------- TSL ----------
const uAmp = uniform(1);
const uFreq = uniform(2);
const uSpeed = uniform(1.0);
const uMouse = uniform(vec2(0, 0));
const uColorA = uniform(new THREE.Color("#ff5f1f"));
const uColorB = uniform(new THREE.Color("#005c95"));

// ------- GUI --------
guiFolder.add(uAmp, "value", 0, 2, 0.01).name("Amplification");
guiFolder.add(uFreq, "value", 0, 3, 0.05).name("Frequency");
guiFolder.addColor(uColorB, "value").name("Main color");
guiFolder.addColor(uColorA, "value").name("Secondary color");

// ------ Noise --------
const noise = Fn(([newPosition]: [THREE.Node<"vec3">]) => {
  const p = newPosition.mul(uFreq).add(time.div(5).mul(uSpeed));
  return mx_noise_float(p); // -1 .. 1
});

const positionalLocalNoise = noise(positionLocal);

// desloca o vértice ao longo da normal
const displacePosition = Fn(
  ([newPosition, newNormal]: [THREE.Node<"vec3">, THREE.Node<"vec3">]) => {
    return newPosition.add(
      newNormal.mul(noise(newPosition).mul(uAmp).mul(abs(0.3))),
      newNormal.mul(noise(newPosition).mul(uAmp).mul(abs(0.3))),
    );
  },
);

const smallStep = float(0.01); // a.k.a eps

const directionA = cross(normalLocal, vec3(0, 1, 0)).normalize();
const directionB = cross(normalLocal, directionA).normalize();

const p0 = displacePosition(positionLocal, normalLocal);
const pA = displacePosition(
  positionLocal.add(directionA.mul(smallStep)),
  normalLocal,
);
const pB = displacePosition(
  positionLocal.add(directionB.mul(smallStep)),
  normalLocal,
);

const normalNode = cross(pA.sub(p0), pB.sub(p0)).normalize();

// ------- Material ------
const material = new THREE.MeshStandardNodeMaterial({
  roughness: 0.3,
  metalness: 0.4,
});

material.positionNode = p0;
material.normalNode = normalNode;
material.colorNode = mix(
  uColorA,
  uColorB,
  positionalLocalNoise.mul(0.5).add(0.5),
);

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
