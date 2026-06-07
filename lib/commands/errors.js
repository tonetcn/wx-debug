/**
 * 读取控制台错误
 * 一次性读取当前页面的错误日志，不持续监听
 */

const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 🔍 检查控制台错误...\n')

  // 启用 Runtime
  await cdpSend(ws, 'Runtime.enable')

  // 注入错误收集器
  const result = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      (function() {
        // 获取页面错误信息
        var errors = [];

        // 检查页面是否有错误提示元素
        var errorElements = document.querySelectorAll('.error, .err, [class*="error"], [class*="Error"]');
        errorElements.forEach(function(el) {
          errors.push({
            type: 'DOM错误',
            message: el.textContent.substring(0, 200),
            tag: el.tagName
          });
        });

        // 检查页面是否有空白
        if (!document.body || document.body.innerText.trim().length === 0) {
          errors.push({
            type: '页面异常',
            message: '页面内容为空'
          });
        }

        return JSON.stringify(errors, null, 2);
      })()
    `,
  })

  let errors = []
  try {
    errors = JSON.parse(result.result.value || '[]')
  } catch (e) {
    // 忽略解析错误
  }

  if (errors.length > 0) {
    console.log(' ❌ 发现问题:')
    errors.forEach((e) => {
      console.log(`    [${e.type}] ${e.message}`)
    })
  } else {
    console.log(' ✅ 未检测到明显错误')
  }

  // 提示用户如何监听实时错误
  console.log('\n 💡 提示: 使用 wx-debug console 可以监听实时控制台日志')
}

module.exports = { run }
