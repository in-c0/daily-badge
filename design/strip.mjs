// Rebuild a contact sheet from design/motion/tear/frame-*.png. node design/strip.mjs <cols> <out>
import sharp from '../worker/node_modules/sharp/lib/index.js'
import { readdirSync } from 'node:fs'
const [,, colsArg = '3', out = 'design/current/strip-1.png'] = process.argv
const COLS = +colsArg, W = 520, H = 250
const dir = 'design/motion/tear'
const files = readdirSync(dir).filter(f => /^frame-/.test(f)).sort((a, b) => (a.includes('hold') ? 1 : b.includes('hold') ? -1 : a.localeCompare(b)))
const tiles = []
for (let i = 0; i < files.length; i++) {
  const t = files[i].replace(/frame-|\.png/g, '')
  const crop = await sharp(`${dir}/${files[i]}`).extract({ left: 30, top: 50, width: 1040, height: 500 }).resize(W, H).png().toBuffer()
  const label = Buffer.from(`<svg width="${W}" height="${H}"><rect x="0" y="${H-22}" width="90" height="22" fill="#24201D"/><text x="6" y="${H-7}" font-family="Consolas,monospace" font-size="13" fill="#FFF8EA">${t === 'hold' ? 'HOLD' : +t + ' ms'}</text><rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" fill="none" stroke="#968A7C"/></svg>`)
  tiles.push({ input: await sharp(crop).composite([{ input: label, top: 0, left: 0 }]).png().toBuffer(), left: (i % COLS) * (W + 8) + 8, top: Math.floor(i / COLS) * (H + 8) + 8 })
}
const rows = Math.ceil(files.length / COLS)
await sharp({ create: { width: COLS * (W + 8) + 8, height: rows * (H + 8) + 8, channels: 4, background: '#EAE1D2' } }).composite(tiles).png().toFile(out)
console.log('wrote', out, files.length)
