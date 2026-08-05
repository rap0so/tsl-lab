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
  instancedArray,
  storage,
  instanceIndex,
} from "three/tsl";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#08080c");

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
const uFreq = uniform(2);
const uMouse = uniform(vec2(0, 0));

// -------------- GUI ---------------
const gui = new lilgui();
const guiFolder = gui.addFolder("Crazy Ball 🪩");
guiFolder.add(uAmp, "value", 0, 2, 0.01).name("Amplification");
guiFolder.add(uFreq, "value", 0, 3, 0.05).name("Frequency");

// --------- Actions -----------

const countParticles = 262144;
const dataBuffer = instancedArray(countParticles, "float");
// console.log(dataBuffer);

const updateParticles = Fn(() => {
  /**
   * Isso é um
   * const data = dataBuffer[instanceIndex]
   */
  const data = dataBuffer.element(instanceIndex);
  /**
   * Isso é um
   * data = Math.float(index) * 2
   * 
   * Um
    data.addAssign 
    seria o mesmo que 
  * data += Math.float(index) * 2
   */
  data.assign(instanceIndex);
})().compute(countParticles);

// Rendering
await renderer.computeAsync(updateParticles);

// Getting the value that got rendered
const arrayBuffer = await renderer.getArrayBufferAsync(dataBuffer.value);

// Transforming the array back to JS
const result = new Float32Array(arrayBuffer);
console.log(result);

// ------- Material ------
const material = new THREE.MeshStandardMaterial({
  roughness: 0.1,
  metalness: 0.8,
  wireframe: true,
});

// material.positionNode = ;
// material.normalNode =
// material.colorNode = ;

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
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
