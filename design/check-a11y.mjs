import { launchEdge } from 'file:///D:/Projects/.tools/edge-session.mjs'
const [,, url] = process.argv
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const edge = await launchEdge()
try {
  const tab = await edge.newTab()
  await tab.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })
  await tab.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await tab.goto(url); await sleep(3500)
  // Tab order
  const order = []
  for (let i = 0; i < 9; i++) {
    await tab.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await tab.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    order.push(await tab.eval(`(() => { const e = document.activeElement; const cs = getComputedStyle(e); return (e.dataset.role || e.id || e.tagName) + ':' + (e.matches(':focus-visible') ? 'ring' : 'noring') + ':' + cs.outlineWidth })()`))
  }
  console.log('tab order', order.join(' → '))
  // Reduced-motion change: layers must swap without animation, message updates.
  const before = await tab.eval(`document.querySelector('.sheet.current .message').textContent`)
  await tab.eval(`(() => { const s = document.querySelector('.sheet.current [data-role="pack"]'); s.value = 'space'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  await sleep(2500)
  console.log('reduced-motion swap', JSON.stringify(await tab.eval(`JSON.stringify({before: ${JSON.stringify(before)}, after: document.querySelector('.sheet.current .message').textContent, pack: document.querySelector('.sheet.current .pack-label').textContent, anims: document.getAnimations().length, status: document.getElementById('status').textContent, snippet: document.getElementById('snippet').textContent.includes('pack=space')})`)))
  // Colour text commit + invalid revert
  await tab.eval(`(() => { const t = document.querySelector('.sheet.current [data-role="colourText"]'); t.value = '#0000ff'; t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`)
  await sleep(2500)
  console.log('colour commit', await tab.eval(`JSON.stringify({snippet: document.getElementById('snippet').textContent.includes('color=0000ff'), picker: document.querySelector('.sheet.current [data-role="colour"]').value, url: location.search})`))
  await tab.eval(`(() => { const t = document.querySelector('.sheet.current [data-role="colourText"]'); t.value = 'nope'; t.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); })()`)
  await sleep(300)
  console.log('invalid colour reverted', await tab.eval(`document.querySelector('.sheet.current [data-role="colourText"]').value`))
  // Copy button → status announced
  await tab.eval(`document.getElementById('copy').click()`); await sleep(300)
  console.log('copy', await tab.eval(`JSON.stringify({label: document.getElementById('copy').textContent, status: document.getElementById('status').textContent})`))
  // Wall row click selects pack
  await tab.eval(`document.querySelector('#wall button[data-pack="moon"]').click()`); await sleep(2500)
  console.log('wall click', await tab.eval(`JSON.stringify({pack: document.querySelector('.sheet.current .pack-label').textContent, pressed: document.querySelector('#wall button[data-pack="moon"]').getAttribute('aria-pressed'), select: document.querySelector('.sheet.current [data-role="pack"]').value})`))
  // Console errors
  console.log('errors', await tab.eval(`(window.__errs || []).length`))
} finally { await edge.close() }
