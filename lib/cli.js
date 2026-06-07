/**
 * 命令行解析
 */

const path = require('path')
const { connectCDP } = require('./cdp')

const COMMANDS = {
  read: { desc: '读取页面内容', module: 'read' },
  console: { desc: '监听控制台日志', module: 'console' },
  network: { desc: '监听网络请求', module: 'network' },
  dom: { desc: '获取 DOM 结构', module: 'dom' },
  css: { desc: '获取元素样式', module: 'css', args: ['selector'] },
  eval: { desc: '执行 JavaScript', module: 'eval', args: ['code'] },
  storage: { desc: '查看本地存储', module: 'storage' },
  screenshot: { desc: '截屏', module: 'screenshot' },
  click: { desc: '模拟点击', module: 'click', args: ['selector'] },
  input: { desc: '模拟输入', module: 'input', args: ['selector', 'text'] },
}

function showHelp() {
  console.log(`
 wx-debug 🔍 — 微信小程序调试工具

 用法: wx-debug <命令> [参数]

 命令:
`)
  Object.entries(COMMANDS).forEach(([name, cmd]) => {
    const args = cmd.args ? ' ' + cmd.args.map(a => `<${a}>`).join(' ') : ''
    console.log(`   ${name}${args.padEnd(20)} ${cmd.desc}`)
  })
  console.log(`
   help                              显示帮助信息

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

  const cmdDef = COMMANDS[cmd]
  const cmdArgs = args.slice(1)

  // 检查必要参数
  if (cmdDef.args) {
    for (let i = 0; i < cmdDef.args.length; i++) {
      if (!cmdArgs[i]) {
        console.log(`\n ❌ 缺少参数: <${cmdDef.args[i]}>\n`)
        return
      }
    }
  }

  runCommand(cmd, cmdArgs)
}

async function runCommand(cmd, args) {
  const ws = await connectCDP()

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
