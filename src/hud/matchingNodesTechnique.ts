import type { MappedNode } from "./types";

const getMatchingNodesTechnique = (mappedNodes: MappedNode[]) => {
  const matchingNodeTechniques: {
    from: MappedNode;
    to: MappedNode;
    matches: number;
  }[] = [];

  for (let indexAnchor = 0; indexAnchor < mappedNodes.length; indexAnchor++) {
    const anchor = mappedNodes[indexAnchor];

    for (
      let indexExplorer = indexAnchor + 1;
      indexExplorer < mappedNodes.length;
      indexExplorer++
    ) {
      const explorer = mappedNodes[indexExplorer];

      const matches = anchor.techniques.filter((tech) =>
        explorer.techniques.includes(tech),
      ).length;

      if (matches >= 2) {
        matchingNodeTechniques.push({
          from: anchor,
          to: explorer,
          matches,
        });
      }
    }
  }

  return matchingNodeTechniques;
};

export default getMatchingNodesTechnique;
