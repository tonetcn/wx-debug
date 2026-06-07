/**
 * CDP 连接核心
 * 通过 Chrome DevTools Protocol 连接微信开发者工具
 */

const http = require('http')
const WebSocket = require('ws')
const { getConfig } = require('./config')

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error('JSON 解析失败: ' + data.substring(0, 200)))
        }
      })
    }).on('error', reject)
  })
}

function cdpSend(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000)
    const timeout = setTimeout(() => reject(new Error('CDP 响应超时')), 10000)

    const handler = (data) => {
      const msg = JSON.parse(data.toString())
      if (msg.id === id) {
        clearTimeout(timeout)
        ws.removeListener('message', handler)
        if (msg.error) {
          reject(new Error(`CDP 错误: ${msg.error.message}`))
        } else {
          resolve(msg.result)
        }
      }
    }

    ws.on('message', handler)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function connectCDP() {
  const config = getConfig()
  const port = process.env.CDP_PORT || config.cdpPort || 19890
  const host = process.env.CDP_HOST || config.cdpHost || 'localhost'

  console.log(`\n 🔍 正在连接微信开发者工具 CDP 端口 ${host}:${port}...\n`)

  let pages
  try {
    pages = await httpGet(`http://${host}:${port}/json`)
  } catch (e) {
    console.log(' ❌ 无法连接 CDP 端口，请确认：')
    console.log('    1. 微信开发者工具已启动')
    console.log(`    2. 启动时带了 --remote-debugging-port=${port}`)
    console.log('    启动命令示例：')
    console.log(`    "微信开发者工具.exe" --remote-debugging-port=${port}`)
    process.exit(1)
  }

  const mpPage = pages.find(
    (p) => p.type === 'webview' && p.url && p.url.includes('__pageframe__')
  )

  if (!mpPage) {
    console.log(' ❌ 未找到小程序渲染页面，请确认：')
    console.log('    1. 微信开发者工具中已打开项目')
    console.log('    2. 模拟器中已加载页面')
    console.log('\n    当前页面列表：')
    pages.forEach((p) => {
      console.log(`    - [${p.type}] ${p.title || p.url}`)
    })
    process.exit(1)
  }

  console.log(` ✅ 找到小程序页面: ${mpPage.url}\n`)

  const ws = new WebSocket(mpPage.webSocketDebuggerUrl)

  await new Promise((resolve, reject) => {
    ws.on('open', resolve)
    ws.on('error', reject)
  })

  console.log(' ✅ WebSocket 已连接\n')
  return ws
}

module.exports = { connectCDP, cdpSend, httpGet }
