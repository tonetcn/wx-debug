/**
 * 命令行解析
 */

const path = require('path')
const { connectCDP } = require('./cdp')

const COMMANDS = {
  read: { desc: '读取页面内容', module: 'read' },
  console: { desc: '监听控制台日志', module: 'console' },
  network: { desc: '监听网络请求', module: 'network' },
  errors: { desc: '检查控制台错误', module: 'errors' },
  dom: { desc: '获取 DOM 结构', module: 'dom' },
  css: { desc: '获取元素样式', module: 'css', args: ['selector'] },
  eval: { desc: '执行 JavaScript', module: 'eval', args: ['code'] },
  storage: { desc: '查看本地存储', module: 'storage' },
  screenshot: { desc: '截屏', module: 'screenshot' },
  click: { desc: '模拟点击', module: 'click', args: ['selector'] },
  input: { desc: '模拟输入', module: 'input', args: ['selector', 'text'] },
  // 新增功能
  perf: { desc: '性能指标监控', module: 'perf' },
  memory: { desc: '内存分析与 GC', module: 'memory' },
  har: { desc: '网络请求导出 HAR', module: 'har' },
  device: { desc: '设备模拟切换', module: 'device', args: ['name'] },
  tree: { desc: '结构化 DOM 查询', module: 'tree' },
  profile: { desc: 'CPU 性能分析', module: 'profile', args: ['duration'] },
  style: { desc: 'CSS 规则查看', module: 'style', args: ['selector'] },
  a11y: { desc: '无障碍树分析', module: 'a11y' },
  watch: { desc: '元素变化监听', module: 'watch' },
  nav: { desc: '页面导航与历史', module: 'nav' },
}

function showHelp() {
  console.log(`
 wx-debug 🔍 — 微信小程序调试工具

 用法: wx-debug <命令> [参数] [选项]

 命令:
`)
  Object.entries(COMMANDS).forEach(([name, cmd]) => {
    const args = cmd.args ? ' ' + cmd.args.map(a => `<${a}>`).join(' ') : ''
    console.log(`   ${name}${args.padEnd(20)} ${cmd.desc}`)
  })
  console.log(`
   help                              显示帮助信息

 选项:
   --target <render|app>             选择连接目标（默认 render）
                                     render: 渲染层（页面 DOM、样式）
                                     app: 逻辑层（可调用 uni API）
   --page <页面路径>                  指定页面（如 index、cart、mine）

 示例:
   wx-debug read                     读取页面内容
   wx-debug console                  监听控制台日志
   wx-debug network                  监听网络请求
   wx-debug dom                      获取 DOM 结构
   wx-debug css .my-button           获取元素样式
   wx-debug eval "document.title"    执行 JavaScript
   wx-debug storage                  查看本地存储
   wx-debug screenshot               截屏
   wx-debug click .submit            模拟点击
   wx-debug input .search "内容"     模拟输入
   wx-debug perf                     查看性能指标
   wx-debug memory                   内存分析与 GC
   wx-debug har                      导出网络请求为 HAR
   wx-debug device list              列出可用设备
   wx-debug device iphone-14         切换到 iPhone 14
   wx-debug tree                     查看 DOM 树
   wx-debug tree .my-class           查询特定元素
   wx-debug profile 10               CPU 分析 10 秒
   wx-debug style .button            查看 CSS 规则
   wx-debug a11y                     无障碍树分析
   wx-debug watch .container         监听元素变化
   wx-debug nav history              查看导航历史
   wx-debug eval "wx.switchTab({url:'/pages/index/index'})" --target app   在逻辑层执行

 环境变量:
   CDP_PORT      CDP 端口（默认 19890）
   CDP_HOST      CDP 主机（默认 localhost）
`)
}

function parseArgs(args) {
  const cmd = args[0]

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    showHelp()
    return
  }

  if (!COMMANDS[cmd]) {
    console.log(`\n ❌ 未知命令: ${cmd}\n`)
    showHelp()
    return
  }

  // 解析选项
  let target = 'render' // 默认连接渲染层
  let pageFilter = null // 页面过滤器
  const cmdArgs = []
  let i = 1

  while (i < args.length) {
    if (args[i] === '--target' && args[i + 1]) {
      target = args[i + 1]
      i += 2
    } else if (args[i] === '--page' && args[i + 1]) {
      pageFilter = args[i + 1]
      i += 2
    } else {
      cmdArgs.push(args[i])
      i++
    }
  }

  if (target !== 'render' && target !== 'app') {
    console.log(`\n ❌ 无效的 --target 参数: ${target}（只支持 render 或 app）\n`)
    return
  }

  const cmdDef = COMMANDS[cmd]

  // 检查必要参数
  if (cmdDef.args) {
    for (let j = 0; j < cmdDef.args.length; j++) {
      if (!cmdArgs[j]) {
        console.log(`\n ❌ 缺少参数: <${cmdDef.args[j]}>\n`)
        return
      }
    }
  }

  runCommand(cmd, cmdArgs, target, pageFilter)
}

async function runCommand(cmd, args, target, pageFilter) {
  const ws = await connectCDP(target, pageFilter)

  try {
    const commandPath = path.join(__dirname, 'commands', `${cmd}.js`)
    const commandModule = require(commandPath)
    await commandModule.run(ws, ...args)
  } catch (e) {
    console.log(`\n ❌ 执行出错: ${e.message}\n`)
  } finally {
    ws.close()
  }
}

module.exports = { parseArgs, showHelp }
