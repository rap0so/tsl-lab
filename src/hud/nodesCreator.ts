import * as THREE from "three/webgpu";
import { CSS2DObject } from "three/examples/jsm/Addons.js";
import "./cssToRenderer.css";
import type { MappedNode } from "./types";
import { scene } from "../utils/setup";
import parseNodeLegendToElement from "./parseNodeLegendToElement/parseNodeLegendToElement";

const nodeMeshes = new Map<string, THREE.Mesh>();

const nodesColor = new THREE.Color("#44aaff");

const nodesCreator = (mappedNodes: MappedNode[]) => {
  mappedNodes.forEach((mNode) => {
    // Top label
    const divLabel = document.createElement("div");
    divLabel.className = "node-label";
    divLabel.textContent = mNode.label;

    const label = new CSS2DObject(divLabel);
    label.position.set(0, mNode.scale + 0.3, 0);

    // Legend
    const legendElem = parseNodeLegendToElement(mNode);

    const legend = new CSS2DObject(legendElem);
    legend.visible = false;
    legend.name = "legend-2D";
    legend.position.set(0, mNode.scale - 2.5, 0);

    // Mesh
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(mNode.scale, 32, 32),
      new THREE.MeshBasicMaterial({ color: nodesColor }),
    );
    mesh.position.copy(mNode.position);

    // We're storing these data to mesh's user data
    mesh.userData.baseScale = mNode.scale;
    mesh.userData.baseColor = nodesColor;

    nodeMeshes.set(mNode.id, mesh);

    mesh.add(label); // mesh's son - it follows automatically
    mesh.add(legend);
    scene.add(mesh);
  });

  return nodeMeshes;
};

export default nodesCreator;
