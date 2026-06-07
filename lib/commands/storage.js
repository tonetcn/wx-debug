/**
 * 查看本地存储
 */

const { cdpSend } = require('../cdp')

async function run(ws) {
  console.log(' 💾 本地存储:\n')

  const result = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `
      (function() {
        var data = {};
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          data['localStorage.' + key] = localStorage.getItem(key).substring(0, 100);
        }
        for (var i = 0; i < sessionStorage.length; i++) {
          var key = sessionStorage.key(i);
          data['sessionStorage.' + key] = sessionStorage.getItem(key).substring(0, 100);
        }
        return JSON.stringify(data, null, 2);
      })()
    `,
  })

  console.log(result.result.value)
}

module.exports = { run }
