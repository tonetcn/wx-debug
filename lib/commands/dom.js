/**
 * 获取 DOM 结构
 */

const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 🌳 DOM 结构:\n')

  const result = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      (function() {
        function getTree(el, depth) {
          if (depth > 3) return '';
          var indent = '  '.repeat(depth);
          var tag = el.tagName.toLowerCase();
          var id = el.id ? '#' + el.id : '';
          var cls = el.className ? '.' + (typeof el.className === 'string' ? el.className.split(' ').join('.') : '') : '';
          var text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
            ? ' "' + el.textContent.substring(0, 30) + '"'
            : '';
          var result = indent + '<' + tag + id + cls + '>' + text + '\\n';
          for (var i = 0; i < el.children.length && i < 10; i++) {
            result += getTree(el.children[i], depth + 1);
          }
          if (el.children.length > 10) {
            result += indent + '  ... 还有 ' + (el.children.length - 10) + ' 个子元素\\n';
          }
          return result;
        }
        return getTree(document.body, 0);
      })()
    `,
  })

  console.log(result.result.value)
}

module.exports = { run }
