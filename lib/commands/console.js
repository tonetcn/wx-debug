/**
 * 监听控制台日志
 */

const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 📋 监听控制台日志（按 Ctrl+C 停止）...\n')

  await cdpSend(ws, 'Runtime.enable')

  ws.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch (e) {
      return // 忽略非 JSON 消息
    }

    if (msg.method === 'Runtime.consoleAPICalled') {
      const { type, args } = msg.params
      const text = args.map((a) => {
        if (a.value !== undefined) return String(a.value)
        if (a.description) return a.description
        if (a.type === 'object') return a.subtype || '[Object]'
        return ''
      }).join(' ')
      const time = new Date().toLocaleTimeString('zh-CN')
      const icon = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '📝'
      console.log(` [${time}] ${icon} ${type}: ${text}`)
    }
  })

  await new Promise(() => {})
}

module.exports = { run }
