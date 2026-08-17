const bootLines = document.querySelector<HTMLDivElement>(".boot-lines")!;

const printLine = (text: string, ok = true) => {
  const line = document.createElement("div");

  line.className = "boot-line";
  line.innerHTML = ok ? `> ${text} <span class="ok">[OK]</span>` : `> ${text}`;
  bootLines.appendChild(line);
};

export default printLine;
