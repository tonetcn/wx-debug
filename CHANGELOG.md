# Changelog

## [2.0.0] - 2026-06-08

### ✨ 新增功能

#### 性能分析
- `perf` - 性能指标监控，查看 JS 堆大小、DOM 节点数等
- `memory` - 内存分析与 GC，检测内存泄漏
- `profile [秒数]` - CPU 性能分析，找出耗时函数

#### 网络调试
- `har` - 网络请求导出为 HAR 格式，可用 Chrome DevTools 分析

#### 设备模拟
- `device list` - 列出预置设备配置
- `device <名称>` - 切换设备模拟（iPhone SE/14/14 Pro Max/iPad/Android）

#### DOM 操作
- `tree [选择器]` - 结构化 DOM 查询，支持 CSS 选择器
- `style <选择器>` - CSS 规则查看，显示匹配的规则链
- `watch [选择器]` - 元素变化监听，调试动态渲染问题

#### 无障碍与导航
- `a11y` - 无障碍树分析，检查可访问性问题
- `nav history/back/forward/goto/refresh` - 页面导航与历史管理

#### 连接增强
- `--target app` - 支持连接逻辑层，可调用 `wx.switchTab` 等 API
- `--page <名称>` - 支持指定页面（index、cart、mine）

### 🐛 修复
- 修复 `tree` 命令中 `DOM.getChildren` 不存在的问题
- 修复 `style` 命令缺少 `DOM.enable` 调用的问题

## [1.0.0] - 2026-06-07

### ✨ 初始版本
- `read` - 读取页面内容
- `screenshot` - 截屏
- `console` - 监听控制台日志
- `errors` - 检查控制台错误
- `network` - 监听网络请求
- `dom` - 获取 DOM 结构
- `css <选择器>` - 获取元素样式
- `eval <代码>` - 执行 JavaScript
- `storage` - 查看本地存储
- `click <选择器>` - 模拟点击
- `input <选择器> <内容>` - 模拟输入
