console.log(
  `"Bed Monster" (https://skfb.ly/pMxoB) by Shedletsky_2 is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).`,
);

import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  metalness,
  mrt,
  normalView,
  output,
  packNormalToRGB,
  pass,
  roughness,
  sample,
  unpackRGBToNormal,
  vec2,
} from "three/tsl";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import { RenderPipeline } from "three/webgpu";
import { Inspector } from "three/examples/jsm/inspector/Inspector.js";
import { RoomEnvironment } from "three/examples/jsm/Addons.js";
import { smaa } from "three/examples/jsm/tsl/display/SMAANode.js";

// ---------------------- SCENE ----------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color("#08080c");

// --------------- CAMERA ---------------
const camera = new THREE.PerspectiveCamera(
  100,
  innerWidth / innerHeight,
  0.1,
  5000,
);
camera.position.set(0, 0, 3.2);

//   -------------------- RENDERER --------------------
const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.inspector = new Inspector();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Deixa a sombra mais suave
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);
await renderer.init();
// ---------------------- ENVIRONMENT ----------------------
const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(environment, 0.04).texture;
scene.environmentIntensity = 1.25;

//  -------------- POST PROCESSING / RENDER PIPELINE ---------------
const renderPipeline = new RenderPipeline(renderer);
// Isso aqui em baixo, o pass, é um hook, ao invés de mandar direto pra tela passe por aqui
const scenePass = pass(scene, camera);
scenePass.setMRT(
  mrt({
    output,
    normal: packNormalToRGB(normalView),
    metalrough: vec2(metalness, roughness), // pack metalness and roughness into a single attachment
  }),
);

// ------------------ EXTRA NODE ------------------
const normalNode = scenePass.getTextureNode("normal").toInspector("Normal");

const sceneNormal = sample((uv) => {
  return unpackRGBToNormal(normalNode.sample(uv));
});
const colorNode = scenePass.getTextureNode("output").toInspector("Color Node");
// Thanks Mugen87 and sunag: https://github.com/mrdoob/three.js/blob/master/examples/webgpu_postprocessing_ssr.html#L165
const metalRoughNode = scenePass.getTextureNode("metalrough");
const depthNode = scenePass.getTextureNode("depth");

// ------------------- POST PROCESSING -------------------
const ssrPass = ssr(colorNode, depthNode, sceneNormal, {
  camera,
  metalnessNode: metalRoughNode.r,
  roughnessNode: metalRoughNode.g,
}).toInspector("SSR Pass");
ssrPass.quality.value = 1;
ssrPass.blurQuality = 3;
ssrPass.maxDistance.value = 1;
ssrPass.thickness.value = 0.03;

// ---------------- Render outputNode ----------------
renderPipeline.outputNode = smaa(colorNode.add(ssrPass.rgb));

// -------------------- INIT --------------------

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const keyLight = new THREE.DirectionalLight(0xffffff, 1);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.position.set(3, 4, 2);

scene.add(keyLight);

// ------------------ GLTF ------------------

const gltfLoader = new GLTFLoader();
let bedMonster;
try {
  bedMonster = await new Promise<THREE.Group<THREE.Object3DEventMap>>(
    (resolve, reject) => {
      gltfLoader.load(
        "/objects/bed_monster.glb",
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            child.castShadow = true; // Faz o modelo projetar sombra
          });

          // const rootJoint = gltf.scene.getObjectByName("_rootJoint")!;

          // Lista todos os ossos do esqueleto
          // rootJoint.traverse((child: any) => {
          //   if (child["isBone"]) {
          //     console.log(child.name);
          //   }
          // });

          const leftArm = gltf.scene.getObjectByName("Arm_L_032");
          const rightArm = gltf.scene.getObjectByName("Arm_R_042");

          if (leftArm && rightArm) {
            leftArm.rotation.z = -Math.PI * 0.16;
            rightArm.rotation.z = -Math.PI * 2.02;
          }

          return resolve(model);
        },
        undefined,
        (error) => {
          reject(error);
        },
      );
    },
  );
} catch (error) {
  console.error("Error loading object:", error);
}
bedMonster && scene.add(bedMonster);

// -------------- Material and Objects -------------

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 5),
  new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    metalness: 1,
    roughness: 0.5,
  }),
);
floor.rotation.x = Math.PI * 0.6;
floor.position.y = -0.3;
floor.receiveShadow = true;
floor.material.color = new THREE.Color("#006644");
scene.add(floor);

// Box
const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1),
  new THREE.MeshStandardMaterial(),
);
box.position.set(2, 0.08, 1);
box.castShadow = true;
box.material.color = new THREE.Color("#e4e");

// Box
const torus = new THREE.Mesh(
  new THREE.TorusGeometry(0.3, 0.1),
  new THREE.MeshStandardMaterial(),
);
torus.position.set(-2, 1, -1.2);
torus.rotation.x = Math.PI * 0.4;
torus.castShadow = true;
torus.material.color = new THREE.Color("rgb(0, 191, 255)");

scene.add(box, torus);

// --------------------- Stats ---------------------

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderPipeline.render();
});
