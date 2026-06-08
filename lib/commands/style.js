/**
 * CSS 规则查看与强制伪类
 * 使用 CDP CSS/DOM 域获取匹配的样式规则
 * 支持强制 :hover、:active、:focus 等伪类状态
 */

const { cdpSend } = require('../cdp')

// 支持的伪类列表
const PSEUDO_CLASSES = ['hover', 'active', 'focus', 'visited', 'focus-within', 'focus-visible']

/**
 * 格式化 CSS 规则输出
 */
function formatRules(matchedRules) {
  const lines = []
  if (matchedRules && matchedRules.length > 0) {
    matchedRules.forEach((rule, index) => {
      const selector = rule.selectorList ? rule.selectorList.text : '(未知选择器)'
      lines.push(`\n  规则 ${index + 1}: ${selector}`)
      if (rule.style && rule.style.cssProperties) {
        rule.style.cssProperties.forEach((prop) => {
          if (prop.status !== 'disabled') {
            lines.push(`    ${prop.name}: ${prop.value}${prop.important ? ' !important' : ''}`)
          }
        })
      }
    })
  }
  return lines.join('\n')
}

/**
 * 获取元素匹配的 CSS 规则
 */
async function getMatchedStyles(ws, selector) {
  // 启用 DOM 和 CSS 域
  await cdpSend(ws, 'DOM.enable')
  await cdpSend(ws, 'CSS.enable')

  // 获取文档根节点
  const docResult = await cdpSend(ws, 'DOM.getDocument')
  const rootNodeId = docResult.root.nodeId

  // 根据选择器查询元素
  const queryResult = await cdpSend(ws, 'DOM.querySelector', {
    nodeId: rootNodeId,
    selector: selector,
  })

  if (!queryResult.nodeId || queryResult.nodeId === 0) {
    return null
  }

  // 获取匹配的样式规则
  const matchedResult = await cdpSend(ws, 'CSS.getMatchedStylesForNode', {
    nodeId: queryResult.nodeId,
  })

  return { nodeId: queryResult.nodeId, matchedRules: matchedResult.matchedCSSRules }
}

/**
 * 强制伪类状态
 */
async function forcePseudoState(ws, nodeId, pseudoClass) {
  await cdpSend(ws, 'CSS.forcePseudoState', {
    nodeId: nodeId,
    forcedPseudoClasses: [pseudoClass],
  })
}

async function run(ws, ...args) {
  // 无参数时显示帮助
  if (args.length === 0) {
    console.log('\n 🎨 CSS 样式命令：\n')
    console.log('  用法:')
    console.log('    style <选择器>            查看元素匹配的 CSS 规则')
    console.log('    style <选择器> <伪类>     强制指定伪类状态\n')
    console.log('  支持的伪类:')
    console.log('    hover, active, focus, visited, focus-within, focus-visible\n')
    console.log('  示例:')
    console.log('    style .my-button')
    console.log('    style .my-button hover')
    console.log('    style #submit-btn active')
    console.log('')
    return
  }

  const selector = args[0]
  const pseudoClass = args[1]

  // 检查伪类是否有效
  if (pseudoClass && !PSEUDO_CLASSES.includes(pseudoClass)) {
    console.log(` ❌ 不支持的伪类: ${pseudoClass}`)
    console.log(`    支持的伪类: ${PSEUDO_CLASSES.join(', ')}`)
    return
  }

  console.log(` 🎨 查看样式: ${selector}\n`)

  // 获取匹配的样式
  const result = await getMatchedStyles(ws, selector)

  if (!result) {
    console.log(` ❌ 未找到元素: ${selector}`)
    return
  }

  // 显示匹配的规则
  if (result.matchedRules && result.matchedRules.length > 0) {
    console.log(` 找到 ${result.matchedRules.length} 条匹配规则:`)
    console.log(formatRules(result.matchedRules))
  } else {
    console.log(' 未找到匹配的 CSS 规则')
  }

  // 如果指定了伪类，则强制该状态
  if (pseudoClass) {
    console.log(`\n 🔄 强制 :${pseudoClass} 状态...`)
    try {
      await forcePseudoState(ws, result.nodeId, pseudoClass)
      console.log(` ✅ 已强制 :${pseudoClass} 状态\n`)

      // 重新获取样式以显示伪类状态下的规则
      const updatedResult = await getMatchedStyles(ws, selector)
      if (updatedResult && updatedResult.matchedRules && updatedResult.matchedRules.length > 0) {
        console.log(` :${pseudoClass} 状态下的规则:`)
        console.log(formatRules(updatedResult.matchedRules))
      }
    } catch (e) {
      console.log(` ❌ 强制伪类状态失败: ${e.message}`)
    }
  } else {
    console.log('')
  }
}

module.exports = { run }
