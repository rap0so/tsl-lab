// based of: https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_postprocessing_bloom.html
import * as THREE from "three/webgpu";
import { addUpdateTask, camera, renderer, scene } from "../utils/setup";
import { pass } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

const renderPipeline = new THREE.RenderPipeline(renderer);

const config = {
  storeMultisampledColorBuffer: false,
  storeMultisampledDepthBuffer: false,
  storeMultisampledStencilBuffer: false,
  resolveColorBuffer: true,
  resolveDepthBuffer: false,
  resolveStencilBuffer: false,
};

const scenePass = pass(scene, camera, config);
const scenePassColor = scenePass.getTextureNode("output").toInspector("Color");

const bloomPass = bloom(scenePassColor).toInspector("Bloom");
bloomPass.threshold.value = 0;
bloomPass.strength.value = 0.43;
bloomPass.radius.value = 0.05;

renderPipeline.outputNode = scenePassColor.add(bloomPass);

addUpdateTask(() => {
  renderPipeline.render();
});
