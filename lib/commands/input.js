/**
 * 模拟输入
 */

const { cdpSend } = require('../cdp')

async function run(ws, selector, text) {
  if (!selector || !text) {
    console.log(' ❌ 用法: wx-debug input <选择器> <内容>')
    return
  }

  console.log(` ⌨️ 输入: ${selector} -> ${text}\n`)

  await cdpSend(ws, 'Runtime.evaluate', {
    expression: `document.querySelector('${selector}').focus()`,
  })

  await cdpSend(ws, 'Input.insertText', {
    text,
  })

  console.log(' ✅ 已输入')
}

module.exports = { run }
