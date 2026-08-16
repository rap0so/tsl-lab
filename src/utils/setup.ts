import * as THREE from "three/webgpu";
import { CSS2DRenderer, OrbitControls } from "three/examples/jsm/Addons.js";
import { Inspector } from "three/addons/inspector/Inspector.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#08080c");

// ----------------- CSS2DRenderer ------------------
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.id = "css-2d-renderer";
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.pointerEvents = "none";

document.body.appendChild(labelRenderer.domElement);

// --------------- CAMERA ---------------
const camera = new THREE.PerspectiveCamera(
  100,
  innerWidth / innerHeight,
  0.1,
  5000,
);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

renderer.inspector = new Inspector();
await renderer.init();

// -------------------- INIT --------------------

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const updateTasks: Function[] = [];

export function addUpdateTask(taskFn: Function) {
  updateTasks.push(taskFn);
}

const animate = (time: number, frame?: XRFrame) => {
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  for (const task of updateTasks) {
    task(time, frame);
  }
};

renderer.setAnimationLoop(animate);

export { renderer, scene, camera, controls };
