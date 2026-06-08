/**
 * CPU 性能分析
 * 采样分析 JavaScript 执行耗时，找出 Top N 耗时函数
 *
 * 使用方法: profile [采样时间秒数]
 * 默认采样 5 秒，采样间隔 100ms
 */

const { cdpSend } = require('../cdp')

// 采样间隔（毫秒）
const DEFAULT_INTERVAL = 100
// 默认采样时间（秒）
const DEFAULT_DURATION = 5
// 显示的 Top N 数量
const TOP_N = 20

/**
 * 等待指定时间
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 格式化时间（微秒转可读格式）
 */
function formatTime(microseconds) {
  if (microseconds < 1000) return `${microseconds.toFixed(1)}μs`
  if (microseconds < 1000 * 1000) return `${(microseconds / 1000).toFixed(2)}ms`
  return `${(microseconds / (1000 * 1000)).toFixed(2)}s`
}

/**
 * 解析 profile 数据，统计每个函数的调用次数和耗时
 */
function parseProfile(profile) {
  const { nodes, samples, timeDeltas } = profile

  // 构建节点 ID 到节点的映射
  const nodeMap = new Map()
  for (const node of nodes) {
    nodeMap.set(node.id, node)
  }

  // 统计每个函数的调用次数和耗时
  const functionStats = new Map()

  for (let i = 0; i < samples.length; i++) {
    const nodeId = samples[i]
    const node = nodeMap.get(nodeId)
    if (!node) continue

    // 获取函数名称
    const funcName = getFunctionName(node)
    const scriptUrl = node.scriptName || '(未知脚本)'
    const lineNumber = node.lineNumber || 0
    const key = `${funcName}@${scriptUrl}:${lineNumber}`

    if (!functionStats.has(key)) {
      functionStats.set(key, {
        name: funcName,
        scriptUrl,
        lineNumber,
        callCount: 0,
        totalTime: 0,
      })
    }

    const stats = functionStats.get(key)
    stats.callCount++

    // 累加时间（微秒）
    if (timeDeltas && timeDeltas[i]) {
      stats.totalTime += timeDeltas[i]
    }
  }

  return Array.from(functionStats.values())
}

/**
 * 获取函数名称
 */
function getFunctionName(node) {
  if (node.callFrame && node.callFrame.functionName) {
    return node.callFrame.functionName
  }
  if (node.functionName) {
    return node.functionName
  }
  return '(匿名函数)'
}

/**
 * 主函数
 */
async function run(ws, durationArg) {
  const duration = parseInt(durationArg) || DEFAULT_DURATION

  console.log(' 🔥 CPU 性能分析...\n')
  console.log(`    采样间隔: ${DEFAULT_INTERVAL}ms`)
  console.log(`    采样时间: ${duration}秒`)
  console.log('─'.repeat(50))

  // 启用 Profiler
  await cdpSend(ws, 'Profiler.enable')

  // 设置采样间隔
  await cdpSend(ws, 'Profiler.setSamplingInterval', {
    interval: DEFAULT_INTERVAL,
  })
  console.log(' ✅ 采样间隔已设置')

  // 开始采样
  await cdpSend(ws, 'Profiler.start')
  console.log(` ⏳ 正在采样... (${duration}秒)`)

  // 等待指定时间
  await sleep(duration * 1000)

  // 停止采样并获取结果
  const { profile } = await cdpSend(ws, 'Profiler.stop')
  console.log(' ✅ 采样完成\n')

  // 解析 profile 数据
  const functionStats = parseProfile(profile)

  // 按总时间排序（降序）
  const byTime = [...functionStats].sort((a, b) => b.totalTime - a.totalTime)

  // 按调用次数排序（降序）
  const byCount = [...functionStats].sort((a, b) => b.callCount - a.callCount)

  // 输出 Top N 耗时函数
  console.log(` 📊 Top ${TOP_N} 耗时函数 (按总时间):`)
  console.log('─'.repeat(50))

  const topByTime = byTime.slice(0, TOP_N)
  for (let i = 0; i < topByTime.length; i++) {
    const stats = topByTime[i]
    const percent = profile.endTime
      ? ((stats.totalTime / (profile.endTime - profile.startTime)) * 100).toFixed(2)
      : 'N/A'
    console.log(`    ${String(i + 1).padStart(2)}. ${stats.name}`)
    console.log(`        文件: ${stats.scriptUrl}:${stats.lineNumber}`)
    console.log(`        耗时: ${formatTime(stats.totalTime)} (${percent}%) | 调用次数: ${stats.callCount}`)
  }

  // 输出 Top N 调用次数函数
  console.log(`\n 📊 Top ${TOP_N} 热点函数 (按调用次数):`)
  console.log('─'.repeat(50))

  const topByCount = byCount.slice(0, TOP_N)
  for (let i = 0; i < topByCount.length; i++) {
    const stats = topByCount[i]
    console.log(`    ${String(i + 1).padStart(2)}. ${stats.name}`)
    console.log(`        文件: ${stats.scriptUrl}:${stats.lineNumber}`)
    console.log(`        调用次数: ${stats.callCount} | 总耗时: ${formatTime(stats.totalTime)}`)
  }

  // 输出统计摘要
  console.log('\n─'.repeat(50))
  console.log(` 📈 统计摘要:`)
  console.log(`    函数总数: ${functionStats.length}`)
  console.log(`    总采样时间: ${formatTime(profile.endTime - profile.startTime)}`)

  // 计算前 10 个函数的耗时占比
  const top10Time = byTime.slice(0, 10).reduce((sum, s) => sum + s.totalTime, 0)
  const totalTime = byTime.reduce((sum, s) => sum + s.totalTime, 0)
  if (totalTime > 0) {
    const top10Percent = ((top10Time / totalTime) * 100).toFixed(1)
    console.log(`    Top 10 函数耗时占比: ${top10Percent}%`)
  }

  console.log('\n 💡 提示: 关注耗时占比高且调用次数多的函数')
}

module.exports = { run }
