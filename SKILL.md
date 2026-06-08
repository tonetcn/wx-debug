---
name: wx-debug
description: 微信小程序 CDP 调试工具 - 连接微信开发者工具，读取页面内容、控制台日志、网络请求
---

# wx-debug — 微信小程序调试工具

通过 Chrome DevTools Protocol (CDP) 直连微信开发者工具，让 Claude Code 能够"看到"你的小程序。

## 快速开始

### 1. 启动微信开发者工具（带 CDP 端口）

```bash
# Windows
"D:\code\weixin\微信开发者工具.exe" --remote-debugging-port=19890

# macOS
/Applications/wechatwebdevtools.app/Contents/MacOS/微信开发者工具 --remote-debugging-port=19890
```

### 2. 使用 wx-debug

```bash
# 读取页面内容
node .claude/skills/wx-debug/wx-debug.js read

# 截屏
node .claude/skills/wx-debug/wx-debug.js screenshot

# 监听控制台
node .claude/skills/wx-debug/wx-debug.js console

# 监听网络请求
node .claude/skills/wx-debug/wx-debug.js network
```

## 功能

### 基础调试

| 命令 | 功能 | 说明 |
|------|------|------|
| `read` | 读取页面内容 | 显示页面文本，检查是否有错误 |
| `screenshot` | 截屏 | 保存页面截图到 ~/.wx-debug/screenshots/ |
| `console` | 监听控制台 | 实时显示 console.log/error |
| `errors` | 检查错误 | 快速定位运行时错误 |
| `network` | 监听网络 | 显示 API 请求和响应 |
| `dom` | DOM 结构 | 树形显示页面结构 |
| `css <选择器>` | 元素样式 | 获取计算后的 CSS 样式 |
| `eval <代码>` | 执行 JS | 运行任意 JavaScript |
| `storage` | 本地存储 | 查看 localStorage/sessionStorage |
| `click <选择器>` | 模拟点击 | 点击页面元素 |
| `input <选择器> <内容>` | 模拟输入 | 在输入框中输入文字 |

### 性能分析

| 命令 | 功能 | 说明 |
|------|------|------|
| `perf` | 性能指标 | 查看 JS 堆大小、DOM 节点数等 |
| `memory` | 内存分析 | 触发 GC，检测内存泄漏 |
| `profile [秒数]` | CPU 分析 | 找出耗时函数 |

### 网络调试

| 命令 | 功能 | 说明 |
|------|------|------|
| `har` | 导出 HAR | 导出网络请求为标准格式 |

### 设备模拟

| 命令 | 功能 | 说明 |
|------|------|------|
| `device list` | 列出设备 | 查看预置设备配置 |
| `device <名称>` | 切换设备 | 模拟不同屏幕尺寸 |

### DOM 操作

| 命令 | 功能 | 说明 |
|------|------|------|
| `tree [选择器]` | DOM 查询 | 结构化查询，支持 CSS 选择器 |
| `style <选择器>` | CSS 规则 | 查看匹配的 CSS 规则链 |
| `watch [选择器]` | 元素监听 | 监听属性/子节点变化 |

### 无障碍与导航

| 命令 | 功能 | 说明 |
|------|------|------|
| `a11y` | 无障碍分析 | 检查可访问性问题 |
| `nav history` | 导航历史 | 查看页面跳转记录 |

## 工作原理

1. 连接 `http://localhost:19890/json` 获取页面列表
2. 查找小程序渲染页面（URL 含 `__pageframe__`）
3. 通过 WebSocket 连接该页面
4. 执行 CDP 命令读取 DOM 内容、控制台日志等
5. 格式化输出结果

## Claude Code 自动化流程

Claude Code 可以完全自主地调试小程序：

```
用户: "帮我看看首页显示对不对"
  ↓
wx-debug read → Claude Code 看到页面内容 → 分析是否正常
  ↓
wx-debug screenshot → Claude Code 看到界面截图 → 发现布局问题
  ↓
Claude Code 自动修改代码 → 再次 wx-debug 验证
```

## 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CDP_PORT` | CDP 调试端口 | `19890` |
| `CDP_HOST` | CDP 主机地址 | `localhost` |

### 配置文件

位置：`~/.wx-debug/config.json`

```json
{
  "cdpPort": 19890,
  "cdpHost": "localhost"
}
```

## 常见问题

### Q: 连接不上 CDP 端口？

```bash
# 检查端口是否开放
netstat -ano | findstr 19890

# 如果没有输出，说明微信开发者工具没有带调试端口启动
# 需要关闭微信开发者工具，用以下命令重新启动：
"D:\code\weixin\微信开发者工具.exe" --remote-debugging-port=19890
```

### Q: 找不到小程序页面？

确认微信开发者工具中已打开项目，且模拟器中已加载页面。

### Q: 截屏是黑色的？

确保连接的是 `__pageframe__` 页面（渲染层），不是 `appservice` 页面（逻辑层）。wx-debug 会自动选择正确的页面。
