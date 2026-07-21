import { makeBadge } from "badge-maker";
import sharp from "sharp";
import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;
import fs from "node:fs";
import def from "./src/packs/default.json" with { type: "json" };

// Memorable days that show the message actually changing day to day.
const DAYS = [
  "January 1",
  "February 14",
  "March 14",
  "July 21",
  "October 31",
  "December 25",
];

const W = 640;
const H = 64;
const DELAY = 1100; // ms per frame

const enc = GIFEncoder();

for (const day of DAYS) {
  const message = def[day] || "You're amazing!";
  const svg = makeBadge({
    label: "Today is ...",
    message,
    color: "pink",
    style: "for-the-badge",
  });

  // Rasterize the badge, left-aligned on a white canvas of fixed size.
  const badgePng = await sharp(Buffer.from(svg))
    .resize({ width: W - 40, height: 44, fit: "inside" })
    .png()
    .toBuffer();
  const meta = await sharp(badgePng).metadata();

  const frame = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: badgePng, left: 20, top: Math.round((H - meta.height) / 2) }])
    .raw()
    .toBuffer();

  const rgba = new Uint8Array(frame.buffer, frame.byteOffset, frame.byteLength);
  const palette = quantize(rgba, 256);
  const index = applyPalette(rgba, palette);
  enc.writeFrame(index, W, H, { palette, delay: DELAY });
  console.log("frame:", day, "→", message.slice(0, 32));
}

enc.finish();
fs.writeFileSync("../daily-badge-demo.gif", enc.bytes());
console.log("wrote daily-badge-demo.gif", enc.bytes().length, "bytes");
