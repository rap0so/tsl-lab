const bootLines = document.querySelector<HTMLDivElement>(".boot-lines")!;

const spanOk = '<span class="ok">[OK]</span>';
const spanError = '<span class="error">[ERROR]</span>';

const printLine = (text: string, ok = true) => {
  const line = document.createElement("div");

  line.className = "boot-line";
  line.innerHTML = `> ${text} ${ok ? spanOk : spanError}`;
  bootLines.appendChild(line);
};

export default printLine;
