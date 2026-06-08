#!/bin/bash
# wx-debug 一键安装脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/tonetcn/wx-debug/master/install.sh | bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# GitHub 仓库地址
REPO="tonetcn/wx-debug"
BRANCH="master"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

# 目标目录
TARGET_DIR=".claude/skills/wx-debug"

echo ""
echo "🔍 wx-debug 安装脚本"
echo "==================="
echo ""

# 检查是否在项目目录
if [ ! -d ".claude" ] && [ ! -f "package.json" ] && [ ! -f "app.json" ]; then
    echo -e "${YELLOW}⚠️  警告: 当前目录可能不是项目根目录${NC}"
    echo "   建议先进入你的小程序项目目录再执行安装"
    echo ""
    read -p "是否继续安装？(y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消安装"
        exit 1
    fi
fi

# 创建目标目录
echo -e "${GREEN}📁 创建目录: ${TARGET_DIR}${NC}"
mkdir -p "${TARGET_DIR}"

# 下载文件
echo -e "${GREEN}📥 下载 wx-debug 文件...${NC}"

# 下载 SKILL.md
echo "   - SKILL.md"
curl -fsSL "${BASE_URL}/SKILL.md" -o "${TARGET_DIR}/SKILL.md"

# 下载主脚本
echo "   - wx-debug.js"
curl -fsSL "${BASE_URL}/bin/wx-debug.js" -o "${TARGET_DIR}/wx-debug.js"

# 下载 lib 目录
echo "   - lib/"
mkdir -p "${TARGET_DIR}/lib"
curl -fsSL "${BASE_URL}/lib/cli.js" -o "${TARGET_DIR}/lib/cli.js"
curl -fsSL "${BASE_URL}/lib/cdp.js" -o "${TARGET_DIR}/lib/cdp.js"
curl -fsSL "${BASE_URL}/lib/config.js" -o "${TARGET_DIR}/lib/config.js"

# 下载 commands 目录
echo "   - lib/commands/"
mkdir -p "${TARGET_DIR}/lib/commands"
for cmd in read screenshot console errors network dom css eval storage click input; do
    curl -fsSL "${BASE_URL}/lib/commands/${cmd}.js" -o "${TARGET_DIR}/lib/commands/${cmd}.js"
done

# 下载 package.json
echo "   - package.json"
curl -fsSL "${BASE_URL}/package.json" -o "${TARGET_DIR}/package.json"

# 安装依赖
echo -e "${GREEN}📦 安装依赖...${NC}"
cd "${TARGET_DIR}"
npm install --production 2>/dev/null || {
    echo -e "${YELLOW}⚠️  依赖安装失败，请手动执行: cd ${TARGET_DIR} && npm install${NC}"
}
cd - > /dev/null

echo ""
echo -e "${GREEN}✅ 安装完成！${NC}"
echo ""
echo "📂 已安装到: ${TARGET_DIR}/"
echo ""
echo "🚀 使用方法:"
echo "   1. 启动微信开发者工具（带调试端口）:"
echo "      \"微信开发者工具.exe\" --remote-debugging-port=19890"
echo ""
echo "   2. 在 Claude Code 中使用:"
echo "      /wx-debug read          # 读取页面内容"
echo "      /wx-debug screenshot    # 截屏"
echo "      /wx-debug console       # 监听控制台"
echo "      /wx-debug network       # 监听网络请求"
echo ""
echo "📖 文档: https://github.com/${REPO}"
echo ""
