#!/usr/bin/env node
/**
 * wx-debug — 微信小程序调试工具
 * 通过 Chrome DevTools Protocol 连接微信开发者工具，读取小程序页面内容
 */

const path = require('path')
const { parseArgs } = require(path.join(__dirname, '..', 'lib', 'cli'))

parseArgs(process.argv.slice(2))
