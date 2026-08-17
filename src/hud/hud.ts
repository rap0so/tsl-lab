import * as THREE from "three/webgpu";
import labData from "./lab-network-data.json";
import { addUpdateTask, renderer, scene } from "../utils/setup";
import normalizeMinMax from "./normalizeMinMax";
import getMinMax from "./getMinMax";
import getMatchingNodesTechnique from "./matchingNodesTechnique";
import "./postprocessing";

import linesConnectingNodes from "./linesConnectingNodes";
import nodesCreator from "./nodesCreator";
import bootSequence from "./boot/bootAnimation";
import printLine from "./boot/printLine";

const SPREAD_X = 10;
const SPREAD_Z = 6;

const categoryToY: Record<string, number> = {
  geometry: -3,
  compute: 0,
  postprocessing: 3,
};

(async function init() {
  const hasWebGPU = navigator.gpu !== undefined;
  if (!hasWebGPU) {
    printLine("WEBGPU BACKEND", false);
    // printLineError('UNAVAILABLE — STATIC FALLBACK');
    // showFallback();
    return;
  }

  printLine("WEBGPU BACKEND");
  await renderer.init();

  bootSequence();

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
  const nodeMeshes = nodesCreator(mappedNodes);

  // ------------------- GRID -------------------
  const gridSize = new THREE.Vector2(30, 30);
  const grid = new THREE.GridHelper(gridSize.x, gridSize.y, 0x1e3a52, 0x152838);
  grid.position.y = -4; // putting the grid below the geometry
  scene.add(grid);

  // ------------------- SCAN LINE -------------------
  const scanLineGeo = new THREE.PlaneGeometry(gridSize.x, gridSize.y);
  const scanLineMat = new THREE.MeshBasicMaterial({
    color: 0x7affbf,
    transparent: true,
    opacity: 0.03,
    side: THREE.DoubleSide,
  });
  scanLineMat.color;
  const scanLineMesh = new THREE.Mesh(scanLineGeo, scanLineMat);
  scanLineMesh.rotation.x = Math.PI / 2;
  scanLineMesh.position.y = -5;

  scene.add(scanLineMesh);

  const highlightNodeColor = new THREE.Color("#00ff6e");
  addUpdateTask(() => {
    scanLineMesh.position.y += 0.03;
    if (scanLineMesh.position.y > 4) {
      scanLineMesh.position.y = grid.position.y - 2;
    }

    nodeMeshes.forEach((mesh) => {
      const dist = Math.abs(scanLineMesh.position.y - mesh.position.y);

      const glow = Math.max(0, 1 - dist / 0.8); // 1 quando alinhado, 0 quando longe (>0.8)

      const base = mesh.userData.baseScale;
      mesh.scale.setScalar(base * (1 + glow * 0.6));

      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.copy(mesh.userData.baseColor);
      if (!Math.floor(dist)) {
        material.color
          .copy(mesh.userData.baseColor)
          .lerp(highlightNodeColor, glow);
      }
    });
  });

  /**
   * Now I need all the nodes that shares the same techniques at least 2x
   */

  const matchingNodeTechniques = getMatchingNodesTechnique(mappedNodes);

  // ----------------- NODES CONNECTOR -----------------
  linesConnectingNodes(matchingNodeTechniques);
})();
