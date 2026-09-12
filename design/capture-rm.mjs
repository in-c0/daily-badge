import { launchEdge } from 'file:///D:/Projects/.tools/edge-session.mjs'
import sharp from '../worker/node_modules/sharp/lib/index.js'
const [,, url] = process.argv
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const edge = await launchEdge()
try {
  const tab = await edge.newTab()
  await tab.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 560, deviceScaleFactor: 1, mobile: false })
  await tab.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await tab.goto(url); await sleep(3500); await tab.eval('document.fonts.ready')
  const before = await tab.screenshot()
  await tab.eval(`(() => { const s = document.querySelector('.sheet.current [data-role="pack"]'); s.value = 'stoic'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  // poll every 30ms for 2s; record whether any animation ever existed
  let anims = 0
  for (let i = 0; i < 60; i++) { anims += await tab.eval('document.getAnimations().length'); await sleep(30) }
  const after = await tab.screenshot()
  const W = 800, H = 407
  const lab = (t) => Buffer.from(`<svg width="${W}" height="${H}"><rect x="0" y="${H-22}" width="220" height="22" fill="#24201D"/><text x="6" y="${H-7}" font-family="Consolas,monospace" font-size="13" fill="#FFF8EA">${t}</text></svg>`)
  const a = await sharp(before).resize(W, H).composite([{ input: lab('REDUCED MOTION — BEFORE'), top: 0, left: 0 }]).png().toBuffer()
  const b = await sharp(after).resize(W, H).composite([{ input: lab('REDUCED MOTION — AFTER (animations seen: ' + anims + ')'), top: 0, left: 0 }]).png().toBuffer()
  await sharp({ create: { width: W * 2 + 24, height: H + 16, channels: 4, background: '#EAE1D2' } }).composite([{ input: a, left: 8, top: 8 }, { input: b, left: W + 16, top: 8 }]).png().toFile('design/current/reduced-motion.png')
  console.log('animations observed during reduced-motion swap:', anims)
} finally { await edge.close() }
