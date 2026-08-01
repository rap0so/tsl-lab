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
} from "three/tsl";

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

// ---------- TSL ----------
const uAmp = uniform(0);
const uFreq = uniform(0);
const uSpeed = uniform(0);
const uMouse = uniform(vec2(0, 0));
const uColorA = uniform(new THREE.Color("#12224a"));
const uColorB = uniform(new THREE.Color("#ff5f1f"));

// Fn() = função de shader reutilizável. Isso é o coração do TSL.
const noise = Fn(() => {
  const p = positionLocal.mul(uFreq).add(time.mul(uSpeed));
  return mx_noise_float(p); // -1 .. 1
});

const n = noise();

// desloca o vértice ao longo da normal
material_position: {
}
const material = new THREE.MeshStandardNodeMaterial({
  roughness: 0.3,
  metalness: 0.4,
});

material.positionNode = positionLocal.add(
  normalLocal.mul(n.mul(uAmp).mul(uMouse.x.mul(0.5).add(1))),
);
material.colorNode = mix(uColorA, uColorB, n.mul(0.5).add(0.5));

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
