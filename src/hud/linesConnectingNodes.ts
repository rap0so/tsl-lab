import * as THREE from "three/webgpu";
import type { MatchingNodeTech } from "./types";
import { scene } from "../utils/setup";

const linesConnectingNodes = (matchingNodeTechniques: MatchingNodeTech[]) => {
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
};

export default linesConnectingNodes;
