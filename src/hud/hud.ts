import * as THREE from "three/webgpu";
import labData from "./lab-network-data.json";
import { OrbitControls } from "three/examples/jsm/Addons.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#08080c");

// ----------------- GUI ------------------

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
await renderer.init();

// -------------------- INIT --------------------

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(3, 4, 2);
scene.add(key);

const SPREAD_X = 10;
const SPREAD_Z = 6;

const categoryToY: Record<string, number> = {
  geometry: -3,
  compute: 0,
  postprocessing: 3,
};

// min e max pra normalizar
const orders = labData.nodes.map((n) => n.order);
const minOrder = Math.min(...orders);
const maxOrder = Math.max(...orders);

const techCounts = labData.nodes.map((n) => n.techniques.length);
const minTech = Math.min(...techCounts);
const maxTech = Math.max(...techCounts);

// helper de normalização min-max
const normalize = (value: number, min: number, max: number) =>
  (value - min) / (max - min);

// mapeia cada nó pra uma posição + escala no espaço 3D
const mappedNodes = labData.nodes.map((node) => {
  const xNorm = normalize(node.order, minOrder, maxOrder);
  const x = (xNorm - 0.5) * SPREAD_X;

  const y = categoryToY[node.category];

  const zNorm = normalize(node.techniques.length, minTech, maxTech);
  const z = (zNorm - 0.5) * SPREAD_Z;

  const scale = 0.2 + zNorm * 0.5; // nó com mais técnicas, maior

  return { ...node, position: new THREE.Vector3(x, y, z), scale };
});

const nodeMeshes = new Map<string, THREE.Mesh>();

mappedNodes.forEach((mNode) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(mNode.scale, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x44aaff }),
  );
  mesh.position.copy(mNode.position);
  scene.add(mesh);
  nodeMeshes.set(mNode.id, mesh);
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  // renderer.computeAsync(updateParticles);
  renderer.render(scene, camera);
});
