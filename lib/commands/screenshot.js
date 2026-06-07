/**
 * 截屏
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 📸 截屏中...\n')

  const result = await cdpSend(ws, 'Page.captureScreenshot', {
    format: 'png',
  })

  // 保存到用户主目录下的固定位置
  const saveDir = path.join(os.homedir(), '.wx-debug', 'screenshots')
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true })
  }

  const filename = path.join(saveDir, `screenshot_${Date.now()}.png`)
  fs.writeFileSync(filename, Buffer.from(result.data, 'base64'))
  console.log(` ✅ 截屏已保存: ${filename}`)
}

module.exports = { run }
