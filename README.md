# wx-debug 🔍

微信小程序调试工具 — 专为 Claude Code 设计

通过 Chrome DevTools Protocol (CDP) 直连微信开发者工具，读取小程序渲染层的页面内容、控制台日志、网络请求等。

## 安装

```bash
git clone https://github.com/tonetcn/wx-debug.git
cd wx-debug
npm install
```

## 快速开始

### 1. 启动微信开发者工具（带调试端口）

```bash
"微信开发者工具.exe" --remote-debugging-port=19890
```

### 2. 打开你的小程序项目

在微信开发者工具中手动打开项目。

### 3. 使用 wx-debug

```bash
# 读取页面内容
node bin/wx-debug.js read

# 监听控制台
node bin/wx-debug.js console

# 监听网络请求
node bin/wx-debug.js network
```

## 功能

| 命令 | 功能 | 说明 |
|------|------|------|
| `read` | 读取页面内容 | 默认命令，显示页面文本、标题、URL |
| `console` | 监听控制台 | 实时显示 console.log/error/warn |
| `network` | 监听网络 | 显示 API 请求和响应 |
| `dom` | DOM 结构 | 树形显示页面结构 |
| `css <选择器>` | 元素样式 | 获取计算后的 CSS 样式 |
| `eval <代码>` | 执行 JS | 运行任意 JavaScript |
| `storage` | 本地存储 | 查看 localStorage/sessionStorage |
| `screenshot` | 截屏 | 保存页面截图到本地 |
| `click <选择器>` | 模拟点击 | 点击页面元素 |
| `input <选择器> <内容>` | 模拟输入 | 在输入框中输入文字 |

## 远程调试（云端 Claude Code + 本地微信开发者工具）

适用于 Claude Code 部署在云端服务器，需要调试本地微信小程序的场景。

```
云端服务器                          本地电脑
┌─────────────────┐              ┌─────────────────┐
│  Claude Code    │              │  微信开发者工具  │
│  wx-debug       │◄──SSH隧道──►│  CDP 端口 19890 │
└─────────────────┘              └─────────────────┘
```

### 配置步骤

```bash
# 1. 本地电脑启动微信开发者工具（带调试端口）
"微信开发者工具.exe" --remote-debugging-port=19890

# 2. 建立 SSH 隧道（本地执行）
ssh -R 19890:localhost:19890 user@cloud-server

# 3. 云端调用
node bin/wx-debug.js read
```

## 配置文件

创建 `~/.wx-debug/config.json` 可自定义配置（可选）：

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

wx-debug 会自动检测微信开发者工具的安装路径，支持：
- 常见安装路径扫描
- Windows 注册表读取
- PATH 环境变量查找

## Claude Code 集成

wx-debug 可作为 Claude Code 的 skill 使用：

```bash
# 在 Claude Code 中调用
cd wx-debug
node bin/wx-debug.js read
node bin/wx-debug.js console
node bin/wx-debug.js network
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CDP_PORT` | CDP 端口 | `19890` |
| `CDP_HOST` | CDP 主机 | `localhost` |

## 许可证

MIT
