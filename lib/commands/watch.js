/**
 * 监听 DOM 元素变化
 * 使用 MutationObserver 监听指定元素的属性变化、子节点增删、样式变化
 * 通过 console.log 输出变化事件
 */

const { cdpSend } = require('../cdp')

async function run(ws, ...args) {
  // 解析目标选择器，默认监听整个 document.body
  const selector = args[0] || null
  const time = new Date().toLocaleTimeString('zh-CN')
  console.log(` 📡 监听 DOM 变化（${selector || '整个文档'}）（按 Ctrl+C 停止）...\n`)

  // 启用 Runtime 域
  await cdpSend(ws, 'Runtime.enable')

  // 注入 MutationObserver 脚本
  const script = `
    (function() {
      // 目标节点
      var target = ${selector ? `document.querySelector('${selector}')` : 'document.body'};
      if (!target) {
        console.log('❌ 未找到目标元素: ${selector || "document.body"}');
        return;
      }

      // 用于记录变化
      var changeCount = 0;

      // 创建观察器
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          changeCount++;
          var time = new Date().toLocaleTimeString('zh-CN');
          var info = {
            index: changeCount,
            time: time,
            type: mutation.type,
            target: mutation.target.tagName || 'TEXT'
          };

          // 根据变化类型输出详细信息
          if (mutation.type === 'attributes') {
            info.attribute = mutation.attributeName;
            info.oldValue = mutation.oldValue || '(无)';
            info.newValue = mutation.target.getAttribute(mutation.attributeName) || '(无)';
            console.log(
              '[#' + info.index + '] ' + info.time + ' 📝 属性变化: ' +
              info.target + '.' + info.attribute +
              ' [' + info.oldValue + ' → ' + info.newValue + ']'
            );
          }
          else if (mutation.type === 'childList') {
            var added = mutation.addedNodes.length;
            var removed = mutation.removedNodes.length;
            info.added = added;
            info.removed = removed;

            var details = [];
            if (added > 0) {
              var addNames = [];
              for (var i = 0; i < Math.min(mutation.addedNodes.length, 3); i++) {
                var node = mutation.addedNodes[i];
                addNames.push(node.tagName || 'TEXT');
              }
              details.push('新增 ' + added + ' 个: ' + addNames.join(', '));
            }
            if (removed > 0) {
              var removeNames = [];
              for (var i = 0; i < Math.min(mutation.removedNodes.length, 3); i++) {
                var node = mutation.removedNodes[i];
                removeNames.push(node.tagName || 'TEXT');
              }
              details.push('移除 ' + removed + ' 个: ' + removeNames.join(', '));
            }
            console.log(
              '[#' + info.index + '] ' + info.time + ' 🔧 节点变化: ' +
              info.target + ' ' + details.join(' | ')
            );
          }
          else if (mutation.type === 'characterData') {
            info.oldText = mutation.oldValue || '(无)';
            info.newText = mutation.target.textContent || '(无)';
            console.log(
              '[#' + info.index + '] ' + info.time + ' 📄 文本变化: ' +
              info.target.parentNode.tagName + ' [' +
              info.oldText.substring(0, 30) + (info.oldText.length > 30 ? '...' : '') + ' → ' +
              info.newText.substring(0, 30) + (info.newText.length > 30 ? '...' : '') + ']'
            );
          }
        });
      });

      // 配置观察选项
      var config = {
        attributes: true,           // 监听属性变化
        childList: true,            // 监听子节点增删
        characterData: true,        // 监听文本内容变化
        subtree: true,              // 监听所有后代节点
        attributeOldValue: true,    // 记录属性旧值
        attributeFilter: null,      // 监听所有属性（不限制）
        characterDataOldValue: true  // 记录文本旧值
      };

      // 开始监听
      observer.observe(target, config);
      console.log('✅ MutationObserver 已启动，正在监听变化...');
    })();
  `

  // 注入脚本
  await cdpSend(ws, 'Runtime.evaluate', {
    expression: script,
    returnByValue: true,
    awaitPromise: false
  })

  // 监听 console.log 输出
  ws.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch (e) {
      return
    }

    if (msg.method === 'Runtime.consoleAPICalled') {
      const { type, args } = msg.params
      const text = args.map((a) => {
        if (a.value !== undefined) return String(a.value)
        if (a.description) return a.description
        if (a.type === 'object') return a.subtype || '[Object]'
        return ''
      }).join(' ')
      console.log(` ${text}`)
    }
  })

  // 保持运行直到用户按 Ctrl+C
  await new Promise(() => {})
}

module.exports = { run }
