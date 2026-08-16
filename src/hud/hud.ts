import * as THREE from "three/webgpu";
import labData from "./lab-network-data.json";
import { scene } from "../utils/setup";
import normalizeMinMax from "./normalizeMinMax";
import getMinMax from "./getMinMax";
import getMatchingNodesTechnique from "./matchingNodesTechnique";
import { CSS2DObject } from "three/examples/jsm/Addons.js";
import "./cssToRenderer.css";

const SPREAD_X = 10;
const SPREAD_Z = 6;

const categoryToY: Record<string, number> = {
  geometry: -3,
  compute: 0,
  postprocessing: 3,
};

const orders = labData.nodes.map((n) => n.order);
const [minOrder, maxOrder] = getMinMax(orders);

const techCounts = labData.nodes.map((n) => n.techniques.length);
const [minTech, maxTech] = getMinMax(techCounts);

const mappedNodes = labData.nodes.map((node) => {
  const xNorm = normalizeMinMax(node.order, minOrder, maxOrder);
  const x = (xNorm - 0.5) * SPREAD_X;

  const y = categoryToY[node.category];

  const zNorm = normalizeMinMax(node.techniques.length, minTech, maxTech);
  const z = (zNorm - 0.5) * SPREAD_Z;

  const scale = 0.2 + zNorm * 0.5; // node w more techniques is bigger

  return { ...node, position: new THREE.Vector3(x, y, z), scale };
});

const nodeMeshes = new Map<string, THREE.Mesh>();

mappedNodes.forEach((mNode) => {
  const divLabel = document.createElement("div");
  divLabel.className = "node-label";
  divLabel.textContent = mNode.label;

  const label = new CSS2DObject(divLabel);
  label.position.set(0, mNode.scale + 0.3, 0); // um pouco acima do nó

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(mNode.scale, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x44aaff }),
  );
  mesh.add(label); // mesh's son - it follows automatically
  mesh.position.copy(mNode.position);
  scene.add(mesh);
  nodeMeshes.set(mNode.id, mesh);
});

// ------------------- GRID -------------------
const grid = new THREE.GridHelper(30, 30, 0x1e3a52, 0x152838);
grid.position.y = -4; // putting the grid below the geometry
scene.add(grid);

/**
 * Now I need all the nodes that shares the same techniques at least 2x
 */

const matchingNodeTechniques = getMatchingNodesTechnique(mappedNodes);

const factor = 0.4;

matchingNodeTechniques.forEach((matchNTech) => {
  const start = matchNTech.from.position.clone();
  const end = matchNTech.to.position.clone();
  // multiplyScalar é o mesmo que .divide(new THREE.Vector3(2, 2, 2))
  const middle = end.clone().add(start).multiplyScalar(0.5);

  const height = start.clone().distanceTo(end) * factor;
  const control = middle.add(new THREE.Vector3(0, height, 0));
  const radius = 0.01 * (matchNTech.matches || 1);

  const curve = new THREE.QuadraticBezierCurve3(start, control, end);

  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, undefined, radius, 20),
    new THREE.MeshBasicMaterial({
      color: 0x33ffe4,
    }),
  );

  scene.add(mesh);
});
