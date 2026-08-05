import lilgui from "lil-gui";
import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  Fn,
  uniform,
  positionLocal,
  vec2,
  vec3,
  instancedArray,
  instanceIndex,
  hash,
  vec4,
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
const velocityBuffer = instancedArray(countParticles, "vec3");
const positionBuffer = instancedArray(countParticles, "vec3");

const initParticles = Fn(() => {
  const position = positionBuffer.element(instanceIndex);
  const rX = hash(instanceIndex);
  const rY = hash(instanceIndex.add(1));
  const rZ = hash(instanceIndex.add(2));
  // .sub(0.5) para andar para o centro e .mul(10) para criar um volume
  const rPositionVec = vec3(rX, rY, rZ).sub(0.5).mul(10);
  position.assign(rPositionVec);

  const velocity = velocityBuffer.element(instanceIndex);
  const vX = hash(instanceIndex.add(3));
  const vY = hash(instanceIndex.add(4));
  const vZ = hash(instanceIndex.add(5));
  const rVelocityVec = vec3(vX, vY, vZ).sub(0.5).mul(0.02);

  velocity.assign(rVelocityVec);
})().compute(countParticles);
await renderer.computeAsync(initParticles);

const updateParticles = Fn(() => {
  /**
   * Isso é um
   * const data = dataBuffer[instanceIndex]
   */
  const velocity = velocityBuffer.element(instanceIndex);
  const position = positionBuffer.element(instanceIndex);
  /**
   * Isso é um
   * data = Math.float(index) * 2
   * 
   * Um
    data.addAssign 
    seria o mesmo que 
  * data += Math.float(index) * 2
   */
  position.addAssign(velocity);
})().compute(countParticles);

// ------- Material ------
const material = new THREE.MeshStandardNodeMaterial({
  roughness: 0.1,
  metalness: 0.8,
  //   side
});

material.positionNode = positionLocal.add(
  positionBuffer.element(instanceIndex),
);
// material.normalNode =
material.colorNode = vec4(1.0, 1.0, 1.0, 1.0);

const mesh = new THREE.InstancedMesh(
  new THREE.PlaneGeometry(1, 1),
  material,
  countParticles,
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
  renderer.computeAsync(updateParticles);
  renderer.render(scene, camera);
});
