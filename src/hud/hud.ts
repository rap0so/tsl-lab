import * as THREE from "three/webgpu";
import labData from "./lab-network-data.json";
import { scene } from "../utils/setup";
import normalizeMinMax from "./normalizeMinMax";
import getMinMax from "./getMinMax";
import getMatchingNodesTechnique from "./matchingNodesTechnique";

import linesConnectingNodes from "./linesConnectingNodes";
import nodesCreator from "./nodesCreator";

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

// ----------------- NODES CREATOR -----------------
nodesCreator(mappedNodes);

// ------------------- GRID -------------------
const gridSize = new THREE.Vector2(30, 30);
const grid = new THREE.GridHelper(gridSize.x, gridSize.y, 0x1e3a52, 0x152838);
grid.position.y = -4; // putting the grid below the geometry
scene.add(grid);

/**
 * Now I need all the nodes that shares the same techniques at least 2x
 */

const matchingNodeTechniques = getMatchingNodesTechnique(mappedNodes);

// ----------------- NODES CONNECTOR -----------------
linesConnectingNodes(matchingNodeTechniques);
