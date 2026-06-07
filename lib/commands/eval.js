/**
 * 执行 JavaScript
 */

const { cdpSend } = require('../cdp')

async function run(ws, code) {
  if (!code) {
    console.log(' ❌ 请提供要执行的代码')
    return
  }

  console.log(` ⚡ 执行代码: ${code.substring(0, 50)}...\n`)

  const result = await cdpSend(ws, 'Runtime.evaluate', {
    expression: code,
    returnByValue: true,
  })

  if (result.exceptionDetails) {
    const { exception, stackTrace, text } = result.exceptionDetails
    console.log(' ❌ 执行错误:', text)
    if (exception) {
      console.log('    异常:', exception.description || exception.value)
    }
    if (stackTrace) {
      console.log('    堆栈:', stackTrace.description)
    }
  } else {
    console.log(' ✅ 结果:')
    console.log(JSON.stringify(result.result.value, null, 2))
  }
}

module.exports = { run }
