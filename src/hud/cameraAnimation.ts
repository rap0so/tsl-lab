import gsap from "gsap";

import { camera, controls } from "../utils/setup";

const cameraAnimation = () => {
  controls.enabled = false;
  gsap.fromTo(
    camera.position,
    { x: 15 },
    {
      x: -3,
      y: -0.5,
      duration: 5,
      ease: "power2.inOut",
      onComplete: () => {
        controls.enabled = true;
      },
    },
  );
};

export default cameraAnimation;
