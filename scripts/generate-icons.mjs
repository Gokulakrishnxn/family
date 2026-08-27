/**
 * Renders the Family brand mark to the PNG sizes a home-screen shortcut needs.
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function sampleCircle(px, py, cx, cy, r) {
  const d = Math.hypot(px - cx, py - cy);
  const aa = 0.65;
  if (d <= r - aa) return 1;
  if (d >= r + aa) return 0;
  return (r + aa - d) / (aa * 2);
}

/** Brand mark in a 32-unit viewBox, scaled into a square canvas. */
function paintIcon(size, { pad = 0, rounded = false } = {}) {
  const scale = 4;
  const big = size * scale;
  const pixels = Buffer.alloc(big * big * 4);
  const inset = pad * scale;
  const box = big - inset * 2;
  const s = box / 32;
  const ox = inset;
  const oy = inset;

  const dots = [
    { x: 11, y: 12, r: 3.4 },
    { x: 21, y: 12, r: 3.4 },
    { x: 11, y: 21.5, r: 2.4 },
    { x: 21, y: 21.5, r: 2.4 },
  ];

  for (let y = 0; y < big; y++) {
    for (let x = 0; x < big; x++) {
      const i = (y * big + x) * 4;
      let ink = 1;
      if (rounded) {
        const rx = 9 * (big / 32);
        const nx = Math.max(x - rx, 0, x - (big - 1 - rx));
        const ny = Math.max(y - rx, 0, y - (big - 1 - rx));
        ink = sampleCircle(nx === 0 ? rx : x, ny === 0 ? rx : y, rx, rx, rx);
        if (x >= rx && x <= big - 1 - rx) ink = 1;
        if (y >= rx && y <= big - 1 - rx) ink = Math.max(ink, x >= 0 && x <= big - 1 ? 1 : 0);
        const inX = x >= rx && x <= big - 1 - rx;
        const inY = y >= rx && y <= big - 1 - rx;
        if (inX || inY) {
          ink = 1;
        } else {
          const cx = x < rx ? rx : big - 1 - rx;
          const cy = y < rx ? rx : big - 1 - rx;
          ink = sampleCircle(x, y, cx, cy, rx);
        }
      }

      let cover = 0;
      for (const d of dots) {
        cover = Math.max(cover, sampleCircle(x, y, ox + d.x * s, oy + d.y * s, d.r * s));
      }

      const a = Math.round(255 * ink);
      const channel = Math.round(255 * cover);
      pixels[i] = channel;
      pixels[i + 1] = channel;
      pixels[i + 2] = channel;
      pixels[i + 3] = a;
    }
  }

  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((y * scale + dy) * big + (x * scale + dx)) * 4;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          a += pixels[i + 3];
        }
      }
      const o = (y * size + x) * 4;
      const n = scale * scale;
      rgba[o] = Math.round(r / n);
      rgba[o + 1] = Math.round(g / n);
      rgba[o + 2] = Math.round(b / n);
      rgba[o + 3] = Math.round(a / n);
    }
  }

  return encodePng(size, size, rgba);
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Family">
  <rect width="32" height="32" rx="9" fill="#0a0a0a"/>
  <circle cx="11" cy="12" r="3.4" fill="#ffffff"/>
  <circle cx="21" cy="12" r="3.4" fill="#ffffff"/>
  <circle cx="11" cy="21.5" r="2.4" fill="#ffffff"/>
  <circle cx="21" cy="21.5" r="2.4" fill="#ffffff"/>
</svg>
`;

const targets = [
  { file: join(root, "public/icons/icon-192.png"), size: 192 },
  { file: join(root, "public/icons/icon-512.png"), size: 512 },
  { file: join(root, "public/icons/icon-maskable-512.png"), size: 512, pad: 48 },
  { file: join(root, "public/apple-touch-icon.png"), size: 180 },
  { file: join(root, "src/app/icon.png"), size: 192 },
  { file: join(root, "src/app/apple-icon.png"), size: 180 },
];

for (const { file, size, pad } of targets) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, paintIcon(size, { pad }));
  console.log("wrote", file.slice(root.length + 1));
}

writeFileSync(join(root, "public/icon.svg"), svg);
console.log("wrote public/icon.svg");
