/**
 * 导出网络请求为 HAR 格式
 * HAR (HTTP Archive) 1.2 格式，可导入 Chrome DevTools 分析
 */

const { cdpSend } = require('../cdp')
const fs = require('fs')
const path = require('path')
const os = require('os')

async function run(ws) {
  console.log(' 📦 导出网络请求为 HAR 格式（按 Ctrl+C 停止并导出）...\n')

  await cdpSend(ws, 'Network.enable')

  // HAR 条目存储
  const entries = new Map()

  // 生成唯一文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const harDir = path.join(os.homedir(), '.wx-debug', 'har')

  // 确保目录存在
  if (!fs.existsSync(harDir)) {
    fs.mkdirSync(harDir, { recursive: true })
  }

  const filePath = path.join(harDir, `network-${timestamp}.har`)

  // 监听请求开始
  ws.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch (e) {
      return
    }

    // 请求发送
    if (msg.method === 'Network.requestWillBeSent') {
      const { requestId, request, timestamp: startTime } = msg.params
      entries.set(requestId, {
        startedDateTime: new Date(startTime).toISOString(),
        request: {
          method: request.method,
          url: request.url,
          httpVersion: 'HTTP/1.1',
          cookies: [],
          headers: Object.entries(request.headers || {}).map(([name, value]) => ({
            name,
            value: String(value),
          })),
          queryString: [],
          postData: request.postData ? {
            mimeType: request.headers?.['Content-Type'] || '',
            text: request.postData,
          } : null,
          headersSize: -1,
          bodySize: request.postData ? request.postData.length : 0,
        },
        response: null,
        timings: {
          send: 0,
          wait: 0,
          receive: 0,
        },
      })
      console.log(` 📤 [${request.method}] ${request.url.substring(0, 80)}`)
    }

    // 收到响应头
    if (msg.method === 'Network.responseReceived') {
      const { requestId, response } = msg.params
      const entry = entries.get(requestId)
      if (entry) {
        entry.response = {
          status: response.status,
          statusText: response.statusText || '',
          httpVersion: 'HTTP/1.1',
          cookies: [],
          headers: Object.entries(response.headers || {}).map(([name, value]) => ({
            name,
            value: String(value),
          })),
          content: {
            size: response.headers?.['content-length'] || 0,
            mimeType: response.mimeType || '',
          },
          redirectURL: response.protocol === 'http' ? '' : '',
          headersSize: -1,
          bodySize: -1,
        }
        console.log(` 📥 [${response.status}] ${entry.request.url.substring(0, 80)}`)
      }
    }

    // 数据接收
    if (msg.method === 'Network.dataReceived') {
      const { requestId, dataLength } = msg.params
      const entry = entries.get(requestId)
      if (entry && entry.response) {
        entry.response.content.size += dataLength
      }
    }

    // 请求完成
    if (msg.method === 'Network.loadingFinished') {
      const { requestId, timestamp: endTime } = msg.params
      const entry = entries.get(requestId)
      if (entry) {
        const endTimeMs = new Date(endTime).getTime()
        const startTimeMs = new Date(entry.startedDateTime).getTime()
        entry.time = Math.max(0, endTimeMs - startTimeMs)
        entry.timings.receive = entry.time
        entry.response.bodySize = entry.response.content.size
        console.log(` ✅ 完成 ${entry.request.url.substring(0, 80)}`)
      }
    }

    // 请求失败
    if (msg.method === 'Network.loadingFailed') {
      const { requestId, errorText } = msg.params
      const entry = entries.get(requestId)
      if (entry) {
        entry.response = {
          status: 0,
          statusText: errorText,
          httpVersion: 'HTTP/1.1',
          cookies: [],
          headers: [],
          content: {
            size: 0,
            mimeType: '',
          },
          redirectURL: '',
          headersSize: -1,
          bodySize: 0,
        }
        console.log(` ❌ 失败 ${entry.request.url.substring(0, 80)} - ${errorText}`)
      }
    }
  })

  // Ctrl+C 时导出
  process.on('SIGINT', () => {
    console.log('\n\n ⏹️  停止监听，正在导出 HAR 文件...\n')

    // 构建 HAR 1.2 格式
    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'wx-debug',
          version: '1.0',
        },
        entries: Array.from(entries.values()).filter(e => e.response !== null),
      },
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(har, null, 2), 'utf-8')
      console.log(` ✅ HAR 文件已保存: ${filePath}`)
      console.log(` 📊 共导出 ${har.log.entries.length} 条请求记录`)
    } catch (err) {
      console.error(` ❌ 保存失败: ${err.message}`)
    }

    process.exit(0)
  })

  console.log(' 💡 提示: 按 Ctrl+C 停止监听并导出文件\n')

  // 保持运行
  await new Promise(() => {})
}

module.exports = { run }
