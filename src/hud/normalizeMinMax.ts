const normalizeMinMax = (value: number, min: number, max: number) =>
  (value - min) / (max - min) || 0;

export default normalizeMinMax;
