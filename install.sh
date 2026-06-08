#!/bin/bash
# wx-debug 安装脚本 v2
# 用法: curl -fsSL https://raw.githubusercontent.com/tonetcn/wx-debug/master/install.sh | bash

set -e

REPO="tonetcn/wx-debug"
BRANCH="master"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
TARGET_DIR=".claude/skills/wx-debug"

echo ""
echo "🔍 wx-debug 安装脚本"
echo "==================="
echo ""

# 创建目标目录
echo "📁 创建目录: ${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"

# 下载文件
echo "📥 下载文件..."

echo "   - SKILL.md"
curl -fsSL "${BASE_URL}/SKILL.md" -o "${TARGET_DIR}/SKILL.md"

echo "   - wx-debug.js"
curl -fsSL "${BASE_URL}/bin/wx-debug.js" -o "${TARGET_DIR}/wx-debug.js"
# 修复路径引用：bin/wx-debug.js 用 ../lib，安装后 lib 在同级目录
sed -i "s|path.join(__dirname, '..', 'lib', 'cli')|path.join(__dirname, 'lib', 'cli')|g" "${TARGET_DIR}/wx-debug.js"

echo "   - lib/"
mkdir -p "${TARGET_DIR}/lib"
curl -fsSL "${BASE_URL}/lib/cli.js" -o "${TARGET_DIR}/lib/cli.js"
curl -fsSL "${BASE_URL}/lib/cdp.js" -o "${TARGET_DIR}/lib/cdp.js"
curl -fsSL "${BASE_URL}/lib/config.js" -o "${TARGET_DIR}/lib/config.js"

echo "   - lib/commands/"
mkdir -p "${TARGET_DIR}/lib/commands"
for cmd in read screenshot console errors network dom css eval storage click input; do
    curl -fsSL "${BASE_URL}/lib/commands/${cmd}.js" -o "${TARGET_DIR}/lib/commands/${cmd}.js"
done

echo "   - package.json"
curl -fsSL "${BASE_URL}/package.json" -o "${TARGET_DIR}/package.json"

# 安装依赖
echo "📦 安装依赖..."
cd "${TARGET_DIR}"
npm install --production 2>/dev/null || echo "⚠️  依赖安装失败，请手动执行: cd ${TARGET_DIR} && npm install"
cd - > /dev/null

echo ""
echo "✅ 安装完成！"
echo ""
echo "📂 已安装到: ${TARGET_DIR}/"
echo ""
echo "🚀 使用方法:"
echo "   1. 启动微信开发者工具（带调试端口）:"
echo '      "微信开发者工具.exe" --remote-debugging-port=19890'
echo ""
echo "   2. 在 Claude Code 中使用:"
echo "      /wx-debug read          # 读取页面内容"
echo "      /wx-debug screenshot    # 截屏"
echo "      /wx-debug console       # 监听控制台"
echo "      /wx-debug network       # 监听网络请求"
echo ""
echo "📖 文档: https://github.com/${REPO}"
echo ""
