/**
 * 截屏
 */

const fs = require('fs')
const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 📸 截屏中...\n')

  const result = await cdpSend(ws, 'Page.captureScreenshot', {
    format: 'png',
  })

  const filename = `screenshot_${Date.now()}.png`
  fs.writeFileSync(filename, Buffer.from(result.data, 'base64'))
  console.log(` ✅ 截屏已保存: ${filename}`)
}

module.exports = { run }
