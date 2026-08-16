import type { Vector3 } from "three";

export type MappedNode = {
  position: Vector3;
  scale: number;
  id: string;
  label: string;
  order: number;
  category: string;
  techniques: string[];
};
