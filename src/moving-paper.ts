import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  Fn,
  uniform,
  positionLocal,
  vec3,
  instancedArray,
  instanceIndex,
  hash,
  add,
  mul,
  cos,
  TWO_PI,
  texture,
  mx_noise_float,
  float,
  rotateUV,
  length,
} from "three/tsl";
import lilgui from "lil-gui";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#08080c");
const texturePath = "/textures/newspaper/crumpled-newspaper-24845376.webp";

// -------------- GUI ---------------
const gui = new lilgui();
const uMouseStrength = uniform(0.03);
const uMouseAttraction = uniform(true);
const uPaperSpeed = uniform(1.0);

gui.add(uMouseStrength, "value", 0, 1, 0.001).name("Mouse Power");
gui.add(uMouseAttraction, "value").name("Mouse Attraction");
gui.add(uPaperSpeed, "value", 1, 100, 1).name("Paper speed");

// --------------- CAMERA ---------------
const camera = new THREE.PerspectiveCamera(
  100,
  innerWidth / innerHeight,
  0.1,
  5000,
);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// -------------------- INIT --------------------

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(3, 4, 2);
scene.add(key);

// --------------- Paper generator ------------------
const countPaper = 269994;
const velocityBuffer = instancedArray(countPaper, "vec3");
const rotationBuffer = instancedArray(countPaper, "float");
const positionBuffer = instancedArray(countPaper, "vec3");

const initParticles = Fn(() => {
  const position = positionBuffer.element(instanceIndex);
  const rX = hash(instanceIndex);
  const rY = hash(instanceIndex.add(1));
  const rZ = hash(instanceIndex.add(2));
  const rPositionVec = vec3(rX, rY, rZ).sub(0.5).mul(200);
  position.assign(rPositionVec);

  const velocity = velocityBuffer.element(instanceIndex);
  const vX = hash(instanceIndex.add(3));
  const vY = hash(instanceIndex.add(4));
  const vZ = hash(instanceIndex.add(5));
  const rVelocityVec = vec3(vX, vY, vZ).sub(0.5).mul(0.02);

  velocity.assign(rVelocityVec);
})().compute(countPaper);
await renderer.computeAsync(initParticles);

// --------------- Paper move / UPDATE ------------------

const updateParticles = Fn(() => {
  const velocity = velocityBuffer.element(instanceIndex);
  const position = positionBuffer.element(instanceIndex);
  const toMouse = mouseWorldPos.sub(position);
  const distToMouse = length(toMouse).add(1); // to avoid 0

  const direction = uMouseAttraction.select(float(1), float(-1));

  let mouseForce = toMouse
    .normalize() // ql direção, nao a força
    .mul(direction)
    .mul(uMouseStrength)
    .div(distToMouse);

  const normalizedPaperSpeed = float(1000).div(uPaperSpeed);
  // const aff = normalizedPaperSpeed.get('value')
  const curlItself = curlNoise(position).div(normalizedPaperSpeed);

  const friction = 0.95;
  velocity.assign(add(curlItself, mouseForce)).mul(friction);
  position.addAssign(velocity.mul(10));

  const rotation = rotationBuffer.element(instanceIndex);
  const angularSpeed = float(hash(instanceIndex.add(3)).div(30));

  rotation.addAssign(angularSpeed);
})().compute(countPaper);

// ------------ Curl Papers --------------------

const potential = Fn(([pos]: [THREE.Node<"vec3">]) => {
  const xHash = pos.add(vec3(37.0, 17.0, 91.0));
  const x = mx_noise_float(xHash);

  const yHash = pos.add(vec3(1, 53.0, 71.0)),
    y = mx_noise_float(yHash);

  const zHash = pos.add(vec3(23.0, 61.0, 80.0)),
    z = mx_noise_float(zHash);

  return vec3(x, y, z);
});

const curlNoise = Fn(([pos]: [THREE.Node<"vec3">]) => {
  const smallStep = float(0.01); // a.k.a eps

  const px0 = potential(pos.sub(vec3(smallStep, 0, 0))),
    px1 = potential(pos.add(vec3(smallStep, 0, 0)));

  const py0 = potential(pos.sub(vec3(0, smallStep, 0))),
    py1 = potential(pos.add(vec3(0, smallStep, 0)));

  const pz0 = potential(pos.sub(vec3(0, 0, smallStep))),
    pz1 = potential(pos.add(vec3(0, 0, smallStep)));

  const x = py1.z.sub(py0.z).sub(pz1.y.sub(pz0.y));
  const y = pz1.x.sub(pz0.x).sub(px1.z.sub(px0.z));
  const z = px1.y.sub(px0.y).sub(py1.x.sub(py0.x));

  return vec3(x, y, z)
    .mul(float(1.0).div(float(2).mul(smallStep)))
    .normalize();
});

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
const uColorFreq = uniform(new THREE.Color("#04c7f3"));
const uColorPhase = uniform(new THREE.Color("#0d0400"));

const rColor = hash(instanceIndex.add(3));

const colorNode = cosinePalette(
  rColor,
  vec3(
    hash(instanceIndex),
    hash(instanceIndex.add(2)),
    hash(instanceIndex.add(4)),
  ),
  vec3(
    hash(instanceIndex),
    hash(instanceIndex.add(instanceIndex)),
    hash(instanceIndex.add(instanceIndex)),
  ),
  uColorFreq.rgb,
  uColorPhase.rgb,
);

// --------------- TEXTURE LOADER ---------------

const textureLoader = new THREE.TextureLoader();
const texturePaper = textureLoader.load(texturePath);
texturePaper.wrapS = THREE.RepeatWrapping;
texturePaper.wrapT = THREE.RepeatWrapping;

// ------- Material ------
const material = new THREE.MeshStandardNodeMaterial({
  side: THREE.DoubleSide,
});

material.positionNode = rotateUV(
  positionLocal,
  rotationBuffer.element(instanceIndex),
).add(positionBuffer.element(instanceIndex));
material.colorNode = texture(texturePaper).mul(colorNode);

const mesh = new THREE.InstancedMesh(
  new THREE.PlaneGeometry(1, 1),
  material,
  countPaper,
);
scene.add(mesh);

// ------------ Raycasting -------------

const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2(); // Mouse Normalized Device Coordinates
const mouseWorldPos = uniform(new THREE.Vector3());
const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

addEventListener("pointermove", (e) => {
  mouseNDC.x = (e.clientX / innerWidth) * 2 - 1;
  mouseNDC.y = -((e.clientY / innerHeight) * 2 - 1);

  raycaster.setFromCamera(mouseNDC, camera);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(interactionPlane, point);

  if (point) mouseWorldPos.value.copy(point);
});

//

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.computeAsync(updateParticles);
  renderer.render(scene, camera);
});

await renderer.init();
