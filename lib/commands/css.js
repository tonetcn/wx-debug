/**
 * 获取元素样式
 */

const { cdpSend } = require('../cdp')

async function run(ws, selector) {
  if (!selector) {
    console.log(' ❌ 请指定选择器，例如: wx-debug css .my-class')
    return
  }

  console.log(` 🎨 元素样式: ${selector}\n`)

  const styleResult = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      (function() {
        var el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return '未找到元素: ' + ${JSON.stringify(selector)};
        var style = window.getComputedStyle(el);
        var props = ['display', 'position', 'width', 'height', 'margin', 'padding',
                     'background', 'color', 'font-size', 'text-align', 'border',
                     'overflow', 'flex', 'grid'];
        return props.map(p => p + ': ' + style.getPropertyValue(p)).join('\\n');
      })()
    `,
  })

  console.log(styleResult.result.value)
}

module.exports = { run }
