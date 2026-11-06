import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { Buffer } from 'buffer';

function createPNG(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function coffeePixel(x, y, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const r = width / 2;

  // Normalized coordinates in [-1, 1]
  const nx = (x - cx) / r;
  const ny = (y - cy) / r;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background: Deep Slate #0f172a
  let red = 15, green = 23, blue = 42, alpha = 255;

  // Gold Ring (radius 0.82 to 0.88)
  if (dist >= 0.82 && dist <= 0.88) {
    return [245, 158, 11, 255]; // Amber #f59e0b
  }

  // Inner subtle background inside the badge
  if (dist < 0.82) {
    red = 26; green = 37; blue = 56;
  }

  // 1. Saucer at bottom
  const saucerY = 0.44;
  const sDy = (ny - saucerY) / 0.08;
  const sDx = nx / 0.42;
  if (sDx * sDx + sDy * sDy <= 1) {
    return [245, 158, 11, 255];
  }

  // 2. Cup Body
  if (ny >= -0.15 && ny <= 0.36) {
    // Cup tapers slightly from top to bottom
    const t = (ny - (-0.15)) / (0.36 - (-0.15));
    const halfWidth = 0.28 - t * 0.06;
    const cupLeft = -halfWidth - 0.05;
    const cupRight = halfWidth - 0.05;

    if (nx >= cupLeft && nx <= cupRight) {
      // Rounded bottom corners
      if (ny > 0.26) {
        const cornerT = (ny - 0.26) / 0.1;
        const inset = cornerT * cornerT * 0.07;
        if (nx >= cupLeft + inset && nx <= cupRight - inset) {
          return [251, 191, 36, 255]; // Amber #fbbf24
        }
      } else {
        return [251, 191, 36, 255];
      }
    }
  }

  // 3. Cup Handle
  const handleCx = 0.28 - 0.05;
  const handleCy = 0.10;
  const hDist = Math.sqrt(Math.pow(nx - handleCx, 2) + Math.pow((ny - handleCy) / 1.3, 2));
  if (hDist >= 0.09 && hDist <= 0.17 && nx > 0.18 - 0.05) {
    return [245, 158, 11, 255];
  }

  // 4. Steam waves (3 trails)
  if (ny >= -0.55 && ny <= -0.18) {
    const steamOffsets = [-0.18, -0.05, 0.08];
    for (const sx of steamOffsets) {
      const wave = Math.sin((ny + 0.18) * 16) * 0.035;
      const waveX = sx + wave;
      const dX = Math.abs(nx - waveX);
      if (dX < 0.022) {
        return [245, 158, 11, 230];
      }
    }
  }

  return [red, green, blue, alpha];
}

function createIco(pngBuffer) {
  // 6 bytes header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(1, 4); // 1 Image

  // 16 bytes directory entry
  const dir = Buffer.alloc(16);
  dir.writeUInt8(64, 0); // width 64
  dir.writeUInt8(64, 1); // height 64
  dir.writeUInt8(0, 2);  // color palette
  dir.writeUInt8(0, 3);  // reserved
  dir.writeUInt16LE(1, 4); // color planes
  dir.writeUInt16LE(32, 6); // bits per pixel
  dir.writeUInt32LE(pngBuffer.length, 8); // image size
  dir.writeUInt32LE(22, 12); // offset

  return Buffer.concat([header, dir, pngBuffer]);
}

const publicDir = path.resolve('public');

console.log('Generating PWA and iOS icons in', publicDir);

// 1. 192x192 PNG
const png192 = createPNG(192, 192, coffeePixel);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log('Created pwa-192x192.png');

// 2. 512x512 PNG
const png512 = createPNG(512, 512, coffeePixel);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log('Created pwa-512x512.png');

// 3. Apple Touch Icon (180x180)
const appleIcon = createPNG(180, 180, coffeePixel);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Created apple-touch-icon.png');

// 4. Favicon 64x64 PNG & ICO
const icoPng = createPNG(64, 64, coffeePixel);
const ico = createIco(icoPng);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
console.log('Created favicon.ico');

// 5. Favicon SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#0f172a"/>
  <circle cx="256" cy="256" r="210" fill="#1e293b" stroke="#f59e0b" stroke-width="16"/>
  <!-- Saucer -->
  <ellipse cx="240" cy="370" rx="120" ry="24" fill="#f59e0b"/>
  <!-- Cup -->
  <path d="M 160 210 L 320 210 L 300 330 C 298 348 280 355 240 355 C 200 355 182 348 180 330 Z" fill="#fbbf24"/>
  <!-- Handle -->
  <path d="M 315 235 C 365 240 365 305 310 310" fill="none" stroke="#f59e0b" stroke-width="20" stroke-linecap="round"/>
  <!-- Steam -->
  <path d="M 205 180 Q 195 155 205 130 Q 215 105 205 80" fill="none" stroke="#f59e0b" stroke-width="12" stroke-linecap="round" opacity="0.9"/>
  <path d="M 240 180 Q 230 155 240 130 Q 250 105 240 80" fill="none" stroke="#f59e0b" stroke-width="12" stroke-linecap="round" opacity="0.9"/>
  <path d="M 275 180 Q 265 155 275 130 Q 285 105 275 80" fill="none" stroke="#f59e0b" stroke-width="12" stroke-linecap="round" opacity="0.9"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
console.log('Created favicon.svg');
