// Generic 20-color yarn palette (house codes Y01-Y20).
// RGB values are representative screen values for each yarn color.
// This is a generic palette: to use the colors of a real yarn line,
// supply your own palette in the same shape:
// [{ code, name, rgb: [r, g, b] }] — see README "Bring your own palette".

function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

const RAW = [
  ['Y01', 'Ecru', '#EDE6D6'],
  ['Y02', 'Cream', '#F3E5C8'],
  ['Y03', 'Butter', '#F2D06B'],
  ['Y04', 'Mustard', '#D9A441'],
  ['Y05', 'Pumpkin', '#E07B39'],
  ['Y06', 'Terracotta', '#C96F4A'],
  ['Y07', 'Rust', '#A85638'],
  ['Y08', 'Brick', '#B3402A'],
  ['Y09', 'Burgundy', '#7E2F3C'],
  ['Y10', 'Rose', '#E3A6B0'],
  ['Y11', 'Plum', '#7B4B6D'],
  ['Y12', 'Lavender', '#B3A6D9'],
  ['Y13', 'Denim', '#5B7DA3'],
  ['Y14', 'Navy', '#2E4057'],
  ['Y15', 'Teal', '#3E7C7B'],
  ['Y16', 'Sage', '#A3B18A'],
  ['Y17', 'Forest', '#2F5233'],
  ['Y18', 'Cocoa', '#6F4E37'],
  ['Y19', 'Charcoal', '#3A3A3C'],
  ['Y20', 'Black', '#1D1D1F'],
];

export const yarn20 = RAW.map(([code, name, h]) => ({ code, name, rgb: hex(h) }));
export default yarn20;
