const showFallBack = () => {
  const VIDEO_PATH = "/hud/fallback-vid.mp4";
  const videoElem = document.createElement("video");

  videoElem.autoplay = true;
  videoElem.muted = true;
  videoElem.loop = true;
  videoElem.playsInline = true;
  videoElem.controls = true;

  const sourceVideoElem = document.createElement("source");
  sourceVideoElem.src = VIDEO_PATH;
  sourceVideoElem.type = "video/mp4";

  videoElem.appendChild(sourceVideoElem);

  const videoFallbackWrapper = document.getElementById("video-fallback")!;
  videoFallbackWrapper.appendChild(videoElem);
  videoFallbackWrapper.classList.add("on");
};

export default showFallBack;
