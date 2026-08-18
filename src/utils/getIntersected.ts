import * as THREE from "three";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getIntersected(
  event: PointerEvent,
  objects: THREE.Object3D[],
  camera: THREE.Camera,
) {
  pointer.x = (event.clientX / innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  return raycaster.intersectObjects(objects)[0]?.object ?? null;
}

export default getIntersected;
