/**
 * 性能指标监控
 * 获取运行时性能指标，检测异常值并高亮警告
 */

const { cdpSend } = require('../cdp')

// 阈值配置
const THRESHOLDS = {
  JSHeapSizeUsed: 50 * 1024 * 1024, // 50MB
  Documents: 100,
  Nodes: 5000,
  JSEventListeners: 1000,
}

// 格式化字节大小
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function run(ws) {
  console.log(' ⚡ 获取性能指标...\n')

  // 启用 Performance 域
  await cdpSend(ws, 'Performance.enable')

  // 获取性能指标
  const result = await cdpSend(ws, 'Performance.getMetrics')

  const metrics = result.metrics || []

  // 关键指标列表
  const keyMetrics = ['JSHeapSizeUsed', 'Documents', 'Nodes', 'JSEventListeners']

  // 筛选并展示关键指标
  console.log(' 📊 关键性能指标:')
  console.log('─'.repeat(50))

  const warnings = []

  for (const name of keyMetrics) {
    const metric = metrics.find((m) => m.name === name)
    if (metric) {
      const threshold = THRESHOLDS[name]
      const isWarning = threshold && metric.value > threshold
      const icon = isWarning ? '⚠️' : '  '
      const value =
        name === 'JSHeapSizeUsed'
          ? formatBytes(metric.value)
          : metric.value.toLocaleString()

      console.log(` ${icon} ${name}: ${value}`)

      if (isWarning) {
        const thresholdStr =
          name === 'JSHeapSizeUsed'
            ? formatBytes(threshold)
            : threshold.toLocaleString()
        warnings.push(`${name} 超过阈值 (当前 ${value}, 阈值 ${thresholdStr})`)
      }
    }
  }

  console.log('─'.repeat(50))

  // 展示警告信息
  if (warnings.length > 0) {
    console.log('\n ⚠️  异常警告:')
    warnings.forEach((w) => console.log(`    - ${w}`))
  } else {
    console.log('\n ✅ 所有指标正常')
  }

  // 展示其他性能指标摘要
  const otherMetrics = metrics.filter((m) => !keyMetrics.includes(m.name))
  if (otherMetrics.length > 0) {
    console.log('\n 📈 其他指标:')
    otherMetrics.slice(0, 10).forEach((m) => {
      const value =
        m.name.includes('Size') || m.name.includes('Bytes')
          ? formatBytes(m.value)
          : m.value.toLocaleString()
      console.log(`    ${m.name}: ${value}`)
    })
    if (otherMetrics.length > 10) {
      console.log(`    ... 还有 ${otherMetrics.length - 10} 项指标`)
    }
  }

  console.log('\n 💡 提示: JS 堆超过 50MB 时会触发警告')
}

module.exports = { run }
