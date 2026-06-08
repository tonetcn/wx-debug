/**
 * 页面导航与历史管理
 * 支持查看历史、后退、前进、跳转、刷新
 */

const { cdpSend } = require('../cdp')

/**
 * 获取导航历史并显示
 */
async function showHistory(ws) {
  // 启用 Page 域
  await cdpSend(ws, 'Page.enable')

  // 获取导航历史
  const history = await cdpSend(ws, 'Page.getNavigationHistory')

  const { entries, currentIndex } = history

  if (!entries || entries.length === 0) {
    console.log(' ❌ 暂无导航历史\n')
    return
  }

  console.log(` 📜 导航历史（共 ${entries.length} 条）:\n`)

  entries.forEach((entry, index) => {
    const marker = index === currentIndex ? ' 👈 当前' : ''
    const url = entry.url.length > 60 ? entry.url.substring(0, 60) + '...' : entry.url
    console.log(`   ${index + 1}. ${url}${marker}`)
  })

  console.log('')
}

/**
 * 后退
 */
async function goBack(ws) {
  await cdpSend(ws, 'Page.enable')
  await cdpSend(ws, 'Page.navigateToHistoryEntry', {
    entryId: await getBackEntryId(ws),
  })
  console.log(' ✅ 已后退\n')
}

/**
 * 前进
 */
async function goForward(ws) {
  await cdpSend(ws, 'Page.enable')
  await cdpSend(ws, 'Page.navigateToHistoryEntry', {
    entryId: await getForwardEntryId(ws),
  })
  console.log(' ✅ 已前进\n')
}

/**
 * 获取后退的历史条目 ID
 */
async function getBackEntryId(ws) {
  const history = await cdpSend(ws, 'Page.getNavigationHistory')
  const { entries, currentIndex } = history

  if (currentIndex <= 0) {
    console.log(' ❌ 已经是第一页，无法后退\n')
    process.exit(0)
  }

  return entries[currentIndex - 1].id
}

/**
 * 获取前进的历史条目 ID
 */
async function getForwardEntryId(ws) {
  const history = await cdpSend(ws, 'Page.getNavigationHistory')
  const { entries, currentIndex } = history

  if (currentIndex >= entries.length - 1) {
    console.log(' ❌ 已经是最后一页，无法前进\n')
    process.exit(0)
  }

  return entries[currentIndex + 1].id
}

/**
 * 跳转到指定 URL
 */
async function gotoUrl(ws, url) {
  if (!url) {
    console.log(' ❌ 请指定 URL，例如: wx-debug nav goto https://example.com\n')
    return
  }

  await cdpSend(ws, 'Page.enable')
  await cdpSend(ws, 'Page.navigate', { url })
  console.log(` ✅ 正在跳转: ${url}\n`)
}

/**
 * 刷新页面
 */
async function refreshPage(ws) {
  await cdpSend(ws, 'Page.enable')
  await cdpSend(ws, 'Page.reload')
  console.log(' ✅ 页面已刷新\n')
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
 📖 页面导航命令:

   nav history                  查看导航历史
   nav back                     后退
   nav forward                  前进
   nav goto <url>               跳转到指定 URL
   nav refresh                  刷新页面

 示例:
   wx-debug nav history
   wx-debug nav goto https://example.com
   wx-debug nav refresh
`)
}

async function run(ws, subcmd, ...rest) {
  // 如果没有子命令，显示帮助
  if (!subcmd) {
    showHelp()
    return
  }

  switch (subcmd) {
    case 'history':
      await showHistory(ws)
      break
    case 'back':
      await goBack(ws)
      break
    case 'forward':
      await goForward(ws)
      break
    case 'goto':
      await gotoUrl(ws, rest[0])
      break
    case 'refresh':
      await refreshPage(ws)
      break
    default:
      console.log(` ❌ 未知子命令: ${subcmd}\n`)
      showHelp()
  }
}

module.exports = { run }
