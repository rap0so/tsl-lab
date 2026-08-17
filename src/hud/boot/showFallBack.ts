const showFallBack = () => {
  const VIDEO_PATH = "hud/fallback-vid.mov";
  const videoElem = document.createElement("video");

  videoElem.autoplay = true;
  videoElem.muted = true;
  videoElem.loop = true;
  videoElem.playsInline = true;
  videoElem.controls = false;

  const sourceVideoElem = document.createElement("source");
  sourceVideoElem.src = VIDEO_PATH;
  sourceVideoElem.type = "video/mov";

  videoElem.appendChild(sourceVideoElem);

  const videoFallbackWrapper = document.getElementById("video-fallback")!;
  videoFallbackWrapper.appendChild(videoElem);
  videoFallbackWrapper.classList.add("on");
};

export default showFallBack;
