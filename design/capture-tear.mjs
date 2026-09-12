// Frame strip of the tear for Stage 4 review. node design/capture-tear.mjs <url> <outDir>
import { launchEdge } from 'file:///D:/Projects/.tools/edge-session.mjs'
import { writeFileSync } from 'node:fs'
import sharp from '../worker/node_modules/sharp/lib/index.js'
const [,, url, out = 'design/motion/tear'] = process.argv
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const TIMES = [0, 70, 140, 180, 190, 200, 210, 220, 230, 240, 250, 260, 280, 320, 390, 450]
const edge = await launchEdge()
try {
  const tab = await edge.newTab()
  await tab.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 560, deviceScaleFactor: 1, mobile: false })
  await tab.goto(url); await sleep(3500); await tab.eval('document.fonts.ready')
  await tab.eval(`window.__dbHoldTear = true; window.scrollTo(0, 0)`)
  // Trigger a committed pack change → fetch → image load → tear.
  await tab.eval(`(() => { const s = document.querySelector('.sheet.current [data-role="pack"]'); s.value = 'stoic'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  // Wait until the tear animation exists, then pause everything at t=0.
  let ok = false
  for (let i = 0; i < 60; i++) {
    ok = await tab.eval(`(() => { void document.body.offsetHeight; const a = document.getAnimations(); if (a.length >= 2) { a.forEach(x => { x.pause(); x.currentTime = 0; }); return true } return false })()`)
    if (ok) break; await sleep(50)
  }
  if (!ok) throw new Error('tear never started')
  const frames = []
  for (const t of TIMES) {
    await tab.eval(`document.getAnimations().forEach(a => { a.currentTime = ${t}; })`)
    await sleep(60)
    const png = await tab.screenshot()
    writeFileSync(`${out}/frame-${String(t).padStart(3, '0')}.png`, png)
    frames.push({ t, png })
  }
  // Let it finish and capture the hold state.
  await tab.eval(`document.getAnimations().forEach(a => a.play())`); await sleep(900)
  const hold = await tab.screenshot(); writeFileSync(`${out}/frame-hold.png`, hold); frames.push({ t: 'hold', png: hold })
  console.log('after', await tab.eval(`JSON.stringify({msg: document.querySelector('.sheet.current .message').textContent, pack: document.querySelector('.sheet.current .pack-label').textContent, anims: document.getAnimations().length})`))
  // Contact sheet: crop to the sheet area, 4 columns.
  const W = 540, H = 275, COLS = 4
  const tiles = []
  for (let i = 0; i < frames.length; i++) {
    const crop = await sharp(frames[i].png).extract({ left: 30, top: 50, width: 1040, height: 500 }).resize(W, H).png().toBuffer()
    const label = Buffer.from(`<svg width="${W}" height="${H}"><rect x="0" y="${H-22}" width="90" height="22" fill="#24201D"/><text x="6" y="${H-7}" font-family="Consolas,monospace" font-size="13" fill="#FFF8EA">${frames[i].t === 'hold' ? 'HOLD' : frames[i].t + ' ms'}</text><rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" fill="none" stroke="#968A7C"/></svg>`)
    tiles.push({ input: await sharp(crop).composite([{ input: label, top: 0, left: 0 }]).png().toBuffer(), left: (i % COLS) * (W + 8) + 8, top: Math.floor(i / COLS) * (H + 8) + 8 })
  }
  const rows = Math.ceil(frames.length / COLS)
  await sharp({ create: { width: COLS * (W + 8) + 8, height: rows * (H + 8) + 8, channels: 4, background: '#EAE1D2' } }).composite(tiles).png().toFile(`${out}/strip-1.png`)
  console.log('wrote', `${out}/strip-1.png`, frames.length, 'frames')
} finally { await edge.close() }
