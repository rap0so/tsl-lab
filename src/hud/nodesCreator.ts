import * as THREE from "three/webgpu";
import { CSS2DObject } from "three/examples/jsm/Addons.js";
import "./cssToRenderer.css";
import type { MappedNode } from "./types";
import { scene } from "../utils/setup";

const nodeMeshes = new Map<string, THREE.Mesh>();

const nodesColor = new THREE.Color("#44aaff");

const nodesCreator = (mappedNodes: MappedNode[]) => {
  mappedNodes.forEach((mNode) => {
    const divLabel = document.createElement("div");
    divLabel.className = "node-label";
    divLabel.textContent = mNode.label;

    const label = new CSS2DObject(divLabel);
    label.position.set(0, mNode.scale + 0.3, 0); // a bit above the node

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(mNode.scale, 16, 16),
      new THREE.MeshBasicMaterial({ color: nodesColor }),
    );
    mesh.position.copy(mNode.position);

    // We're storing these data to mesh's user data
    mesh.userData.baseScale = mNode.scale;
    mesh.userData.baseColor = nodesColor;

    nodeMeshes.set(mNode.id, mesh);

    mesh.add(label); // mesh's son - it follows automatically
    scene.add(mesh);
  });

  return nodeMeshes;
};

export default nodesCreator;
