/**
 * 监听网络请求
 */

const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 🌐 监听网络请求（按 Ctrl+C 停止）...\n')

  await cdpSend(ws, 'Network.enable')

  const requests = new Map()

  // 定期清理过期请求（5 分钟）
  const cleaner = setInterval(() => {
    const now = Date.now()
    for (const [id, req] of requests) {
      if (now - req.timestamp > 300000) {
        requests.delete(id)
      }
    }
  }, 60000)

  // 退出时清理
  process.on('SIGINT', () => {
    clearInterval(cleaner)
    process.exit(0)
  })

  ws.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch (e) {
      return // 忽略非 JSON 消息
    }

    if (msg.method === 'Network.requestWillBeSent') {
      const { requestId, request } = msg.params
      requests.set(requestId, {
        url: request.url,
        method: request.method,
        timestamp: Date.now(),
      })
      console.log(` 📤 [${request.method}] ${request.url.substring(0, 80)}`)
    }

    if (msg.method === 'Network.responseReceived') {
      const { requestId, response } = msg.params
      const req = requests.get(requestId)
      if (req) {
        console.log(` 📥 [${response.status}] ${req.url.substring(0, 80)}`)
      }
    }

    if (msg.method === 'Network.loadingFailed') {
      const { requestId, errorText } = msg.params
      const req = requests.get(requestId)
      if (req) {
        console.log(` ❌ [失败] ${req.url.substring(0, 80)} - ${errorText}`)
      }
    }

    // 请求完成时清理
    if (msg.method === 'Network.loadingFinished' || msg.method === 'Network.loadingFailed') {
      requests.delete(msg.params.requestId)
    }
  })

  await new Promise(() => {})
}

module.exports = { run }
