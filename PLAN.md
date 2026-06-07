# wx-debug 方案设计

## 项目定位

```
wx-debug = 微信小程序调试工具 + Claude Code 专用
GitHub: https://github.com/tonetcn/wx-debug.git
```

## 核心功能

通过 Chrome DevTools Protocol (CDP) 直连微信开发者工具，读取小程序渲染层的页面内容、控制台日志、网络请求等。

## 功能清单

| 命令 | 功能 | 说明 |
|------|------|------|
| `wx-debug read` | 读取页面内容 | 默认命令，显示页面文本 |
| `wx-debug console` | 监听控制台 | 实时显示 console.log/error |
| `wx-debug network` | 监听网络 | 显示 API 请求和响应 |
| `wx-debug dom` | DOM 结构 | 树形显示页面结构 |
| `wx-debug css <选择器>` | 元素样式 | 获取计算后的 CSS 样式 |
| `wx-debug eval <代码>` | 执行 JS | 运行任意 JavaScript |
| `wx-debug storage` | 本地存储 | 查看 localStorage/sessionStorage |
| `wx-debug screenshot` | 截屏 | 保存页面截图到本地 |
| `wx-debug click <选择器>` | 模拟点击 | 点击页面元素 |
| `wx-debug input <选择器> <内容>` | 模拟输入 | 在输入框中输入文字 |

## 目录结构

```
wx-debug/
├── bin/
│   └── wx-debug.js           # 入口（#!/usr/bin/env node）
├── lib/
│   ├── cli.js                # 命令行解析
│   ├── cdp.js                # CDP 连接核心
│   ├── config.js             # 配置管理
│   ├── discovery.js          # 自动发现微信开发者工具
│   ├── tunnel.js             # SSH 隧道（远程调试）
│   └── commands/
│       ├── read.js           # 读取页面
│       ├── console.js        # 监听控制台
│       ├── network.js        # 监听网络
│       ├── dom.js            # DOM 结构
│       ├── css.js            # 元素样式
│       ├── eval.js           # 执行 JS
│       ├── storage.js        # 本地存储
│       ├── screenshot.js     # 截屏
│       ├── click.js          # 模拟点击
│       └── input.js          # 模拟输入
├── package.json
├── README.md
└── LICENSE
```

## 使用场景

### 场景一：本地使用

```bash
# 克隆
git clone https://github.com/tonetcn/wx-debug.git

# 安装依赖
cd wx-debug
npm install

# 使用
node bin/wx-debug.js read
node bin/wx-debug.js console
```

### 场景二：云端 Claude Code + 本地微信开发者工具（SSH 隧道）

```
云端服务器                          本地电脑
┌─────────────────┐              ┌─────────────────┐
│  Claude Code    │              │  微信开发者工具  │
│  wx-debug       │◄──SSH隧道──►│  CDP 端口 19890 │
└─────────────────┘              └─────────────────┘
```

配置方式：
```bash
# 本地电脑启动微信开发者工具（带调试端口）
微信开发者工具.exe --remote-debugging-port=19890

# 建立 SSH 隧道（本地执行）
ssh -R 19890:localhost:19890 user@cloud-server

# 云端 Claude Code 调用
wx-debug read
```

## 配置

### 自动发现（默认）

自动检测微信开发者工具路径：
- `C:\Program Files (x86)\微信web开发者工具\微信开发者工具.exe`
- `C:\Program Files\微信web开发者工具\微信开发者工具.exe`
- `D:\code\weixin\微信开发者工具.exe`

### 配置文件（可选）

`~/.wx-debug/config.json`：

```json
{
  "devtoolsPath": "自定义路径",
  "cdpPort": 19890,
  "autoLaunch": true,
  "tunnel": {
    "enabled": false,
    "host": "",
    "user": "root",
    "remotePort": 19890,
    "localPort": 19890
  }
}
```

## 技术要点

1. **CDP 连接**：通过 `http://localhost:{port}/json` 获取页面列表，用 WebSocket 连接小程序渲染页面
2. **页面识别**：type=webview 且 URL 包含 `__pageframe__` 的页面
3. **自动发现**：扫描常见安装路径 + Windows 注册表 + PATH 环境变量
4. **SSH 隧道**：通过 `ssh -R` 将本地 CDP 端口映射到远程服务器
