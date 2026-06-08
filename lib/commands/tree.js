/**
 * 结构化 DOM 查询
 * 支持 CSS 选择器查询，获取完整 HTML 和节点属性
 */

const { cdpSend } = require('../cdp')

/**
 * 递归获取节点树
 * @param {WebSocket} ws - WebSocket 连接
 * @param {number} nodeId - 节点 ID
 * @param {number} depth - 当前深度
 * @param {number} maxDepth - 最大深度
 * @returns {string} 树形结构字符串
 */
async function getNodeTree(ws, nodeId, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return ''

  const indent = '  '.repeat(depth)

  // 获取节点信息
  const nodeInfo = await cdpSend(ws, 'DOM.describeNode', { nodeId })
  const { nodeName, attributes, childNodeCount } = nodeInfo.node

  // 构建标签信息
  let tag = nodeName.toLowerCase()
  let attrStr = ''

  if (attributes) {
    for (let i = 0; i < attributes.length; i += 2) {
      const name = attributes[i]
      const value = attributes[i + 1]
      if (name === 'class') {
        attrStr += '.' + value.split(' ').join('.')
      } else if (name === 'id') {
        attrStr += '#' + value
      }
    }
  }

  // 获取文本内容（如果是文本节点）
  let text = ''
  if (childNodeCount === 0) {
    try {
      const outerHTML = await cdpSend(ws, 'DOM.getOuterHTML', { nodeId })
      const match = outerHTML.outerHTML.match(/>([^<]*)</)
      if (match && match[1].trim()) {
        text = ' "' + match[1].trim().substring(0, 30) + '"'
      }
    } catch (e) {
      // 忽略获取失败的情况
    }
  }

  let result = indent + '<' + tag + attrStr + '>' + text + '\n'

  // 递归获取子节点
  if (childNodeCount > 0 && depth < maxDepth) {
    // 使用 DOM.describeNode 获取子节点信息
    const result2 = await cdpSend(ws, 'DOM.describeNode', { nodeId, depth: 1 })
    const children = result2.node.children || []

    const limit = Math.min(children.length, 10)
    for (let i = 0; i < limit; i++) {
      if (children[i].nodeId) {
        result += await getNodeTree(ws, children[i].nodeId, depth + 1, maxDepth)
      }
    }

    if (children.length > 10) {
      result += indent + '  ... 还有 ' + (children.length - 10) + ' 个子节点\n'
    }
  }

  return result
}

/**
 * 获取节点的完整属性
 * @param {WebSocket} ws - WebSocket 连接
 * @param {number} nodeId - 节点 ID
 * @returns {Object} 属性对象
 */
async function getNodeAttributes(ws, nodeId) {
  try {
    const result = await cdpSend(ws, 'DOM.getAttributes', { nodeId })
    const attrs = {}
    if (result.attributes) {
      for (let i = 0; i < result.attributes.length; i += 2) {
        attrs[result.attributes[i]] = result.attributes[i + 1]
      }
    }
    return attrs
  } catch (e) {
    return {}
  }
}

async function run(ws, ...args) {
  // 解析参数
  const selector = args[0]
  const showHtml = args.includes('--html') || args.includes('-h')
  const showAttrs = args.includes('--attrs') || args.includes('-a')
  const depth = parseInt(args.find(a => a.match(/^\d+$/))) || 3

  console.log(' 🌳 DOM 查询:\n')

  // 启用 DOM 域
  await cdpSend(ws, 'DOM.enable')

  // 获取文档根节点
  const doc = await cdpSend(ws, 'DOM.getDocument', { depth: 1 })
  const rootNodeId = doc.root.nodeId

  if (selector) {
    // 使用选择器查询特定元素
    console.log(` 🔍 查询选择器: ${selector}\n`)

    const queryResult = await cdpSend(ws, 'DOM.querySelector', {
      nodeId: rootNodeId,
      selector: selector
    })

    if (queryResult.nodeId) {
      // 显示节点树
      console.log(' 📋 节点树:\n')
      const tree = await getNodeTree(ws, queryResult.nodeId, 0, depth)
      console.log(tree)

      // 显示完整 HTML
      if (showHtml) {
        console.log(' 📄 完整 HTML:\n')
        const outerHTML = await cdpSend(ws, 'DOM.getOuterHTML', { nodeId: queryResult.nodeId })
        console.log(outerHTML.outerHTML)
        console.log('')
      }

      // 显示节点属性
      if (showAttrs) {
        console.log(' 📎 节点属性:\n')
        const attrs = await getNodeAttributes(ws, queryResult.nodeId)
        console.log(JSON.stringify(attrs, null, 2))
        console.log('')
      }
    } else {
      console.log(' ❌ 未找到匹配的元素')
    }
  } else {
    // 输出整个文档树
    console.log(' 📋 文档树:\n')
    const tree = await getNodeTree(ws, rootNodeId, 0, depth)
    console.log(tree)

    // 显示完整 HTML
    if (showHtml) {
      console.log(' 📄 完整 HTML:\n')
      const outerHTML = await cdpSend(ws, 'DOM.getOuterHTML', { nodeId: rootNodeId })
      console.log(outerHTML.outerHTML)
      console.log('')
    }
  }
}

module.exports = { run }
