import type { MappedNode } from "../types";
import "./styles.css";

const parseNodeLegendToElement = (mNode: MappedNode): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("node-legend");

  const title = document.createElement("h2");
  title.classList.add("title");
  title.textContent = `Category: ${mNode.category}`;
  wrapper.appendChild(title);

  const techniquesList = document.createElement("ul");
  techniquesList.classList.add("technique");

  mNode.techniques.forEach((technique) => {
    const techniqueElem = document.createElement("li");
    techniqueElem.innerText = `> ${technique}`;
    techniquesList.appendChild(techniqueElem);
  });
  wrapper.appendChild(techniquesList);

  return wrapper;
};

export default parseNodeLegendToElement;
