/**
 * 无障碍树分析
 * 获取完整无障碍树，解析节点属性，检测常见可访问性问题
 * 支持 --issues 参数只输出问题项
 */

const { cdpSend } = require('../cdp')

// 交互角色列表
const INTERACTIVE_ROLES = [
  'button', 'link', 'checkbox', 'radio', 'textbox', 'combobox',
  'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
  'scrollbar', 'slider', 'spinbutton', 'switch', 'tab', 'treeitem'
]

// 需要 alt 的角色
const NEED_ALT_ROLES = ['img', 'image', 'graphics-document']

/**
 * 解析无障碍树节点
 * @param {Object} node - 原始节点
 * @param {number} depth - 当前深度
 * @returns {Object} 解析后的节点
 */
function parseNode(node, depth = 0) {
  const parsed = {
    role: node.role || '',
    name: node.name || '',
    value: node.value || '',
    description: node.description || '',
    states: {},
    properties: {},
    children: [],
    depth
  }

  // 解析状态
  if (node.states) {
    node.states.forEach(s => {
      parsed.states[s] = true
    })
  }

  // 解析属性
  if (node.properties) {
    node.properties.forEach(p => {
      parsed.properties[p.name] = p.value
    })
  }

  return parsed
}

/**
 * 递归解析无障碍树
 * @param {Array} nodes - 节点数组
 * @param {Map} nodeMap - 节点映射
 * @param {number} depth - 当前深度
 * @returns {Array} 解析后的节点数组
 */
function parseTree(nodes, nodeMap, depth = 0, maxDepth = 5) {
  const result = []

  if (!nodes || depth > maxDepth) return result

  nodes.forEach(nodeId => {
    const node = nodeMap.get(nodeId)
    if (!node) return

    const parsed = parseNode(node, depth)
    parsed.children = parseTree(node.children, nodeMap, depth + 1, maxDepth)
    result.push(parsed)
  })

  return result
}

/**
 * 检测无障碍问题
 * @param {Array} nodes - 解析后的节点数组
 * @returns {Array} 问题列表
 */
function detectIssues(nodes) {
  const issues = []

  function traverse(nodeList) {
    nodeList.forEach(node => {
      const { role, name, states, properties } = node

      // 检查交互元素缺少名称
      if (INTERACTIVE_ROLES.includes(role) && !name) {
        issues.push({
          type: '缺少名称',
          severity: '警告',
          role,
          message: `交互元素 <${role}> 缺少 accessible name`
        })
      }

      // 检查图片缺少 alt
      if (NEED_ALT_ROLES.includes(role) && !name) {
        issues.push({
          type: '图片缺少描述',
          severity: '错误',
          role,
          message: `图片元素 <${role}> 缺少 alt 文本`
        })
      }

      // 检查按钮没有文本内容
      if (role === 'button' && !name && !properties['aria-labelledby']) {
        issues.push({
          type: '按钮缺少标签',
          severity: '警告',
          role,
          message: '按钮缺少文本内容或 aria-labelledby'
        })
      }

      // 检查链接缺少文本
      if (role === 'link' && !name) {
        issues.push({
          type: '链接缺少文本',
          severity: '警告',
          role,
          message: '链接缺少可访问的文本内容'
        })
      }

      // 检查表单元素缺少标签
      if (['textbox', 'combobox', 'listbox', 'spinbutton'].includes(role)) {
        if (!name && !properties['aria-labelledby'] && !properties['aria-label']) {
          issues.push({
            type: '表单元素缺少标签',
            severity: '警告',
            role,
            message: `表单元素 <${role}> 缺少关联标签`
          })
        }
      }

      // 检查禁用状态但没有 aria-disabled
      if (states.disabled && !properties['aria-disabled']) {
        // 这是信息性提示
      }

      // 递归子节点
      if (node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(nodes)
  return issues
}

/**
 * 格式化输出节点
 * @param {Object} node - 解析后的节点
 * @returns {string} 格式化的字符串
 */
function formatNode(node) {
  const indent = '  '.repeat(node.depth)
  let line = `${indent}[${node.role}]`

  if (node.name) {
    line += ` "${node.name}"`
  }

  if (node.value) {
    line += ` = "${node.value}"`
  }

  // 显示关键状态
  const stateList = Object.keys(node.states).filter(s =>
    ['focused', 'selected', 'checked', 'disabled', 'hidden', 'expanded', 'collapsed'].includes(s)
  )
  if (stateList.length > 0) {
    line += ` (${stateList.join(', ')})`
  }

  return line
}

/**
 * 递归输出节点树
 * @param {Array} nodes - 节点数组
 * @param {number} maxDepth - 最大输出深度
 */
function printTree(nodes, maxDepth = 3) {
  function traverse(nodeList, depth) {
    if (depth > maxDepth) return

    nodeList.forEach(node => {
      console.log(formatNode(node))
      if (node.children.length > 0 && depth < maxDepth) {
        traverse(node.children, depth + 1)
      } else if (node.children.length > 0 && depth >= maxDepth) {
        console.log(`${'  '.repeat(depth + 1)}... 还有 ${node.children.length} 个子节点`)
      }
    })
  }

  traverse(nodes, 0)
}

async function run(ws, ...args) {
  const showIssuesOnly = args.includes('--issues') || args.includes('-i')
  const depth = parseInt(args.find(a => a.match(/^\d+$/))) || 3

  console.log(' ♿ 无障碍树分析:\n')

  // 启用 Accessibility 域
  await cdpSend(ws, 'Accessibility.enable')

  // 获取完整无障碍树
  const result = await cdpSend(ws, 'Accessibility.getFullAXTree')

  const nodes = result.nodes || []
  console.log(` 📊 共获取 ${nodes.length} 个无障碍节点\n`)

  // 构建节点映射
  const nodeMap = new Map()
  nodes.forEach(node => {
    nodeMap.set(node.nodeId, node)
  })

  // 查找根节点并解析
  const rootNodes = nodes
    .filter(n => !n.parentId || !nodeMap.has(n.parentId))
    .map(n => n.nodeId)

  const parsedTree = parseTree(rootNodes, nodeMap, 0, depth)

  // 检测问题
  const issues = detectIssues(parsedTree)

  if (showIssuesOnly) {
    // 只输出问题项
    console.log(` 🔍 发现 ${issues.length} 个问题:\n`)

    if (issues.length === 0) {
      console.log(' ✅ 未检测到明显的可访问性问题')
    } else {
      issues.forEach((issue, index) => {
        const icon = issue.severity === '错误' ? '❌' : '⚠️'
        console.log(`${icon} ${index + 1}. [${issue.severity}] ${issue.message}`)
      })
    }
  } else {
    // 输出完整无障碍树
    console.log(' 🌳 无障碍树:\n')
    printTree(parsedTree, depth)

    // 同时显示问题摘要
    if (issues.length > 0) {
      console.log(`\n ⚠️  发现 ${issues.length} 个潜在问题 (使用 --issues 查看详情)`)
    }
  }

  console.log('')
}

module.exports = { run }
