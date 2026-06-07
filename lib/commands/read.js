/**
 * 读取页面内容
 */

const { cdpSend } = require('../cdp')

async function run(ws) {
  // 页面标题
  const titleResult = await cdpSend(ws, 'Runtime.evaluate', {
    expression: 'document.title',
  })
  console.log(` 📍 页面标题: ${titleResult.result.value}`)

  // 页面 URL
  const urlResult = await cdpSend(ws, 'Runtime.evaluate', {
    expression: 'window.location.href',
  })
  console.log(` 📍 页面 URL: ${urlResult.result.value}`)

  // 页面文本内容
  const textResult = await cdpSend(ws, 'Runtime.evaluate', {
    expression: 'document.body ? document.body.innerText.substring(0, 5000) : "无内容"',
  })
  const bodyText = textResult.result.value || ''

  console.log('\n 📝 页面内容预览:')
  console.log('─'.repeat(50))
  const lines = bodyText.split('\n').filter((l) => l.trim())
  lines.slice(0, 50).forEach((line) => {
    console.log(`    ${line.trim()}`)
  })
  if (lines.length > 50) {
    console.log(`    ... 还有 ${lines.length - 50} 行内容`)
  }
  console.log('─'.repeat(50))

  // 检查错误
  const errorCheck = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      (function() {
        var errors = [];
        if (!document.body || document.body.innerText.trim().length === 0) {
          errors.push('页面内容为空');
        }
        var errorElements = document.querySelectorAll('.error, .err, [class*="error"]');
        if (errorElements.length > 0) {
          errors.push('发现错误元素: ' + errorElements.length + '个');
        }
        return JSON.stringify(errors);
      })()
    `,
  })

  let errors = []
  try {
    errors = JSON.parse(errorCheck.result.value || '[]')
  } catch (e) {
    // 忽略解析错误
  }

  if (errors.length > 0) {
    console.log('\n ❌ 发现问题:')
    errors.forEach((e) => console.log(`    - ${e}`))
  } else {
    console.log('\n ✅ 未检测到明显错误')
  }
}

module.exports = { run }
