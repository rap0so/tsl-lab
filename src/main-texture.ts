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
  add,
  texture,
  div,
} from "three/tsl";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#08080c");
const texturePath = "public/textures/gray-rocks/gray_rocks_diff_1k.png";

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
const uSpeed = uniform(1.0);
const uMouse = uniform(vec2(0, 0));

// -------------- GUI ---------------
const gui = new lilgui();
const guiFolder = gui.addFolder("Crazy Ball 🪩");
guiFolder.add(uAmp, "value", 0, 2, 0.01).name("Amplification");
guiFolder.add(uFreq, "value", 0, 3, 0.05).name("Frequency");

// --------------- Noise -----------------
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

material.positionNode = positionNode;
material.normalNode = getNormalNode();
material.colorNode = theFinalKing;

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
