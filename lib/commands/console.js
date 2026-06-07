/**
 * 监听控制台日志
 */

const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 📋 监听控制台日志（按 Ctrl+C 停止）...\n')

  await cdpSend(ws, 'Runtime.enable')

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString())
    if (msg.method === 'Runtime.consoleAPICalled') {
      const { type, args } = msg.params
      const text = args.map((a) => a.value || a.description || '').join(' ')
      const time = new Date().toLocaleTimeString('zh-CN')
      const icon = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '📝'
      console.log(` [${time}] ${icon} ${type}: ${text}`)
    }
  })

  await new Promise(() => {})
}

module.exports = { run }
