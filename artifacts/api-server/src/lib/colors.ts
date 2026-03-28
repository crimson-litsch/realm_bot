const PALETTE = [
  0xe74c3c, // red
  0xe67e22, // orange
  0xf39c12, // amber
  0x2ecc71, // green
  0x1abc9c, // teal
  0x3498db, // blue
  0x9b59b6, // purple
  0xe91e63, // pink
  0x00bcd4, // cyan
  0xff5722, // deep orange
  0x8bc34a, // light green
  0x03a9f4, // light blue
];

export function randomColor(): number {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export const PURPLE = 0x7b2d8b;
