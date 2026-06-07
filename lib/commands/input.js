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

  // 聚焦元素（带空值检查）
  const focusResult = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      (function() {
        var el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        el.focus();
        return true;
      })()
    `,
    returnByValue: true,
  })

  if (!focusResult.result.value) {
    console.log(` ❌ 未找到元素: ${selector}`)
    return
  }

  // 清空并输入
  await cdpSend(ws, 'Input.insertText', {
    text,
  })

  console.log(' ✅ 已输入')
}

module.exports = { run }
