import gsap from "gsap";
import { SplitText } from "gsap/all";
import type { MappedNode } from "../types";
import "./styles.css";

gsap.registerPlugin(SplitText);

const parseNodeLegendToElement = (
  mNode: Pick<MappedNode, "category" | "techniques">,
): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("node-legend");

  const title = document.createElement("h2");
  title.classList.add("title");
  title.textContent = `Category: ${mNode.category}`;
  wrapper.appendChild(title);

  const techniquesList = document.createElement("ul");
  techniquesList.classList.add("technique", "hide");

  mNode.techniques.forEach((technique) => {
    const techniqueElem = document.createElement("li");
    // techniqueElem.classList.add("hide");
    techniqueElem.innerText = `> ${technique}`;
    techniquesList.appendChild(techniqueElem);
    wrapper.appendChild(techniquesList);

    const splitTechniques = SplitText.create(techniqueElem, {
      type: "words",
    });

    gsap.from(splitTechniques.words, {
      opacity: 1,
      autoAlpha: 0,
      stagger: {
        each: 0.05,
      },
    });
  });

  const splitTitle = SplitText.create(title, {
    type: "chars",
  });

  gsap.from(splitTitle.chars, {
    opacity: 1,
    autoAlpha: 0,
    stagger: {
      each: 0.03,
    },
  });

  setTimeout(() => {
    document.querySelector(".node-legend .technique")?.classList.remove("hide");

    const splitTechniques = SplitText.create(".node-legend .technique li", {
      type: "lines, chars",
      mask: "lines",
    });

    gsap.from(splitTechniques.chars, {
      autoAlpha: 0,
      duration: 0.03,
      stagger: {
        each: 0.03,
      },
    });
  }, 0); // to go to the another stack

  return wrapper;
};

export default parseNodeLegendToElement;
