/**
 * CDP 连接核心
 * 通过 Chrome DevTools Protocol 连接微信开发者工具
 */

const http = require('http')
const { execFile } = require('child_process')
const WebSocket = require('ws')
const { getConfig } = require('./config')

// 递增 ID，避免碰撞
let nextId = 1

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
    const id = nextId++
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

async function launchDevTools(config, port) {
  if (!config.devtoolsPath) {
    console.log(' ⚠️  未找到微信开发者工具路径，请手动启动：')
    console.log(`    "微信开发者工具.exe" --remote-debugging-port=${port}`)
    return false
  }

  console.log(` 🚀 正在启动微信开发者工具...`)
  console.log(`    路径: ${config.devtoolsPath}`)

  try {
    const child = execFile(config.devtoolsPath, [`--remote-debugging-port=${port}`])
    child.unref()

    // 等待启动
    console.log(' ⏳ 等待启动完成...')
    await new Promise((r) => setTimeout(r, 5000))

    // 验证端口是否开放
    try {
      await httpGet(`http://localhost:${port}/json`)
      console.log(' ✅ 微信开发者工具启动成功\n')
      return true
    } catch (e) {
      console.log(' ⚠️  启动超时，请检查微信开发者工具是否已打开')
      return false
    }
  } catch (e) {
    console.log(` ❌ 启动失败: ${e.message}`)
    console.log('    请手动启动微信开发者工具')
    return false
  }
}

async function connectCDP(target = 'render', pageFilter = null) {
  const config = getConfig()
  const port = process.env.CDP_PORT || config.cdpPort || 19890
  const host = process.env.CDP_HOST || config.cdpHost || 'localhost'

  const targetLabel = target === 'app' ? '逻辑层' : '渲染层'
  const pageInfo = pageFilter ? `（页面: ${pageFilter}）` : ''
  console.log(`\n 🔍 正在连接微信开发者工具 CDP 端口 ${host}:${port}（${targetLabel}）${pageInfo}...\n`)

  let pages
  try {
    pages = await httpGet(`http://${host}:${port}/json`)
  } catch (e) {
    // CDP 端口未开放，尝试自动启动
    if (config.autoLaunch) {
      console.log(' ⚠️  CDP 端口未开放，尝试自动启动微信开发者工具...\n')
      const launched = await launchDevTools(config, port)
      if (launched) {
        try {
          pages = await httpGet(`http://${host}:${port}/json`)
        } catch (e2) {
          // 忽略
        }
      }
    }

    if (!pages) {
      console.log(' ❌ 无法连接 CDP 端口，请确认：')
      console.log('    1. 微信开发者工具已启动')
      console.log(`    2. 启动时带了 --remote-debugging-port=${port}`)
      console.log('    启动命令示例：')
      console.log(`    "微信开发者工具.exe" --remote-debugging-port=${port}`)
      console.log('')
      console.log('    提示：设置 autoLaunch: true 可自动启动')
      console.log(`    配置文件: ~/.wx-debug/config.json`)
      process.exit(1)
    }
  }

  let mpPage = null

  if (target === 'app') {
    // 连接逻辑层（appservice）
    mpPage = pages.find(
      (p) => p.url && p.url.includes('appservice') && !p.url.includes('devtools')
    )

    if (!mpPage) {
      console.log(' ❌ 未找到逻辑层（appservice）页面，请确认：')
      console.log('    1. 微信开发者工具中已打开项目')
      console.log('    2. 模拟器中已加载页面')
      console.log('\n    当前页面列表：')
      pages.forEach((p) => {
        console.log(`    - [${p.type}] ${p.title || p.url}`)
      })
      process.exit(1)
    }
  } else {
    // 连接渲染层（默认）
    // 获取所有渲染层页面
    const renderPages = pages.filter(
      (p) => p.type === 'webview' && p.url && p.url.includes('__pageframe__')
    )

    if (pageFilter) {
      // 匹配页面：支持 "index"、"cart"、"mine" 等简短名称
      // 页面路径格式：http://xxx/__pageframe__/pages/{pageName}/index
      mpPage = renderPages.find((p) => {
        const url = p.url
        // 精确匹配 pages/{name}/ 格式
        const match = url.match(/\/pages\/([^/]+)\//)
        return match && match[1] === pageFilter
      })
    }

    // 优先查找 __pageframe__（渲染层），其次 appservice（逻辑层）
    if (!mpPage) {
      mpPage = renderPages[0] // 使用第一个匹配的页面
    }

    if (!mpPage) {
      mpPage = pages.find(
        (p) => p.type === 'webview' && p.url && p.url.includes('appservice')
      )
    }

    // 兜底：查找任何 webview 页面（排除 devtools）
    if (!mpPage) {
      mpPage = pages.find(
        (p) => p.type === 'webview' && p.url && !p.url.includes('devtools')
      )
    }

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
  }

  console.log(` ✅ 找到小程序${targetLabel}: ${mpPage.url}\n`)

  const ws = new WebSocket(mpPage.webSocketDebuggerUrl)

  await new Promise((resolve, reject) => {
    ws.on('open', resolve)
    ws.on('error', reject)
  })

  // 启用 Runtime 域
  await cdpSend(ws, 'Runtime.enable')

  // 收集执行上下文（等待更长时间确保完整）
  const contexts = []
  const contextHandler = (data) => {
    const msg = JSON.parse(data.toString())
    if (msg.method === 'Runtime.executionContextCreated') {
      contexts.push(msg.params.context)
    }
  }
  ws.on('message', contextHandler)

  await new Promise((r) => setTimeout(r, 1000))
  ws.removeListener('message', contextHandler)

  // 附加到 ws 对象上供命令使用
  ws._allContexts = contexts

  console.log(' ✅ WebSocket 已连接\n')
  return ws
}

module.exports = { connectCDP, cdpSend, httpGet }
