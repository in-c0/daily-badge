import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
<rect width="128" height="128" rx="28" fill="#ff4d97"/>
<path d="M64 22 C70 50 78 58 106 64 C78 70 70 78 64 106 C58 78 50 70 22 64 C50 58 58 50 64 22 Z" fill="#ffffff"/>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("icon.png");
console.log("wrote icon.png");
