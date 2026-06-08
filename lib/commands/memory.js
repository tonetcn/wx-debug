/**
 * 内存分析与 GC 功能
 * 获取 GC 前后的内存使用情况，触发垃圾回收并输出释放的内存量
 */

const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 🔍 内存分析...\n')

  // 启用 HeapProfiler 和 Performance
  await cdpSend(ws, 'HeapProfiler.enable')
  await cdpSend(ws, 'Performance.enable')

  // 获取 GC 前的内存指标
  const beforeMetrics = await cdpSend(ws, 'Performance.getMetrics')
  const beforeMap = {}
  beforeMetrics.metrics.forEach((m) => {
    beforeMap[m.name] = m.value
  })

  const jsHeapBefore = beforeMap['JSHeapUsedSize'] || 0
  const totalHeapBefore = beforeMap['JSHeapTotalSize'] || 0

  console.log(` 📊 GC 前内存状态:`)
  console.log(`    已用堆内存: ${formatBytes(jsHeapBefore)}`)
  console.log(`    总堆内存:   ${formatBytes(totalHeapBefore)}`)

  // 触发垃圾回收
  console.log('\n ⏳ 正在触发垃圾回收...')
  await cdpSend(ws, 'HeapProfiler.collectGarbage')
  console.log(' ✅ 垃圾回收完成')

  // 获取 GC 后的内存指标
  const afterMetrics = await cdpSend(ws, 'Performance.getMetrics')
  const afterMap = {}
  afterMetrics.metrics.forEach((m) => {
    afterMap[m.name] = m.value
  })

  const jsHeapAfter = afterMap['JSHeapUsedSize'] || 0
  const totalHeapAfter = afterMap['JSHeapTotalSize'] || 0

  // 计算释放的内存
  const released = jsHeapBefore - jsHeapAfter
  const releasedPercent = jsHeapBefore > 0 ? ((released / jsHeapBefore) * 100).toFixed(1) : 0

  console.log(`\n 📊 GC 后内存状态:`)
  console.log(`    已用堆内存: ${formatBytes(jsHeapAfter)}`)
  console.log(`    总堆内存:   ${formatBytes(totalHeapAfter)}`)

  // 输出内存对比
  console.log('\n 📋 内存对比:')
  console.log('─'.repeat(50))
  console.log(`    已用堆内存: ${formatBytes(jsHeapBefore)} → ${formatBytes(jsHeapAfter)}`)
  console.log(`    释放内存:   ${formatBytes(released)} (${releasedPercent}%)`)
  console.log(`    总堆内存:   ${formatBytes(totalHeapBefore)} → ${formatBytes(totalHeapAfter)}`)
  console.log('─'.repeat(50))

  // 内存使用率
  const usageRate = totalHeapAfter > 0 ? ((jsHeapAfter / totalHeapAfter) * 100).toFixed(1) : 0
  console.log(`\n 💡 当前堆内存使用率: ${usageRate}%`)

  if (Number(usageRate) > 80) {
    console.log(' ⚠️  堆内存使用率较高，建议关注内存泄漏问题')
  } else {
    console.log(' ✅ 堆内存使用率正常')
  }
}

/**
 * 将字节数格式化为可读字符串
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = (bytes / Math.pow(1024, i)).toFixed(2)
  return `${value} ${units[i]}`
}

module.exports = { run }
