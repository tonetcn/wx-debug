/**
 * 模拟点击
 */

const { cdpSend } = require('../cdp')

async function run(ws, selector) {
  if (!selector) {
    console.log(' ❌ 请指定选择器，例如: wx-debug click .my-button')
    return
  }

  console.log(` 🖱️ 点击: ${selector}\n`)

  const result = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      (function() {
        var el = document.querySelector('${selector}');
        if (!el) return null;
        var rect = el.getBoundingClientRect();
        return JSON.stringify({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      })()
    `,
    returnByValue: true,
  })

  if (!result.result.value) {
    console.log(' ❌ 未找到元素')
    return
  }

  const { x, y } = JSON.parse(result.result.value)

  await cdpSend(ws, 'Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  })
  await cdpSend(ws, 'Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  })

  console.log(` ✅ 已点击 (${Math.round(x)}, ${Math.round(y)})`)
}

module.exports = { run }
