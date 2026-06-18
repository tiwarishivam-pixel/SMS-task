const createSeatLabels = (count) => {
  const labels = [];
  for (let i = 0; i < count; i += 1) {
    const row = String.fromCharCode(65 + Math.floor(i / 10));
    const number = (i % 10) + 1;
    labels.push(`${row}${number}`);
  }
  return labels;
};

module.exports = { createSeatLabels };
