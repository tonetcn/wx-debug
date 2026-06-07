/**
 * 监听网络请求
 */

const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 🌐 监听网络请求（按 Ctrl+C 停止）...\n')

  await cdpSend(ws, 'Network.enable')

  const requests = new Map()

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString())

    if (msg.method === 'Network.requestWillBeSent') {
      const { requestId, request } = msg.params
      requests.set(requestId, {
        url: request.url,
        method: request.method,
        time: new Date().toLocaleTimeString('zh-CN'),
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
  })

  await new Promise(() => {})
}

module.exports = { run }
