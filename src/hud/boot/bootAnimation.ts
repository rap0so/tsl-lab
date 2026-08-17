import gsap from "gsap";
import cameraAnimation from "../cameraAnimation";
import printLine from "./printLine";

const bootLoadingWrapper = document.getElementById("boot-loading")!;

const bootSequence = () => {
  const tl = gsap.timeline();

  const steps = [
    "INITIALIZING WEBGPU BACKEND",
    "LOADING SCENE · 9 NODES",
    "COMPUTING NETWORK TOPOLOGY · 8 LINKS",
    "RENDER PIPELINE · BLOOM · SSR",
    "SYSTEM READY",
  ];

  steps.forEach((text, i) => {
    const position = i * 0.4;
    tl.call(() => printLine(text), [], position);
  });

  tl.to(
    {},
    {
      onComplete: () => {
        bootLoadingWrapper.classList.add("done");
        cameraAnimation();
      },
    },
    ">1",
  ).to(
    {},
    {
      duration: 1,
      onComplete: () => {
        bootLoadingWrapper.remove();
      },
    },
    ">",
  );
};

export default bootSequence;
