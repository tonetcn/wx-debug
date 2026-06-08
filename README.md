# wx-debug 🔍

> **微信小程序调试工具** — 专为 Claude Code 设计，让 AI 能够"看到"你的小程序

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D14-brightgreen.svg)](https://nodejs.org)

---

## 🤔 为什么需要 wx-debug？

当你用 Claude Code 开发微信小程序时，最大的痛点是什么？

**Claude Code 看不到你的小程序界面。**

它只能看到代码，却不知道代码运行后长什么样。有了 wx-debug：

```
你说: "帮我看看首页显示对不对"
  ↓
wx-debug 截屏 → Claude Code 看到界面 → 发现布局问题 → 自动修复
  ↓
wx-debug 再次截屏 → 确认修复成功 ✅
```

**这就是 AI 驱动的小程序开发闭环。**

---

## ✨ 功能特性

| 命令 | 功能 | 使用场景 |
|------|------|----------|
| `read` | 读取页面文本内容 | 查看页面显示了什么 |
| `screenshot` | 截屏 | 让 Claude Code "看到"界面 |
| `console` | 监听控制台日志 | 实时查看 console.log/error |
| `errors` | 检查控制台错误 | 快速定位运行时错误 |
| `network` | 监听网络请求 | 调试 API 接口调用 |
| `dom` | 获取 DOM 结构 | 分析页面组件结构 |
| `css <选择器>` | 获取元素样式 | 调试样式问题 |
| `eval <代码>` | 执行 JavaScript | 动态测试代码 |
| `storage` | 查看本地存储 | 检查缓存数据 |
| `click <选择器>` | 模拟点击 | 自动化测试 |
| `input <选择器> <内容>` | 模拟输入 | 自动化测试 |

---

## 🚀 快速开始

### 方式一：Claude Code Skill（推荐）

一行命令安装为 Claude Code 的 slash command：

```bash
# 1. 进入你的小程序项目目录
cd your-miniprogram-project

# 2. 一行命令安装
curl -fsSL https://raw.githubusercontent.com/tonetcn/wx-debug/main/install.sh | bash
```

安装完成后，在 Claude Code 中即可使用：

```
/wx-debug read          # 读取页面内容
/wx-debug screenshot    # 截屏
/wx-debug console       # 监听控制台
/wx-debug network       # 监听网络请求
```

> 💡 `install.sh` 会自动在你的项目中创建 `.claude/skills/wx-debug/` 目录，无需手动操作。

### 方式二：本地使用（开发者）

```bash
# 1. 克隆项目
git clone https://github.com/tonetcn/wx-debug.git
cd wx-debug

# 2. 安装依赖
npm install

# 3. 启动微信开发者工具（带调试端口）
# Windows:
"D:\code\weixin\微信开发者工具.exe" --remote-debugging-port=19890
# macOS:
/Applications/wechatwebdevtools.app/Contents/MacOS/微信开发者工具 --remote-debugging-port=19890

# 4. 在微信开发者工具中打开你的小程序项目

# 5. 使用 wx-debug
node bin/wx-debug.js read          # 读取页面内容
node bin/wx-debug.js screenshot    # 截屏
node bin/wx-debug.js console       # 监听控制台
```

---

## 🌐 远程调试（云端 Claude Code + 本地微信开发者工具）

> 适用于：Claude Code 部署在云服务器，微信开发者工具在本地电脑

### 架构图

```
┌─────────────────────┐         SSH 隧道         ┌─────────────────────┐
│   云服务器           │ ◄──────────────────────► │   本地电脑           │
│                     │    端口 19890 转发        │                     │
│  ┌───────────────┐  │                          │  ┌───────────────┐  │
│  │  Claude Code  │  │                          │  │ 微信开发者工具 │  │
│  │  wx-debug     │──┼──── localhost:19890 ─────┼──│ CDP 端口 19890 │  │
│  └───────────────┘  │                          │  └───────────────┘  │
└─────────────────────┘                          └─────────────────────┘
```

### 配置步骤

#### 步骤 1：本地电脑启动微信开发者工具

```bash
# Windows
"D:\code\weixin\微信开发者工具.exe" --remote-debugging-port=19890

# macOS
/Applications/wechatwebdevtools.app/Contents/MacOS/微信开发者工具 --remote-debugging-port=19890
```

#### 步骤 2：建立 SSH 隧道

在**本地电脑**执行：

```bash
# 基本命令
ssh -R 19890:localhost:19890 user@your-cloud-server

# 示例（假设云服务器 IP 为 8.8.8.8，用户名为 root）
ssh -R 19890:localhost:19890 root@8.8.8.8

# 如果需要保持连接，使用 autossh
autossh -M 0 -f -N -R 19890:localhost:19890 root@8.8.8.8
```

#### 步骤 3：云服务器上使用 wx-debug

```bash
# 克隆并安装
git clone https://github.com/tonetcn/wx-debug.git
cd wx-debug
npm install

# 使用（通过 SSH 隧道连接本地微信开发者工具）
node bin/wx-debug.js read
node bin/wx-debug.js screenshot
```

### 配置文件（可选）

创建 `~/.wx-debug/config.json` 自定义配置：

```json
{
  "cdpPort": 19890,
  "cdpHost": "localhost",
  "tunnel": {
    "enabled": true,
    "host": "your-cloud-server",
    "user": "root",
    "remotePort": 19890,
    "localPort": 19890
  }
}
```

---

## 📖 使用示例

### 示例 1：查看页面内容

```bash
$ node bin/wx-debug.js read

 📍 页面标题: Webview: pages/index/index
 📍 页面 URL: http://127.0.0.1:50488/__pageframe__/pages/index/index

 📝 页面内容预览:
──────────────────────────────────────────────────
    杭州 · 西湖区
    搜索新鲜水果、有机蔬菜...
    限时特惠
    新人专享 · 首单立减20元
    ...
──────────────────────────────────────────────────

 ✅ 未检测到明显错误
```

### 示例 2：截屏

```bash
$ node bin/wx-debug.js screenshot

 📸 截屏中...
 ✅ 截屏已保存: C:\Users\yourname\.wx-debug\screenshots\screenshot_1780822182818.png
```

### 示例 3：监听控制台

```bash
$ node bin/wx-debug.js console

 📋 监听控制台日志（按 Ctrl+C 停止）...

 [14:32:15] 📝 log: 页面加载完成
 [14:32:16] ⚠️ warn: 数据接口响应较慢
 [14:32:17] ❌ error: TypeError: Cannot read property 'name' of undefined
```

### 示例 4：监听网络请求

```bash
$ node bin/wx-debug.js network

 🌐 监听网络请求（按 Ctrl+C 停止）...

 📤 [GET] https://api.example.com/products
 📥 [200] https://api.example.com/products
 📤 [POST] https://api.example.com/cart
 📥 [200] https://api.example.com/cart
```

### 示例 5：执行 JavaScript

```bash
$ node bin/wx-debug.js eval "wx.getSystemInfoSync()"

 ⚡ 执行代码: wx.getSystemInfoSync()...

 ✅ 结果:
{
  "brand": "iPhone",
  "model": "iPhone 14",
  "system": "iOS 16.0",
  ...
}
```

---

## ⚙️ 配置

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
  "cdpHost": "localhost",
  "devtoolsPath": "D:\\code\\weixin\\微信开发者工具.exe",
  "autoLaunch": false,
  "tunnel": {
    "enabled": false,
    "host": "",
    "user": "root",
    "remotePort": 19890,
    "localPort": 19890
  }
}
```

### 自动发现

wx-debug 会自动检测微信开发者工具的安装路径：
- Windows 常见安装路径
- Windows 注册表
- PATH 环境变量

---

## 🔧 与 Claude Code 集成

### 方法 1：作为 Slash Command

在你的项目中创建 `.claude/commands/wx-debug.md`：

```markdown
使用 wx-debug 检查小程序状态：

1. 运行 `node D:\code\wx-debug\bin\wx-debug.js read` 查看页面内容
2. 运行 `node D:\code\wx-debug\bin\wx-debug.js errors` 检查错误
3. 如果发现问题，分析代码并修复
4. 修复后再次运行 read 确认
```

### 方法 2：作为 Skill

在 `.claude/skills/` 目录下创建 `wx-debug/` 文件夹，放入 `SKILL.md` 和 `mp-check.js`。

---

## 🐛 常见问题

### Q: 连接不上 CDP 端口？

```bash
# 检查端口是否开放
netstat -ano | findstr 19890

# 如果没有输出，说明微信开发者工具没有带调试端口启动
# 需要关闭微信开发者工具，用以下命令重新启动：
"D:\code\weixin\微信开发者工具.exe" --remote-debugging-port=19890
```

### Q: 找不到小程序页面？

```bash
# 确认微信开发者工具中已打开项目
# 确认模拟器中已加载页面（不是空白）

# 查看所有可用页面
curl http://localhost:19890/json
```

### Q: 截屏是黑色的？

确保连接的是 `__pageframe__` 页面（渲染层），不是 `appservice` 页面（逻辑层）。wx-debug 会自动选择正确的页面。

### Q: SSH 隧道断开了？

```bash
# 使用 autossh 保持连接
autossh -M 0 -f -N -R 19890:localhost:19890 user@server

# 或者在服务器上设置 systemd 服务
```

---

## 📁 项目结构

```
wx-debug/
├── bin/
│   └── wx-debug.js           # 入口文件
├── lib/
│   ├── cli.js                # 命令行解析
│   ├── cdp.js                # CDP 连接核心
│   ├── config.js             # 配置管理
│   └── commands/
│       ├── read.js           # 读取页面内容
│       ├── screenshot.js     # 截屏
│       ├── console.js        # 监听控制台
│       ├── errors.js         # 检查错误
│       ├── network.js        # 监听网络
│       ├── dom.js            # DOM 结构
│       ├── css.js            # 元素样式
│       ├── eval.js           # 执行 JS
│       ├── storage.js        # 本地存储
│       ├── click.js          # 模拟点击
│       └── input.js          # 模拟输入
├── package.json
├── README.md
└── LICENSE
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的修改 (`git commit -m '添加某个功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## ⚠️ 免责声明

本项目是一个开源工具，旨在辅助微信小程序的开发与调试。微信开发者工具及其相关知识产权归腾讯公司所有，本项目与腾讯公司无关，仅用于技术交流和学习目的。

- 本项目不收集任何用户数据
- 本项目不会修改微信开发者工具的任何文件
- 使用本工具进行开发调试所产生的后果由用户自行承担
- 如有任何问题或建议，请联系：[beijing2118@163.com](mailto:beijing2118@163.com)

---

## 🙏 致谢

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) - 底层调试协议
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) - 官方开发工具
- [Claude Code](https://claude.ai/code) - AI 编程助手

---

<p align="center">
  <b>让 AI 看到你的小程序，开启智能调试新时代 🚀</b>
</p>
