/**
 * 设备模拟切换
 * 支持预置设备配置，使用 CDP Emulation API 模拟不同设备
 */

const { cdpSend } = require('../cdp')

// 预置设备配置
const DEVICES = {
  'iPhone SE': { width: 375, height: 667, deviceScaleFactor: 2, mobile: true },
  'iPhone 14': { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
  'iPhone 14 Pro Max': { width: 430, height: 932, deviceScaleFactor: 3, mobile: true },
  'iPad': { width: 768, height: 1024, deviceScaleFactor: 2, mobile: true },
  'Android': { width: 360, height: 800, deviceScaleFactor: 2.75, mobile: true },
}

// 列出所有可用设备
function listDevices() {
  console.log('\n 📱 可用设备列表：\n')
  console.log('  名称                宽度   高度   缩放比例')
  console.log('  ────────────────────────────────────────')
  for (const [name, config] of Object.entries(DEVICES)) {
    console.log(`  ${name.padEnd(20)} ${config.width}  ${config.height}  ${config.deviceScaleFactor}x`)
  }
  console.log('')
}

// 切换设备
async function switchDevice(ws, deviceName) {
  // 查找设备（支持部分匹配）
  const device = DEVICES[deviceName]
  if (!device) {
    // 尝试部分匹配
    const matchedName = Object.keys(DEVICES).find((name) =>
      name.toLowerCase().includes(deviceName.toLowerCase())
    )
    if (matchedName) {
      return switchDevice(ws, matchedName)
    }
    console.log(` ❌ 未找到设备: ${deviceName}`)
    console.log('    使用 "device list" 查看可用设备')
    return
  }

  console.log(` 📱 切换到: ${deviceName} (${device.width}x${device.height})\n`)

  // 使用 CDP Emulation API 设置设备参数
  await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', {
    width: device.width,
    height: device.height,
    deviceScaleFactor: device.deviceScaleFactor,
    mobile: device.mobile,
  })

  console.log(' ✅ 设备已切换\n')
}

async function run(ws, action, ...args) {
  // 无参数时显示帮助
  if (!action) {
    console.log('\n 📱 设备模拟命令：\n')
    console.log('  用法:')
    console.log('    device list            列出所有可用设备')
    console.log('    device <设备名称>      切换到指定设备')
    console.log('')
    console.log('  示例:')
    console.log('    device list')
    console.log('    device iPhone 14')
    console.log('    device iPad')
    console.log('')
    return
  }

  // 列出设备
  if (action === 'list' || action === 'ls') {
    listDevices()
    return
  }

  // 切换设备（支持多参数设备名，如 "iPhone 14 Pro Max"）
  const deviceName = [action, ...args].join(' ')
  await switchDevice(ws, deviceName)
}

module.exports = { run }
