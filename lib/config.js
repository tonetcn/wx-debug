/**
 * 配置管理
 * 自动发现 + 配置文件
 */

const fs = require('fs')
const path = require('path')

const CONFIG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.wx-debug'
)
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

const DEFAULT_CONFIG = {
  cdpPort: 19890,
  cdpHost: 'localhost',
  devtoolsPath: '',
  autoLaunch: false,
  tunnel: {
    enabled: false,
    host: '',
    user: 'root',
    remotePort: 19890,
    localPort: 19890,
  },
}

function getConfig() {
  let config = { ...DEFAULT_CONFIG }

  // 读取配置文件
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
      config = { ...config, ...fileConfig }
    } catch (e) {
      // 配置文件损坏，使用默认值
    }
  }

  // 如果没有配置 devtoolsPath，自动发现
  if (!config.devtoolsPath) {
    config.devtoolsPath = findDevTools()
  }

  return config
}

function findDevTools() {
  // Windows 常见路径
  const winPaths = [
    'C:\\Program Files (x86)\\微信web开发者工具\\微信开发者工具.exe',
    'C:\\Program Files\\微信web开发者工具\\微信开发者工具.exe',
    'D:\\code\\weixin\\微信开发者工具.exe',
    'D:\\Program Files\\微信web开发者工具\\微信开发者工具.exe',
    'E:\\code\\weixin\\微信开发者工具.exe',
  ]

  // 检查常见路径
  for (const p of winPaths) {
    if (fs.existsSync(p)) return p
  }

  // 从注册表读取（Windows）
  try {
    const { execSync } = require('child_process')
    const regPaths = [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\微信web开发者工具',
      'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\微信web开发者工具',
    ]
    for (const regPath of regPaths) {
      try {
        const result = execSync(`reg query "${regPath}" /v InstallLocation`, {
          encoding: 'utf8',
        })
        const match = result.match(/InstallLocation\s+REG_SZ\s+(.+)/)
        if (match) {
          const installPath = match[1].trim()
          const exePath = path.join(installPath, '微信开发者工具.exe')
          if (fs.existsSync(exePath)) return exePath
        }
      } catch (e) {
        // 注册表项不存在
      }
    }
  } catch (e) {
    // 非 Windows 系统
  }

  return ''
}

function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8')
}

function showConfig() {
  const config = getConfig()
  console.log('\n 📋 当前配置:\n')
  console.log(`    CDP 端口:      ${config.cdpPort}`)
  console.log(`    CDP 主机:      ${config.cdpHost}`)
  console.log(`    开发者工具:    ${config.devtoolsPath || '未找到'}`)
  console.log(`    自动启动:      ${config.autoLaunch ? '是' : '否'}`)
  console.log(`    SSH 隧道:      ${config.tunnel.enabled ? '是' : '否'}`)
  if (config.tunnel.enabled) {
    console.log(`    隧道主机:      ${config.tunnel.host}`)
    console.log(`    隧道用户:      ${config.tunnel.user}`)
  }
  console.log(`    配置文件:      ${CONFIG_FILE}\n`)
}

module.exports = { getConfig, saveConfig, showConfig, findDevTools }
