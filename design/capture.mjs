// Captures the customizer via headless Edge (rule 8: no in-app browser pane).
// Usage: node design/capture.mjs <pageUrl> <outDir>
import { launchEdge } from 'file:///D:/Projects/.tools/edge-session.mjs'
import { writeFileSync } from 'node:fs'
const [,, url, out = 'design/current'] = process.argv
const edge = await launchEdge()
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
try {
  const tab = await edge.newTab()
  await tab.send('Runtime.enable'); await tab.send('Log.enable')
  const errors = []
  tab.send('Runtime.exceptionThrown').catch(()=>{})
  async function shot(name, w, h, media = {}) {
    await tab.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 })
    await tab.send('Emulation.setEmulatedMedia', { features: Object.entries(media).map(([name, value]) => ({ name, value })) })
    await tab.goto(url); await sleep(3500)
    await tab.eval('document.fonts.ready')
    const png = await tab.screenshot()
    writeFileSync(`${out}/${name}.png`, png)
    const info = await tab.eval(`JSON.stringify({
      title: document.title,
      msg: document.querySelector('.sheet.current .message').textContent,
      cls: document.querySelector('.sheet.current .message').className,
      script: document.querySelector('.sheet.current .message').dataset.script,
      fontSize: getComputedStyle(document.querySelector('.sheet.current .message')).fontSize,
      font: getComputedStyle(document.querySelector('.sheet.current .message')).fontFamily.split(',')[0],
      foot: document.querySelector('.sheet.current .footnote').textContent,
      snippetTop: Math.round(document.querySelector('.md-strip').getBoundingClientRect().top + scrollY),
      scrollWidth: document.documentElement.scrollWidth, innerWidth,
      wall: document.querySelectorAll('#wall li').length,
      badgeW: document.querySelector('.sheet.current .badge').naturalWidth,
      fontsLoaded: [...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).filter((v,i,a)=>a.indexOf(v)===i)
    })`)
    console.log(name, info)
    return info
  }
  await shot('desktop-1440', 1440, 900)
  await shot('desktop-1280x720', 1280, 720)
  await shot('phone-360', 360, 800)
  await shot('desktop-dark', 1440, 900, { 'prefers-color-scheme': 'dark' })
  // Korean pack, phone
  const u = new URL(url); u.searchParams.set('pack', 'ko'); u.searchParams.set('tz', 'Asia/Seoul')
  const saveUrl = url
  process.argv[2] = u.toString()
  await tab.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 1, mobile: true })
  await tab.send('Emulation.setEmulatedMedia', { features: [] })
  await tab.goto(u.toString()); await sleep(3500); await tab.eval('document.fonts.ready')
  writeFileSync(`${out}/phone-360-ko.png`, await tab.screenshot())
  console.log('phone-ko', await tab.eval(`JSON.stringify({msg: document.querySelector('.sheet.current .message').textContent, font: getComputedStyle(document.querySelector('.sheet.current .message')).fontFamily.split(',')[0], size: getComputedStyle(document.querySelector('.sheet.current .message')).fontSize, script: document.querySelector('.sheet.current .message').dataset.script})`))
  // Long pun, desktop
  u.searchParams.set('pack', 'puns'); u.searchParams.set('tz', 'UTC')
  await tab.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await tab.goto(u.toString()); await sleep(3500); await tab.eval('document.fonts.ready')
  writeFileSync(`${out}/desktop-puns.png`, await tab.screenshot())
  console.log('puns', await tab.eval(`JSON.stringify({msg: document.querySelector('.sheet.current .message').textContent, cls: document.querySelector('.sheet.current .message').className, size: getComputedStyle(document.querySelector('.sheet.current .message')).fontSize})`))
} finally { await edge.close() }
