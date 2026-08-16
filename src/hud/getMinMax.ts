const getMinMax = (numbers: number[]) => {
  const minOrder = Math.min(...numbers);
  const maxOrder = Math.max(...numbers);

  return [minOrder, maxOrder];
};

export default getMinMax;
